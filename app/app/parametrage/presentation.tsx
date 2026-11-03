"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { msg, t } from "../../lib/admin-ui";

// Présentation des documents imprimés (super administrateur, ou prérogative « presentation » qu'il accorde) :
// fiche d'identité de la société, matrice par type (page de garde, en-tête, bas de page, informations du pied),
// exceptions par document. Rangé dans kv presentation/reglages, écrit par la publication dans content/presentation.json
// (PDF et Word régénérés) ; les conventions générées le lisent directement. Ni le texte ni l'empreinte ne changent.
const TYPES: [string, string][] = [["Code", "Codes"], ["Politique", "Politiques"], ["Procédure", "Procédures"], ["Modèle de contrat", "Modèles de contrat"], ["Mode opératoire", "Modes opératoires"], ["Formulaire", "Formulaires"], ["_conventions", "Conventions générées"]];
const CLIENT = ["Modèle de contrat", "Formulaire", "_conventions"];
const CHAMPS: [string, string, string, string, number][] = [
  ["raison_sociale", "Raison sociale", "", "", 1], ["forme", "Forme sociale", "", "", 1], ["capital", "Capital", "Capital ", "Share capital ", 1],
  ["rccm", "RCCM", "RCCM ", "Trade register ", 1], ["niu", "NIU", "NIU ", "Tax ID ", 1], ["agrement", "Agrément COSUMAF", "Agrément ", "Licence ", 1],
  ["siege", "Siège", "", "", 2], ["bp", "Boîte postale", "BP ", "PO Box ", 2], ["telephone", "Téléphone", "Tél. ", "Tel. ", 2],
  ["email", "E-mail", "", "", 2], ["site", "Site web", "", "", 2], ["mention1", "Mention libre 1", "", "", 2], ["mention2", "Mention libre 2", "", "", 2],
];
const TRAD = ["forme", "mention1", "mention2"];
const GARDES: [string, string][] = [["G1", "G1 · Bandeau, nom en lettres"], ["G2", "G2 · Bandeau, logo blanc"], ["G3", "G3 · Page blanche, logo couleur"]];
const ENTETES: [string, string][] = [["E1", "E1 · Nom en lettres"], ["E2", "E2 · Soleil et nom"], ["E3", "E3 · Logo complet à gauche"], ["E4", "E4 · Papier à en-tête"]];
const PIEDS: [string, string][] = [["P1", "P1 · Informations et page"], ["P2", "P2 · Soleil centré"], ["P3", "P3 · Soleil, informations et page"], ["P4", "P4 · Soleil à droite"]];
type Regle = { garde: string; entete: string; pied: string; champs: string[] };
type Pres = { societe: Record<string, string>; types: Record<string, Regle>; documents: Record<string, Partial<Regle>> };
const defType = (ty: string): Regle => ({ garde: "G3", entete: "E2", pied: "P3", champs: CLIENT.includes(ty) ? ["raison_sociale", "forme", "capital", "rccm", "agrement", "siege", "telephone", "email"] : ["raison_sociale", "siege"] });
const lignes = (soc: Record<string, string>, champs: string[]) => {
  const l: string[][] = [[], []];
  for (const [k, , fr, , n] of CHAMPS) if (champs.includes(k) && (soc[k] || "").trim()) l[n - 1].push(fr + soc[k].trim());
  return l.map((x) => x.join(" · ")).filter(Boolean);
};

