"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Cfm, FONCTIONS, Membre, msg, t } from "../../lib/admin-ui";

// Lectures obligatoires, désignées par fonction (prérogative « lectures »). lectures/<doc> :
//   tous               toutes les personnes actives
//   fonctions          titulaires de ces fonctions : à lire et attester
//   consult_fonctions  titulaires de ces fonctions : consultation seule (accès employé)
//   ids / consult      exceptions individuelles (lecture / consultation)
// Une personne qui prend une fonction hérite de ses lectures ; celle qui la quitte en est déchargée.
type L = { tous?: boolean; fonctions?: string[]; consult_fonctions?: string[]; ids?: string[]; consult?: string[]; maj?: string };
export type DocL = { id: string; titre: string };
type Etat = "" | "L" | "C";
const idDe = (m: Membre) => m.user_id || "email:" + m.email;
const sans = (a: string[] | undefined, x: string) => (a || []).filter((y) => y !== x);

export function Lectures({ sb, docs, ms, note, demander }: { sb: SupabaseClient; docs: DocL[]; ms: Membre[]; note: (t: "ok" | "err", m: string) => void; demander: (c: Cfm) => void }) {
  const [base, setBase] = useState<Record<string, L>>({});
  const [ed, setEd] = useState<Record<string, L>>({});
  const [ouvert, setOuvert] = useState("");
  const [q, setQ] = useState("");
  const charger = useCallback(async () => {
    const { data, error } = await sb.from("kv").select("path,data").like("path", "lectures/%");
    if (error) { note("err", msg(error)); return; }
    setBase(Object.fromEntries((data || []).map((r) => [String(r.path).slice(9), (r.data || {}) as L])));
    setEd({});
  }, [sb]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, [charger]);
  const de = (id: string): L => ed[id] || base[id] || {};
  const changer = (id: string, f: (x: L) => L) => setEd({ ...ed, [id]: f(JSON.parse(JSON.stringify(de(id)))) });
  const etatF = (x: L, f: string): Etat => ((x.fonctions || []).includes(f) ? "L" : (x.consult_fonctions || []).includes(f) ? "C" : "");
  const etatP = (x: L, p: string): Etat => ((x.ids || []).includes(p) ? "L" : (x.consult || []).includes(p) ? "C" : "");
  const suivant = (e: Etat): Etat => (e === "" ? "L" : e === "L" ? "C" : "");
  const poserF = (id: string, f: string, e: Etat) => changer(id, (x) => ({ ...x, fonctions: e === "L" ? [...sans(x.fonctions, f), f] : sans(x.fonctions, f), consult_fonctions: e === "C" ? [...sans(x.consult_fonctions, f), f] : sans(x.consult_fonctions, f) }));
  const poserP = (id: string, p: string, e: Etat) => changer(id, (x) => ({ ...x, ids: e === "L" ? [...sans(x.ids, p), p] : sans(x.ids, p), consult: e === "C" ? [...sans(x.consult, p), p] : sans(x.consult, p) }));
  const actifs = useMemo(() => ms.filter((m) => m.actif), [ms]);
  const nomDe = (p: string) => { const m = ms.find((x) => idDe(x) === p); return m ? m.nom || m.email : p.replace(/^email:/, ""); };
  // Nombre de lecteurs effectifs (tous, fonctions, personnes)
  const lecteurs = (x: L) => {
    const s = new Set<string>(x.ids || []);
    for (const m of actifs) if (x.tous || (m.fonctions || []).some((f) => (x.fonctions || []).includes(f))) s.add(idDe(m));
    return s.size;
  };
  const modifs = Object.keys(ed).filter((id) => JSON.stringify({ ...ed[id], maj: 0 }) !== JSON.stringify({ ...(base[id] || {}), maj: 0 }));
  const vis = docs.filter((d) => !q || (d.id + " " + d.titre).toLowerCase().includes(q.toLowerCase()));
  const lib = (e: Etat) => (e === "L" ? t("Lecture") : e === "C" ? t("Consultation") : "—");
  function resume(id: string) {
    const a = base[id] || {}, b = ed[id], out: string[] = [];
    if (!!a.tous !== !!b.tous) out.push(b.tous ? t("lecture demandée à tous") : t("plus à tous"));
    for (const [f, l] of FONCTIONS) { const x = etatF(a, f), y = etatF(b, f); if (x !== y) out.push(l + " : " + lib(x) + " → " + lib(y)); }
    for (const p of new Set([...(a.ids || []), ...(a.consult || []), ...(b.ids || []), ...(b.consult || [])])) { const x = etatP(a, p), y = etatP(b, p); if (x !== y) out.push(nomDe(p) + " : " + lib(x) + " → " + lib(y)); }
    return "<b>" + id + "</b> : " + out.join(" ; ");
  }
  function enregistrer() {
    demander({
      titre: t("Enregistrer les lectures obligatoires"), points: [...modifs.map(resume), t("Les personnes ajoutées devront attester leur lecture une fois le document en vigueur.")],
      phrase: "enregistrer les lectures", bouton: t("Enregistrer"),
      ok: async () => {
        for (const id of modifs) {
          const { error } = await sb.from("kv").upsert({ path: "lectures/" + id, data: { ...ed[id], maj: new Date().toISOString() } }, { onConflict: "path" });
          if (error) { note("err", id + " : " + msg(error)); charger(); return; }
        }
        note("ok", modifs.length + " " + t("document(s) mis à jour."));
        // Les fiches de maîtrise des PDF et Word reprennent la diffusion réelle à la publication suivante
        try { await fetch("/api/appliquer", { method: "POST" }); } catch { /* publication horaire */ }
        charger();
      },
    });
  }
  return (
    <>
      <div className="tools" style={{ marginBottom: 10 }}>
        <input type="search" placeholder={t("Rechercher un document")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("Rechercher")} />
        <button type="button" className="btn primary" disabled={!modifs.length} onClick={enregistrer}>{t("Enregistrer")}{modifs.length ? " (" + modifs.length + ")" : ""}</button>
        {modifs.length ? <button type="button" className="btn sec" onClick={() => setEd({})}>{t("Annuler")}</button> : null}
      </div>
      <div className="tbl"><table className="lc-tab">
        <thead><tr><th>{t("Document")}</th><th className="c">{t("Tous")}</th>{FONCTIONS.map(([f, l]) => <th key={f} className="c">{t(l)}</th>)}<th className="c">{t("Personnes")}</th><th className="c">{t("Lecteurs")}</th></tr></thead>
        <tbody>{vis.map((d) => { const x = de(d.id), m = modifs.includes(d.id), nP = (x.ids || []).length + (x.consult || []).length; return (
          <Fragment key={d.id}>
            <tr className={m ? "edited" : ""}>
              <td><b>{d.id}</b><div className="fine">{d.titre}</div></td>
              <td className="c"><button type="button" className={"lc-c" + (x.tous ? " L" : "")} aria-pressed={!!x.tous} onClick={() => changer(d.id, (y) => ({ ...y, tous: !y.tous }))}>{x.tous ? t("Lecture") : "—"}</button></td>
              {FONCTIONS.map(([f, l]) => { const e = etatF(x, f); return <td key={f} className="c"><button type="button" className={"lc-c " + e} title={t(l) + " : " + lib(e)} disabled={!!x.tous && e === ""} onClick={() => poserF(d.id, f, suivant(e))}>{x.tous && e === "" ? "↳" : lib(e)}</button></td>; })}
              <td className="c"><button type="button" className="lnk" aria-expanded={ouvert === d.id} onClick={() => setOuvert(ouvert === d.id ? "" : d.id)}>{nP ? nP + " " + t("exception(s)") : t("Ajouter")}</button></td>
              <td className="c num">{lecteurs(x)}</td>
            </tr>
            {ouvert === d.id ? <tr className="lc-pers"><td colSpan={FONCTIONS.length + 4}>
              <p className="fine">{t("Exceptions individuelles : en plus des fonctions cochées.")}</p>
              <div className="lc-grid">{actifs.map((p) => { const e = etatP(x, idDe(p)); return (
                <label key={idDe(p)}><span>{p.nom || p.email}<em>{(p.fonctions || []).map((f) => t((FONCTIONS.find((z) => z[0] === f) || [f, f])[1])).join(", ") || t("sans fonction")}</em></span>
                  <select value={e} onChange={(ev) => poserP(d.id, idDe(p), ev.target.value as Etat)} aria-label={p.nom || p.email}><option value="">—</option><option value="L">{t("Lecture")}</option><option value="C">{t("Consultation")}</option></select></label>); })}</div>
            </td></tr> : null}
          </Fragment>); })}
        </tbody>
      </table></div>
      <p className="fine">{t("Cliquez une case pour passer de « — » à « Lecture » (à lire et attester), puis « Consultation » (accès sans attestation, pour les employés). Une personne qui prend une fonction hérite de ses lectures ; celle qui la quitte en est déchargée.")}</p>
    </>
  );
}

export const LC_CSS = `
.lc-tab{min-width:980px}.lc-tab td,.lc-tab th{font-size:12px;vertical-align:middle}.lc-tab th.c,.lc-tab td.c{text-align:center}
.lc-c{font:inherit;font-size:11px;border:1px solid var(--line);background:none;padding:3px 6px;min-width:86px;border-radius:2px;cursor:pointer;color:var(--muted)}
.lc-c.L{background:#E4F2EA;border-color:#9CCBAE;color:#1E6B45;font-weight:600}.lc-c.C{background:#EEF1F6;border-color:#B4C2D3;color:#3E5068}
.lc-c:disabled{cursor:default;border-style:dashed}
.lc-tab tr.edited td{background:#FBF1DC}.lc-pers td{background:#F4F7FB}
.lc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:6px 18px;margin-top:6px}
.lc-grid label{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px}
.lc-grid em{display:block;font-style:normal;font-size:11px;color:var(--muted)}
`;
