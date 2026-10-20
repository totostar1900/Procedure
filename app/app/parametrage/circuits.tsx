"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { Cfm, FL, FONCTIONS, Membre, MoiC, msg, t } from "../../lib/admin-ui";

// Circuits d'approbation et délais, par type de document (kv circuits/<type>, prérogative « circuits »).
// Même format que la page du référentiel, qui lit ces réglages : etapes[], delaiLecture ; circuits/_suivi : seuil d'alerte.
export type DocC = { id: string; type: string; circuit: Etape[] };
type Etape = { etape?: string; label: string; role: string; fonction?: string; regle?: string; obligatoire?: boolean; seance?: boolean; delai?: number };
type Cfg = { type?: string; etapes?: Etape[]; delaiLecture?: number; seuil?: number; maj?: string; par?: string };
const REGLES: [string, string][] = [["un", "une personne"], ["tous", "toutes les personnes"], ["majorite", "la majorité"]];
const typeKey = (s: string) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const norm = (s: Etape): Required<Etape> => ({ etape: s.etape || "", label: s.label, role: s.role, fonction: s.fonction || FL[s.role] || s.role, regle: s.regle || "un", obligatoire: s.obligatoire !== false, seance: s.seance != null ? !!s.seance : s.etape === "adoption", delai: Number(s.delai) > 0 ? Number(s.delai) : 7 });
const borne = (v: unknown, d: number) => Math.max(1, Math.min(180, Number(v) || d));

export function useCircuits(sb: SupabaseClient) {
  const [cfg, setCfg] = useState<Record<string, Cfg>>({});
  const charger = useCallback(async () => {
    const { data } = await sb.from("kv").select("path,data").like("path", "circuits/%");
    setCfg(Object.fromEntries((data || []).map((r: { path: string; data: Cfg }) => [r.path.slice(9), r.data])));
  }, [sb]);
  useEffect(() => { charger(); }, [charger]);
  return { cfg, charger };
}