export function Presentation({ sb, docs, publie, moi, note }: { sb: SupabaseClient; docs: { id: string; titre: string; type: string }[]; publie: { societe: Record<string, string>; presentation: Record<string, unknown> }; moi: { email: string }; note: (t: "ok" | "err", m: string) => void }) {
  const initial = useMemo<Pres>(() => {
    const p = publie.presentation as { regle?: Regle; societe?: Record<string, string> };
    const types = Object.fromEntries(TYPES.map(([k]) => [k, defType(k)]));
    if (p.regle) types._conventions = { ...types._conventions, ...p.regle };
    return { societe: { ...publie.societe, ...(p.societe || {}) }, types, documents: {} };
  }, [publie]);
  const [base, setBase] = useState<Pres>(initial);
  const [ed, setEd] = useState<Pres>(initial);
  const [attente, setAttente] = useState(false);
  const [sel, setSel] = useState("Procédure");
  const [exc, setExc] = useState(false);
  const charger = useCallback(async () => {
    const { data } = await sb.from("kv").select("data").eq("path", "presentation/reglages").maybeSingle();
    if (data && data.data) {
      const d = data.data as Pres & { en_attente?: string };
      const x: Pres = { societe: { ...initial.societe, ...(d.societe || {}) }, types: Object.fromEntries(TYPES.map(([k]) => [k, { ...initial.types[k], ...((d.types || {})[k] || {}) }])), documents: d.documents || {} };
      setBase(x); setEd(JSON.parse(JSON.stringify(x))); setAttente(d.en_attente === "oui");
    }
  }, [sb, initial]);
  useEffect(() => { charger(); }, [charger]);
  const modifie = JSON.stringify(ed) !== JSON.stringify(base);
  const setSoc = (k: string, v: string) => setEd({ ...ed, societe: { ...ed.societe, [k]: v } });
  const setT = (ty: string, k: keyof Regle, v: string | string[]) => setEd({ ...ed, types: { ...ed.types, [ty]: { ...ed.types[ty], [k]: v } } });
  const setD = (id: string, k: keyof Regle, v: string) => { const cur = { ...(ed.documents[id] || {}) } as Record<string, string>; if (v) cur[k] = v; else delete cur[k]; const docsN = { ...ed.documents }; if (Object.keys(cur).length) docsN[id] = cur; else delete docsN[id]; setEd({ ...ed, documents: docsN }); };
  async function enregistrer() {
    const { error } = await sb.from("kv").upsert({ path: "presentation/reglages", data: { ...ed, en_attente: "oui", maj: new Date().toISOString(), par: moi.email } }, { onConflict: "path" });
    if (error) { note("err", msg(error)); return; }
    try { await fetch("/api/appliquer", { method: "POST" }); } catch { /* publication horaire */ }
    note("ok", t("Présentation enregistrée : les conventions générées l'appliquent tout de suite ; les PDF et Word sont régénérés à la publication (quelques minutes). Aucun texte ni visa n'est touché."));
    charger();
  }
  const R = ed.types[sel];
  const lg = lignes(ed.societe, R.champs);
  const client = CLIENT.includes(sel);
  const sol = (h: number) => <img src="/logo/soleil.svg" alt="" style={{ height: h, width: h, display: "block" }} />;
  const marque = <b style={{ color: "#0B2E52", letterSpacing: ".18em", fontSize: 7.6 }}>PURPOSE CAPITAL</b>;
  const titre = client ? "Convention d'ouverture de compte-titres" : "Procédure de réception et de transmission des ordres";
  const droite = client ? "Projet" : "Version 0.9 · Projet";
  return (
    <>
      {attente ? <p className="warn">{t("Réglage en cours de publication : les PDF et Word seront régénérés dans quelques minutes.")}</p> : null}
      <h3 className="pz-h">{t("Fiche d'identité de la société")}</h3>
      <div className="pr-fiche">
        {CHAMPS.map(([k, l]) => (
          <label key={k} className="pr-f"><span>{t(l)}</span><input id={"pr-" + k} value={ed.societe[k] || ""} onChange={(e) => setSoc(k, e.target.value)} />
            {TRAD.includes(k) ? <input id={"pr-" + k + "-en"} className="en" placeholder={t("En anglais")} value={ed.societe[k + "_en"] || ""} onChange={(e) => setSoc(k + "_en", e.target.value)} /> : null}</label>
        ))}
      </div>

      <h3 className="pz-h">{t("Présentation par type de document")}</h3>
      <p className="fine">{t("Cliquez une ligne pour voir l'aperçu. Les documents remis au client (modèles de contrat, formulaires, conventions générées) n'affichent ni référence ni version ; aucun document n'affiche sa référence.")}</p>
      <div className="tbl"><table className="pr-tab">
        <thead><tr><th>{t("Type")}</th><th>{t("Page de garde")}</th><th>{t("En-tête")}</th><th>{t("Bas de page")}</th><th>{t("Informations du pied")}</th></tr></thead>
        <tbody>{TYPES.map(([ty, lib]) => { const r = ed.types[ty]; return (
          <tr key={ty} className={(sel === ty ? "sel " : "") + (JSON.stringify(r) !== JSON.stringify(base.types[ty]) ? "edited" : "")} onClick={() => setSel(ty)}>
            <td><b>{t(lib)}</b>{CLIENT.includes(ty) ? <div className="fine">{t("remis au client")}</div> : null}</td>
            <td><select value={r.garde} onChange={(e) => setT(ty, "garde", e.target.value)} aria-label={t("Page de garde")} disabled={ty === "_conventions" && false}>{GARDES.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select></td>
            <td><select value={r.entete} onChange={(e) => setT(ty, "entete", e.target.value)} aria-label={t("En-tête")}>{ENTETES.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select></td>
            <td><select value={r.pied} onChange={(e) => setT(ty, "pied", e.target.value)} aria-label={t("Bas de page")}>{PIEDS.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select></td>
            <td><div className="pr-chips">{CHAMPS.map(([k, l]) => { const on = r.champs.includes(k); return <button key={k} type="button" className={"pr-chip" + (on ? " on" : "")} aria-pressed={on} onClick={(e) => { e.stopPropagation(); setT(ty, "champs", on ? r.champs.filter((x) => x !== k) : CHAMPS.map((c) => c[0]).filter((c) => c === k || r.champs.includes(c))); }}>{t(l)}</button>; })}</div></td>
          </tr>); })}</tbody>
      </table></div>

      <div className="pr-apercu" aria-label={t("Aperçu")}>
        <div className="pr-cap">{t("Aperçu")} · {t((TYPES.find((x) => x[0] === sel) || ["", ""])[1])}</div>
        <div className="pr-pages">
          <div className={"pr-cov " + R.garde}>
            {R.garde === "G1" ? <div className="band"><span className="mk">PURPOSE CAPITAL</span><i /></div> : R.garde === "G2" ? <div className="band"><img src="/logo/logo-blanc.svg" alt="Purpose Capital" style={{ height: 34 }} /></div> : <div className="top"><img src="/logo/logo.svg" alt="Purpose Capital" style={{ height: 32 }} /></div>}
            <div className="main"><span className="ey">{client ? "Modèle de contrat" : "Procédure"}</span><span className="tt">{titre}</span><span className="rf">{droite}</span></div>
            <div className="ft">{lg.map((l, i) => <span key={i} className={i ? "" : "b"}>{l}</span>)}</div>
          </div>
          <div className="pr-sheet">
            <div className={"hd " + R.entete}>
              {R.entete === "E4" ? <img src="/logo/logo.svg" alt="" style={{ height: 22 }} /> : R.entete === "E3" ? <><img src="/logo/logo.svg" alt="" style={{ height: 20 }} /><span className="sp" /><span className="r"><b>{titre}</b><br />{droite}</span></> : <>{R.entete === "E2" ? sol(10) : null}{marque}<span className="lb">· {titre}</span><span className="sp" /><span>{droite}</span></>}
            </div>
            <div className="txt"><i /><i /><i /><i /><i /><i /><i /></div>
            <div className={"pd " + R.pied}>
              {R.pied === "P2" ? <>{sol(11)}<span>{R.entete === "E4" ? titre + " · " : ""}4 / 23</span>{lg.map((l, i) => <span key={i}>{l}</span>)}</> : <>{R.pied === "P3" ? sol(10) : null}<span className="inf">{lg.map((l, i) => <span key={i} className={i ? "" : "b"}>{l}</span>)}</span><span className="pg">{R.entete === "E4" ? titre + (client ? "" : " · v0.9") + " · " : ""}4 / 23</span>{R.pied === "P4" ? sol(9) : null}</>}
            </div>
          </div>
        </div>
        {lg.length > 2 ? <p className="warn">{t("Le pied dépasse deux lignes : retirez des informations.")}</p> : null}
      </div>

      <h3 className="pz-h"><button type="button" className="lnk" aria-expanded={exc} onClick={() => setExc(!exc)}>{exc ? "▾" : "▸"} {t("Exceptions par document")}{Object.keys(ed.documents).length ? " (" + Object.keys(ed.documents).length + ")" : ""}</button></h3>
      {exc ? <div className="tbl"><table className="pr-tab">
        <thead><tr><th>{t("Document")}</th><th>{t("Page de garde")}</th><th>{t("En-tête")}</th><th>{t("Bas de page")}</th></tr></thead>
        <tbody>{docs.map((d) => { const x = ed.documents[d.id] || {}; const sel3 = (k: keyof Regle, opts: [string, string][]) => <select value={(x[k] as string) || ""} onChange={(e) => setD(d.id, k, e.target.value)} aria-label={d.id + " " + k}><option value="">{t("Selon le type")}</option>{opts.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select>; return (
          <tr key={d.id} className={JSON.stringify(x) !== JSON.stringify(base.documents[d.id] || {}) ? "edited" : ""}><td><b>{d.titre}</b><div className="fine">{d.type}</div></td><td>{sel3("garde", GARDES)}</td><td>{sel3("entete", ENTETES)}</td><td>{sel3("pied", PIEDS)}</td></tr>); })}</tbody>
      </table></div> : null}

      <div className="tools" style={{ marginTop: 14 }}>
        <button type="button" className="btn primary" disabled={!modifie} onClick={enregistrer}>{t("Enregistrer la présentation")}</button>
        {modifie ? <button type="button" className="btn sec" onClick={() => setEd(JSON.parse(JSON.stringify(base)))}>{t("Annuler")}</button> : null}
      </div>
    </>
  );
}

export const PR_CSS = `
.pz-h{font-size:13.5px;margin:18px 0 8px;color:var(--navy,#0B2E52)}.pz-h .lnk{font:inherit;font-weight:600}
.pr-fiche{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px 16px;margin-bottom:8px}
.pr-f{display:grid;gap:3px;font-size:12px}.pr-f span{color:var(--muted)}.pr-f input{border:1px solid var(--line);padding:6px 8px;font:inherit;font-size:12.5px;border-radius:2px}.pr-f input.en{font-size:12px;background:#F7F9FC}
.pr-tab{min-width:900px}.pr-tab td{vertical-align:middle;font-size:12px}.pr-tab select{font:inherit;font-size:12px;padding:3px 4px;max-width:210px}
.pr-tab tr{cursor:pointer}.pr-tab tr.sel td{box-shadow:inset 0 0 0 9999px rgba(232,160,32,.07)}.pr-tab tr.sel td:first-child{box-shadow:inset 3px 0 0 #E8A020,inset 0 0 0 9999px rgba(232,160,32,.07)}.pr-tab tr.edited td{background:#FBF1DC}
.pr-chips{display:flex;flex-wrap:wrap;gap:3px}.pr-chip{font:inherit;font-size:10.5px;border:1px solid var(--line);background:none;color:var(--muted);padding:1px 6px;border-radius:2px;cursor:pointer}.pr-chip.on{background:#0B2E52;border-color:#0B2E52;color:#fff}
.pr-apercu{margin:14px 0 6px;border:1px solid var(--line);background:#F4F7FB;padding:12px}.pr-cap{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.pr-pages{display:grid;grid-template-columns:200px minmax(0,1fr);gap:16px;align-items:start}@media(max-width:760px){.pr-pages{grid-template-columns:1fr}}
.pr-cov{background:#fff;aspect-ratio:210/297;border:1px solid #E3E9F1;display:flex;flex-direction:column;font-family:Helvetica,Arial,sans-serif;color:#0A2540;overflow:hidden}
.pr-cov .band{background:#0B2E52;padding:18px 16px 14px}.pr-cov .band .mk{color:#fff;font:600 11px Georgia,serif;letter-spacing:.2em}.pr-cov .band i{display:block;width:16px;height:2px;background:#E8A020;margin-top:5px}
.pr-cov .top{padding:18px 16px 0}.pr-cov .main{flex:1;padding:22px 16px 0;display:grid;align-content:start;gap:4px}.pr-cov .ey{font-size:6px;letter-spacing:.14em;text-transform:uppercase;color:#8A6413;font-weight:700}.pr-cov .tt{font:600 13px/1.15 Georgia,serif;color:#0B2E52}.pr-cov .rf{font-size:6.5px;color:#3E5068}
.pr-cov .ft{padding:0 16px 12px;font-size:5.2px;color:#5B6B80;display:grid;gap:1px}.pr-cov .ft .b,.pr-sheet .b{color:#0B2E52;font-weight:700}
.pr-sheet{background:#fff;border:1px solid #E3E9F1;aspect-ratio:210/150;display:flex;flex-direction:column;padding:14px 26px 10px 30px;font-family:Helvetica,Arial,sans-serif;color:#5B6B80}
.pr-sheet .hd{display:flex;align-items:center;gap:6px;font-size:7px;padding-bottom:5px;border-bottom:.75px solid #D5DEE9;white-space:nowrap}.pr-sheet .hd.E4{justify-content:center;border-bottom:1.5px solid #B88A39}.pr-sheet .hd .sp{flex:1}.pr-sheet .hd .lb{overflow:hidden;text-overflow:ellipsis}.pr-sheet .hd .r{text-align:right;line-height:1.3}.pr-sheet .hd .r b{color:#0B2E52}
.pr-sheet .txt{flex:1;display:grid;gap:7px;align-content:start;padding-top:14px}.pr-sheet .txt i{display:block;height:5px;background:#E3E9F1}.pr-sheet .txt i:nth-child(3n){width:80%}
.pr-sheet .pd{display:flex;align-items:center;gap:7px;font-size:6.2px;border-top:.75px solid #D5DEE9;padding-top:4px}.pr-sheet .pd.P2{flex-direction:column;border-top:0;gap:2px;text-align:center}.pr-sheet .pd .inf{flex:1;display:grid;gap:1px;min-width:0}.pr-sheet .pd .pg{white-space:nowrap}
`;
