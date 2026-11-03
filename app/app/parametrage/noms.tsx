"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { msg, t } from "../../lib/admin-ui";

// Noms des annexes (super administrateur). Le nom n'est qu'une étiquette : les textes renvoient à la clé
// ([[annexe:A1]]), l'empreinte ignore le nom. Renommer ne touche donc ni les textes, ni les visas, ni les circuits.
// Les changements sont rangés dans kv noms/annexes puis écrits dans le dépôt par la publication automatique.
type Ann = { num: string; nom: string; titre: string; nomEn: string };
export type DocN = { id: string; titre: string; annexes: Ann[] };
type Ch = Record<string, { fr: string; en: string; par: string; le: string }>;

export function NomsAnnexes({ sb, docs, moi, note }: { sb: SupabaseClient; docs: DocN[]; moi: { email: string }; note: (t: "ok" | "err", m: string) => void }) {
  const [attente, setAttente] = useState<Ch>({});
  const [ed, setEd] = useState<Record<string, { fr: string; en: string }>>({});
  const [doc, setDoc] = useState("");
  const [q, setQ] = useState("");
  const charger = useCallback(async () => {
    const { data } = await sb.from("kv").select("data").eq("path", "noms/annexes").maybeSingle();
    setAttente(((data && (data.data as { changements?: Ch }).changements) || {}) as Ch); setEd({});
  }, [sb]);
  useEffect(() => { charger(); }, [charger]);
  const lignes = useMemo(() => docs.filter((d) => d.annexes.length && (!doc || d.id === doc)).flatMap((d) => d.annexes.map((a) => ({ d, a, k: d.id + "/A" + a.num }))), [docs, doc]);
  const val = (k: string, a: Ann) => ed[k] || (attente[k] ? { fr: attente[k].fr, en: attente[k].en } : { fr: a.nom, en: a.nomEn });
  const vis = lignes.filter(({ d, a, k }) => !q || (d.id + " " + a.titre + " " + val(k, a).fr + " " + val(k, a).en).toLowerCase().includes(q.toLowerCase()));
  // Contrôles : nom présent, 60 caractères au plus, unique dans le document (dans chaque langue)
  const erreurs = useMemo(() => {
    const out: Record<string, string> = {};
    for (const d of docs) for (const lang of ["fr", "en"] as const) {
      const vus: Record<string, string> = {};
      for (const a of d.annexes) {
        const k = d.id + "/A" + a.num, v = (val(k, a)[lang] || "").trim();
        if (!v) out[k] = t("Nom manquant"); else if (v.length > 60) out[k] = t("60 caractères au plus");
        else { const c = v.toLowerCase(); if (vus[c]) out[k] = out[vus[c]] = t("Nom déjà utilisé dans ce document"); vus[c] = k; }
      }
    }
    return out;
  }, [docs, ed, attente]); // eslint-disable-line react-hooks/exhaustive-deps
  const modifs = Object.keys(ed).filter((k) => { const d = docs.find((x) => k.startsWith(x.id + "/")); const a = d && d.annexes.find((x) => k === d.id + "/A" + x.num); if (!a) return false; const base = attente[k] ? attente[k] : { fr: a.nom, en: a.nomEn }; return ed[k].fr.trim() !== base.fr || ed[k].en.trim() !== base.en; });
  async function enregistrer() {
    if (modifs.some((k) => erreurs[k])) { note("err", t("Corrigez les noms signalés avant d'enregistrer.")); return; }
    const ch: Ch = { ...attente };
    for (const k of modifs) ch[k] = { fr: ed[k].fr.trim(), en: ed[k].en.trim(), par: moi.email, le: new Date().toISOString() };
    const { error } = await sb.from("kv").upsert({ path: "noms/annexes", data: { changements: ch, en_attente: "oui", maj: new Date().toISOString() } });
    if (error) { note("err", msg(error)); return; }
    try { await fetch("/api/appliquer", { method: "POST" }); } catch { /* publication horaire */ }
    note("ok", modifs.length + " " + t("nom(s) enregistré(s) : publication en cours (quelques minutes). Aucun texte, visa ni circuit n'est modifié."));
    charger();
  }
  const enAttente = Object.keys(attente).length;
  return (
    <>
      {enAttente ? <p className="warn">{enAttente} {t("nom(s) en cours de publication.")}</p> : null}
      <div className="tools" style={{ marginBottom: 10 }}>
        <select className="sel" value={doc} onChange={(e) => setDoc(e.target.value)} aria-label={t("Document")}><option value="">{t("Tous les documents")}</option>{docs.filter((d) => d.annexes.length).map((d) => <option key={d.id} value={d.id}>{d.id} — {d.titre}</option>)}</select>
        <input type="search" placeholder={t("Rechercher un nom ou un titre")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("Rechercher")} />
        <button type="button" className="btn primary" disabled={!modifs.length} onClick={enregistrer}>{t("Enregistrer les noms")}{modifs.length ? " (" + modifs.length + ")" : ""}</button>
        {modifs.length ? <button type="button" className="btn sec" onClick={() => setEd({})}>{t("Annuler")}</button> : null}
      </div>
      <div className="tbl"><table className="nm-tab">
        <thead><tr><th>{t("Document")}</th><th>{t("Titre de l'annexe")}</th><th>{t("Nom (français)")}</th><th>{t("Nom (anglais)")}</th></tr></thead>
        <tbody>{vis.map(({ d, a, k }) => { const v = val(k, a), m = modifs.includes(k), err = erreurs[k]; return (
          <tr key={k} className={m ? "edited" : ""}>
            <td><b>{d.id}</b></td>
            <td>{a.titre}{attente[k] && !ed[k] ? <span className="tag">{t("publication en cours")}</span> : null}{err ? <div className="err-l">{err}</div> : null}</td>
            <td><input id={"nm-fr-" + k} value={v.fr} maxLength={60} onChange={(e) => setEd({ ...ed, [k]: { ...v, fr: e.target.value } })} aria-label={t("Nom (français)")} /></td>
            <td><input id={"nm-en-" + k} value={v.en} maxLength={60} onChange={(e) => setEd({ ...ed, [k]: { ...v, en: e.target.value } })} aria-label={t("Nom (anglais)")} /></td>
          </tr>); })}
        </tbody>
      </table></div>
      <p className="fine">{t("Le nom n'est qu'une étiquette : les textes renvoient à l'annexe par sa clé et affichent son nom du moment. Renommer ne modifie ni les textes ni les visas, et ne relance aucun circuit.")}</p>
    </>
  );
}

export const NM_CSS = `
.nm-tab{min-width:760px}.nm-tab .tag{margin-left:6px;font-size:11px;padding:1px 6px;background:#EEF1F6}.nm-tab .err-l{color:#8A2219;font-size:11.5px;margin-top:3px}.nm-tab td{vertical-align:top;font-size:12.5px}
.nm-tab input{width:100%;box-sizing:border-box;border:1px solid var(--line);padding:5px 7px;font:inherit;font-size:12.5px;border-radius:2px}
.nm-tab tr.edited td{background:#FBF1DC}
`;