export function Circuits({ sb, docs, ms, moi, cfg, charger, note, demander }: {
  sb: SupabaseClient; docs: DocC[]; ms: Membre[]; moi: MoiC; cfg: Record<string, Cfg>; charger: () => void;
  note: (t: "ok" | "err", m: string) => void; demander: (c: Cfm) => void;
}) {
  const types = docs.map((d) => d.type).filter((x, i, a) => a.indexOf(x) === i);
  const [ed, setEd] = useState<{ k: string; steps: Required<Etape>[]; lect: number } | null>(null);
  const defaut = (ty: string) => (docs.find((d) => d.type === ty)?.circuit || []).map(norm);
  const etapes = (ty: string) => { const c = cfg[typeKey(ty)]; return c && c.etapes && c.etapes.length ? c.etapes.map(norm) : defaut(ty); };
  const lecture = (ty: string) => { const c = cfg[typeKey(ty)]; return c && Number(c.delaiLecture) > 0 ? Number(c.delaiLecture) : 15; };
  const titulaires = (role: string) => ms.filter((m) => m.actif && m.fonctions.includes(role)).length;
  const problemes = (steps: Required<Etape>[]) => {
    const out: string[] = [];
    if (!steps.some((s) => s.obligatoire)) out.push("aucune étape obligatoire");
    steps.forEach((s, i) => {
      if (ms.length && !titulaires(s.role)) out.push("« " + s.label + " » : aucune personne active n'a la fonction " + (FL[s.role] || s.role));
      steps.forEach((o, j) => { if (ms.length && j > i && o.role === s.role && titulaires(s.role) < 2) out.push("« " + s.label + " » et « " + o.label + " » demandent la même fonction, détenue par une seule personne : la règle des quatre yeux bloquera le circuit"); });
    });
    return out;
  };

  function preparer(ty: string, steps: Required<Etape>[], lect: number) {
    const used: Record<string, number> = {};
    return {
      type: ty, delaiLecture: borne(lect, 15), maj: new Date().toISOString(), par: moi.email,
      etapes: steps.map((x) => {
        const base = x.etape || (x.seance ? "adoption" : /v[ée]rif/i.test(x.label) ? "verification" : /approb/i.test(x.label) ? "approbation" : typeKey(x.label) || "etape");
        let e = base, n = 2; while (used[e]) e = base + "-" + n++; used[e] = 1;
        return { etape: e, label: String(x.label || "").trim(), role: x.role, fonction: FL[x.role] || x.role, regle: x.regle || "un", obligatoire: x.obligatoire !== false, seance: !!x.seance, delai: borne(x.delai, 7) };
      }),
    };
  }
  async function ecrire(k: string, data: Cfg, ok: string) {
    const { error } = await sb.from("kv").upsert({ path: "circuits/" + k, data });
    if (error) note("err", msg(error)); else { note("ok", ok); setEd(null); charger(); }
  }
  function enregistrer() {
    if (!ed) return;
    const ty = types.find((x) => typeKey(x) === ed.k)!;
    const data = preparer(ty, ed.steps, ed.lect);
    if (!data.etapes.length || data.etapes.some((x) => !x.label)) { note("err", "Chaque étape doit avoir un nom."); return; }
    if (!data.etapes.some((x) => x.obligatoire)) { note("err", "Le circuit doit comporter au moins une étape obligatoire."); return; }
    const go = () => ecrire(ed.k, data, "Circuit des documents de type « " + ty + " » enregistré.");
    if (moi.super) { go(); return; }
    demander({ titre: "Modifier le circuit des documents de type « " + ty + " »", phrase: "modifier le circuit " + ty, bouton: "Enregistrer le circuit", ok: go,
      points: [...data.etapes.map((x, i) => (i + 1) + ". " + x.label + " — " + x.fonction + " · " + x.delai + " j" + (x.obligatoire ? "" : " · facultative")), "S'applique aux versions dont le circuit n'a pas encore commencé ; une version déjà visée garde le circuit de son premier visa.", ...problemes(ed.steps).map((m) => "Attention : " + m)] });
  }
  function retablir(ty: string) {
    const go = async () => { const { error } = await sb.from("kv").delete().eq("path", "circuits/" + typeKey(ty)); if (error) note("err", msg(error)); else { note("ok", "Le type « " + ty + " » reprend le circuit déclaré dans chaque document."); setEd(null); charger(); } };
    if (moi.super) { go(); return; }
    demander({ titre: "Revenir au circuit déclaré dans les documents", phrase: "rétablir le circuit " + ty, bouton: "Rétablir", ok: go, points: ["Chaque document de ce type reprend le circuit inscrit dans son en-tête.", "Les versions déjà visées gardent le circuit de leur premier visa."] });
  }
  const maj = (i: number, part: Partial<Etape>) => ed && setEd({ ...ed, steps: ed.steps.map((s, j) => (j === i ? { ...s, ...part } : s)) });
  const bouger = (i: number, d: number) => { if (!ed) return; const s = [...ed.steps]; const j = i + d; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; setEd({ ...ed, steps: s }); };

  return (
    <div className="ctypes">
      {types.map((ty) => {
        const k = typeKey(ty), n = docs.filter((d) => d.type === ty).length, perso = !!cfg[k];
        if (ed && ed.k === k) {
          const pb = problemes(ed.steps);
          return (
            <article key={k} className="ct edit">
              <header><div><h3>{ty} — {t("modification")}</h3><small>{n} document{n > 1 ? "s" : ""} · s&apos;applique aux versions dont le circuit n&apos;a pas commencé</small></div></header>
              <ol className="ced">
                {ed.steps.map((s, i) => (
                  <li key={i}>
                    <b className="n">{i + 1}</b>
                    <label>Étape<input id={"ce-" + k + "-" + i + "-l"} value={s.label} maxLength={80} onChange={(e) => maj(i, { label: e.target.value })} /></label>
                    <label>Fonction<select id={"ce-" + k + "-" + i + "-f"} value={s.role} onChange={(e) => maj(i, { role: e.target.value })}>{FONCTIONS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select></label>
                    <label>Qui doit viser<select id={"ce-" + k + "-" + i + "-r"} value={s.regle} onChange={(e) => maj(i, { regle: e.target.value })}>{REGLES.map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select></label>
                    <label>Délai (jours)<input id={"ce-" + k + "-" + i + "-d"} type="number" min={1} max={180} value={s.delai} onChange={(e) => maj(i, { delai: Number(e.target.value) })} /></label>
                    <span className="opts">
                      <label className="chk"><input type="checkbox" checked={s.obligatoire} onChange={(e) => maj(i, { obligatoire: e.target.checked })} /> Obligatoire</label>
                      <label className="chk"><input type="checkbox" checked={s.seance} onChange={(e) => maj(i, { seance: e.target.checked })} /> Date de séance et PV</label>
                    </span>
                    <span className="mv">
                      <button type="button" aria-label="Monter" disabled={!i} onClick={() => bouger(i, -1)}>↑</button>
                      <button type="button" aria-label="Descendre" disabled={i === ed.steps.length - 1} onClick={() => bouger(i, 1)}>↓</button>
                      <button type="button" aria-label="Retirer" onClick={() => setEd({ ...ed, steps: ed.steps.filter((_, j) => j !== i) })}>×</button>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="tools">
                <button type="button" className="btn sec" onClick={() => setEd({ ...ed, steps: [...ed.steps, norm({ label: "Nouvelle étape", role: "dg" })] })}>+ Ajouter une étape</button>
                <label className="lect">Prise de connaissance après adoption <input id={"ce-" + k + "-lect"} type="number" min={1} max={180} value={ed.lect} onChange={(e) => setEd({ ...ed, lect: Number(e.target.value) })} /> jours</label>
              </div>
              {pb.length ? <ul className="warn liste">{pb.map((m) => <li key={m}>{m}</li>)}</ul> : null}
              <div className="tools">
                <button type="button" className="btn primary" onClick={enregistrer}>Enregistrer le circuit</button>
                <button type="button" className="btn sec" onClick={() => setEd(null)}>Annuler</button>
                {perso ? <button type="button" className="lnk" onClick={() => retablir(ty)}>Revenir au circuit déclaré dans les documents</button> : null}
              </div>
            </article>
          );
        }
        const st = etapes(ty), pb = problemes(st);
        return (
          <article key={k} className="ct">
            <header>
              <div><h3>{ty}</h3><small>{n} document{n > 1 ? "s" : ""} · {st.length} étape{st.length > 1 ? "s" : ""} · {perso ? t("défini ici") : t("circuit déclaré dans les documents")}</small></div>
              <button type="button" className="btn sec" onClick={() => setEd({ k, steps: JSON.parse(JSON.stringify(st)), lect: lecture(ty) })}>Modifier</button>
            </header>
            <ol className="chain">
              {st.map((s, i) => <li key={i} className={s.obligatoire ? "" : "opt"}><span className="n">{i + 1}</span><span><b>{s.label}</b> · {FL[s.role] || s.fonction}{s.regle !== "un" ? " · " + (REGLES.find((r) => r[0] === s.regle) || ["", ""])[1] : ""}{s.seance ? " · " + t("séance et PV") : ""}{s.obligatoire ? "" : " · " + t("facultative")}</span><span className="d">{s.delai} j</span></li>)}
              <li className="end"><span className="n">✓</span><span>Prise de connaissance · personnes désignées</span><span className="d">{lecture(ty)} j</span></li>
            </ol>
            {pb.length ? <ul className="warn liste">{pb.map((m) => <li key={m}>{m}</li>)}</ul> : null}
          </article>
        );
      })}
    </div>
  );
}

// Délais : tous les délais des circuits sur une grille, et le seuil d'alerte « bientôt en retard »
export function Delais({ sb, docs, moi, cfg, charger, note }: { sb: SupabaseClient; docs: DocC[]; moi: MoiC; cfg: Record<string, Cfg>; charger: () => void; note: (t: "ok" | "err", m: string) => void }) {
  const types = docs.map((d) => d.type).filter((x, i, a) => a.indexOf(x) === i);
  const base = useCallback(() => Object.fromEntries(types.map((ty) => {
    const c = cfg[typeKey(ty)];
    const st = c && c.etapes && c.etapes.length ? c.etapes.map(norm) : (docs.find((d) => d.type === ty)?.circuit || []).map(norm);
    return [ty, { steps: st, lect: c && Number(c.delaiLecture) > 0 ? Number(c.delaiLecture) : 15 }];
  })) as Record<string, { steps: Required<Etape>[]; lect: number }>, [cfg, docs]); // eslint-disable-line react-hooks/exhaustive-deps
  const [g, setG] = useState(base);
  const [seuil, setSeuil] = useState(75);
  useEffect(() => { setG(base()); setSeuil(cfg._suivi && Number(cfg._suivi.seuil) > 0 ? Number(cfg._suivi.seuil) : 75); }, [base, cfg]);
  const ref = base();
  const change = types.filter((ty) => JSON.stringify(g[ty]) !== JSON.stringify(ref[ty]));
  const seuilRef = cfg._suivi && Number(cfg._suivi.seuil) > 0 ? Number(cfg._suivi.seuil) : 75;
  async function enregistrer() {
    for (const ty of change) {
      const k = typeKey(ty), c = cfg[k] || {};
      const data = { ...c, type: ty, etapes: g[ty].steps.map((s) => ({ ...s, delai: borne(s.delai, 7) })), delaiLecture: borne(g[ty].lect, 15), maj: new Date().toISOString(), par: moi.email };
      const { error } = await sb.from("kv").upsert({ path: "circuits/" + k, data });
      if (error) { note("err", msg(error)); charger(); return; }
    }
    if (seuil !== seuilRef) {
      const { error } = await sb.from("kv").upsert({ path: "circuits/_suivi", data: { seuil: Math.max(10, Math.min(100, seuil || 75)), maj: new Date().toISOString(), par: moi.email } });
      if (error) { note("err", msg(error)); charger(); return; }
    }
    note("ok", "Délais enregistrés."); charger();
  }
  const largeur = Math.max(1, ...types.map((ty) => (g[ty] ? g[ty].steps.length : 0)));
  return (
    <>
      <div className="tbl"><table className="delais">
        <thead><tr><th>Type</th>{Array.from({ length: largeur }, (_, i) => <th key={i}>{t("Étape")} {i + 1}</th>)}<th>Prise de connaissance</th></tr></thead>
        <tbody>
          {types.map((ty) => g[ty] ? (
            <tr key={ty} className={change.includes(ty) ? "edited" : ""}><td><b>{ty}</b></td>
              {Array.from({ length: largeur }, (_, i) => { const s = g[ty].steps[i]; return <td key={i}>{s ? <label className="dl"><span>{s.label}</span><span><input id={"dl-" + typeKey(ty) + "-" + i} type="number" min={1} max={180} value={s.delai} onChange={(e) => setG({ ...g, [ty]: { ...g[ty], steps: g[ty].steps.map((x, j) => (j === i ? { ...x, delai: Number(e.target.value) } : x)) } })} /> j</span></label> : null}</td>; })}
              <td><label className="dl"><span>après adoption</span><span><input id={"dl-" + typeKey(ty) + "-lect"} type="number" min={1} max={180} value={g[ty].lect} onChange={(e) => setG({ ...g, [ty]: { ...g[ty], lect: Number(e.target.value) } })} /> j</span></label></td>
            </tr>) : null)}
        </tbody>
      </table></div>
      <div className="tools" style={{ marginTop: 12 }}>
        <label className="lect">Signaler « bientôt en retard » à <input id="dl-seuil" type="number" min={10} max={100} value={seuil} onChange={(e) => setSeuil(Number(e.target.value))} /> % du délai</label>
        <button type="button" className="btn primary" disabled={!change.length && seuil === seuilRef} onClick={enregistrer}>Enregistrer les délais</button>
        {change.length || seuil !== seuilRef ? <button type="button" className="btn sec" onClick={() => { setG(base()); setSeuil(seuilRef); }}>Annuler</button> : null}
      </div>
    </>
  );
}
