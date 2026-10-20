"use client";
import { useState } from "react";

// Éléments communs aux pages Membres et Paramétrage
export type Membre = {
  email: string; user_id: string | null; nom: string | null; poste: string | null; fonctions: string[]; actif: boolean;
  admin: boolean; super: boolean; prerogatives: string[]; cree_le: string; derniere_connexion: string | null; acces: "complet" | "employe"; tableau?: boolean;
};
export type MoiC = { email: string; super: boolean; prerogatives: string[] };
export type Evt = { id: number; le: string; par_email: string | null; action: string; path: string; data: Record<string, unknown> & Partial<Membre> };

export const COLS = "email,user_id,nom,poste,fonctions,actif,admin,super,prerogatives,cree_le,derniere_connexion,acces,tableau";
export const FONCTIONS: [string, string][] = [
  ["pca", "Président du Conseil"], ["adm", "Administrateur du Conseil"], ["dg", "Directeur Général"], ["rcci", "RCCI"],
  ["dcom", "Directeur Commercial"], ["dmc", "Directeur des Marchés de Capitaux"], ["redac", "Rédacteur"], ["collab", "Collaborateur"],
];
export const FL: Record<string, string> = Object.fromEntries(FONCTIONS);
// Prérogatives qu'un administrateur peut détenir ; le super administrateur les a toutes
export const PREROGS: [string, string, string][] = [
  ["membres", "Gérer les membres", "inviter, modifier fonctions, poste et accès, suspendre"],
  ["lectures", "Attribuer les documents", "lectures obligatoires et documents visibles des employés"],
  ["tableau", "Ouvrir le tableau de bord", "à d'autres membres"],
  ["admins", "Nommer des administrateurs", "avec, au plus, ses propres prérogatives"],
  ["circuits", "Circuits et délais", "modifier les circuits d'approbation et les délais"],
  ["rediger", "Rédiger", "modifier et créer des documents en ligne"],
  ["abroger", "Abroger et archiver", "comme le RCCI"],
  ["supprimer", "Supprimer des documents", "retrait du registre"],
];
export const PL: Record<string, string> = Object.fromEntries(PREROGS.map((p) => [p[0], p[1]]));
export const peutDe = (moi: MoiC) => (p: string) => moi.super || moi.prerogatives.includes(p);
export const statutDe = (m: Membre) => (!m.actif ? "Suspendu" : !m.user_id ? "Invité" : "Actif");
export const date = (s: string | null) => (s ? new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
export const msg = (e: { message?: string } | null) => {
  const m = (e && e.message) || "Erreur inconnue";
  if (/duplicate key|membres_pkey/.test(m)) return "Cette adresse a déjà un accès.";
  if (/row-level security|permission/.test(m)) return "Opération refusée : vous n'avez pas la prérogative nécessaire.";
  return m;
};
export function telecharger(nom: string, lignes: string[][]) {
  const csv = "﻿" + lignes.map((l) => l.map((x) => String(x ?? "").replace(/[;\n\r]/g, " ")).join(";")).join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = nom; document.body.appendChild(a); a.click(); a.remove();
}

export type Cfm = { titre: string; points: string[]; phrase: string; bouton: string; danger?: boolean; ok: () => void };
const normTxt = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’'`]/g, "'").replace(/\s+/g, " ").trim();
// Double validation : récapitulatif, puis la personne écrit elle-même l'action à réaliser
export function Confirmation({ c, fermer }: { c: Cfm; fermer: () => void }) {
  const [v, setV] = useState("");
  const pret = normTxt(v) === normTxt(c.phrase);
  return (
    <div className="cfm-scrim" onClick={(e) => { if (e.target === e.currentTarget) fermer(); }} onKeyDown={(e) => { if (e.key === "Escape") fermer(); }}>
      <div className="cfm" role="dialog" aria-modal="true" aria-labelledby="cfm-t">
        <h2 id="cfm-t">{c.titre}</h2>
        <ul className="cfm-pts">{c.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
        <div className="cfm-sign"><label htmlFor="cfm-in">Pour confirmer, écrivez : <b className="cfm-phrase">{c.phrase}</b></label>
          <input id="cfm-in" autoFocus autoComplete="off" spellCheck={false} value={v} onChange={(e) => setV(e.target.value)} onPaste={(e) => e.preventDefault()} onKeyDown={(e) => { if (e.key === "Enter" && pret) { fermer(); c.ok(); } }} /></div>
        <div className="visa-btns"><button type="button" className={"btn primary" + (c.danger ? " danger" : "")} disabled={!pret} onClick={() => { fermer(); c.ok(); }}>{c.bouton}</button><button type="button" className="btn ghost-l" onClick={fermer}>Annuler</button></div>
      </div>
    </div>
  );
}

// Choix des prérogatives : seules celles que l'on détient soi-même peuvent être données
export function Prerogatives({ val, moi, onChange, disabled }: { val: string[]; moi: MoiC; onChange: (v: string[]) => void; disabled?: boolean }) {
  const peut = peutDe(moi);
  return (
    <div className="prg">{PREROGS.map(([c, l, d]) => {
      const off = disabled || !peut(c);
      return <label key={c} className={"chk" + (off ? " dim" : "")} title={!peut(c) ? "Vous ne détenez pas cette prérogative" : d}>
        <input type="checkbox" checked={val.includes(c)} disabled={off} onChange={() => onChange(val.includes(c) ? val.filter((x) => x !== c) : [...val, c])} />{l}</label>;
    })}</div>
  );
}

export function libelle(e: Evt) {
  const d = e.data || {}; const qui = (d.nom as string) || e.path;
  const par = e.par_email ? ` — par ${e.par_email}` : "";
  if (e.action === "CONNEXION") return `${qui} s'est connecté(e)`;
  if (e.action === "MEMBRE_INSERT") return `Accès ouvert : ${e.path} (${(d.fonctions || []).map((c) => FL[c] || c).join(", ")})${d.admin ? ", administrateur" : ""}${par}`;
  if (e.action === "MEMBRE_DELETE") return `Invitation retirée : ${e.path}${par}`;
  if (e.action === "MEMBRE_UPDATE") return `Accès modifié : ${qui} — ${d.actif ? "actif" : "suspendu"}${d.super ? ", super administrateur" : d.admin ? ", administrateur (" + ((d.prerogatives || []).map((p) => PL[p] || p).join(", ") || "aucune prérogative") + ")" : ""} ; ${(d.fonctions || []).map((c) => FL[c] || c).join(", ") || "aucune fonction"}${par}`;
  const seg = e.path.split("/");
  if (seg[0] === "sig") return `${d.etape === "lecture" ? "Lecture attestée" : d.etape === "renvoi" ? "Renvoi" : "Visa"} : ${d.doc || ""} v${d.version || ""}${par}`;
  if (seg[0] === "circuits") return `Circuit « ${(d.type as string) || seg[1]} » ${e.action === "DELETE" ? "rétabli" : "modifié"}${par}`;
  if (seg[0] === "lectures") return `Lectures obligatoires de ${seg[1]} modifiées${par}`;
  if (seg[0] === "etats") return `${seg[1]} ${e.action === "DELETE" ? "rétabli" : d.statut === "supprime" ? "supprimé" : "abrogé"}${par}`;
  if (seg[0] === "redaction") return `Rédaction ${seg[1]} : ${(d.statut as string) || e.action.toLowerCase()}${par}`;
  if (seg[0] === "adoptions") return `Adoption ${seg[1].split("~")[0]} : ${(d.statut as string) || ""}${par}`;
  return `${e.action} ${e.path}${par}`;
}

export const CSS = `
.pg{--navy:#0B2E52;--gold:#E8A020;--ink:#1C2B3A;--muted:#5A6B80;--line:#DCE3EC;--bg:#F5F7FA;--card:#fff;color:var(--ink);font:13px/1.5 Inter,"Helvetica Neue",Arial,sans-serif}
.lead{max-width:780px;color:var(--muted);margin:22px 0 16px}
.stats{display:flex;gap:0;flex-wrap:wrap;margin-bottom:14px;border:1px solid var(--line);border-radius:2px;background:var(--card);width:max-content;max-width:100%}
.stats div{padding:10px 18px;min-width:130px;border-right:1px solid var(--line)}.stats div:last-child{border-right:0}
.stats b{display:block;font-size:20px;color:var(--navy)}.stats span{color:var(--muted);font-size:12.5px}
.warn,.ok,.err{border-radius:2px;padding:10px 12px;margin:0 0 14px;font-size:13px}
.warn{background:#FBF1DC;color:#6B4A0E}.ok{background:#E5F3EA;color:#1D5B34}.err{background:#FBE6E4;color:#8A2219}
.card{background:var(--card);border:1px solid var(--line);border-radius:2px;padding:18px 20px;margin-bottom:18px}
h2{font-family:"Playfair Display",Georgia,serif;color:var(--navy);font-size:16px;margin:0 0 12px;font-weight:600}
h3{font-size:13px;margin:14px 0 6px;color:var(--navy)}
.add{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 16px;align-items:end}
.add>label{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:13px}.add small{font-weight:400;color:var(--muted)}
input[type=email],input[type=search],.add input:not([type=checkbox]):not([type=radio]),.poste,.sel{border:1px solid var(--line);border-radius:2px;padding:7px 9px;font:inherit;background:#fff;color:inherit}
fieldset{grid-column:1/-1;border:1px solid var(--line);border-radius:2px;padding:8px 12px;display:flex;flex-wrap:wrap;gap:6px 18px}
legend{font-weight:600;font-size:13px;padding:0 4px}
.chk{display:inline-flex;align-items:center;gap:6px;font-size:13px;cursor:pointer}.adm{color:#6B4A0E}.chk.dim{opacity:.45;cursor:not-allowed}
.btn{grid-column:1/-1;justify-self:start;background:var(--navy);color:#fff;border:0;border-radius:2px;padding:9px 16px;font:inherit;font-weight:600;cursor:pointer}.btn:disabled{opacity:.55;cursor:not-allowed}
.btn.sec{background:#fff;color:var(--navy);border:1px solid var(--line)}
.listhead{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px}.listhead h2{margin:0}
.tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.tbl{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:760px}
th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:2px solid var(--line);padding:8px}
td{border-bottom:1px solid var(--line);padding:10px 8px;vertical-align:top}
tr.off td{opacity:.55}tr.busy{opacity:.6;pointer-events:none}
.nom{font-weight:600;display:flex;gap:6px;align-items:center;flex-wrap:wrap}.mail{color:var(--muted);font-size:12.5px}
.poste{margin-top:6px;padding:4px 8px;font-size:12.5px;width:100%;max-width:240px;box-sizing:border-box}
.tag{font-size:10.5px;font-weight:600;background:#E8EEF5;color:var(--navy);border-radius:2px;padding:1px 6px}.tag.gold{background:#FBF1DC;color:#6B4A0E}.tag.navy{background:var(--navy);color:#fff}
.st{font-size:11px;font-weight:600;border-radius:2px;padding:1px 6px;display:inline-block}.st.Actif{background:#E5F3EA;color:#1D5B34}.st.Invité{background:#FBF1DC;color:#6B4A0E}.st.Suspendu{background:#EEF1F5;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:5px}
.chip{border:1px solid var(--line);background:#fff;color:var(--muted);border-radius:2px;padding:2px 8px;font:inherit;font-size:12px;cursor:pointer}
.chip.on{background:var(--navy);border-color:var(--navy);color:#fff}.chip:disabled{cursor:default}
.cx{font-size:12.5px;white-space:nowrap}.wait{color:#6B4A0E}
.acts{display:flex;flex-direction:column;gap:4px;white-space:nowrap}
.lnk{background:none;border:0;padding:0;color:var(--navy);text-decoration:underline;font:inherit;font-size:12.5px;cursor:pointer;text-align:left}.lnk.rouge{color:#8A2219}
.fine{color:var(--muted);font-size:12.5px;margin:10px 0 0}
.vfl{display:flex;flex-direction:column;gap:2px;font-size:12px;color:var(--muted);margin-top:4px}.vfl select{font:inherit;font-size:12.5px;padding:3px 6px;border:1px solid var(--line);border-radius:2px}.lnk.doc{font-weight:600;text-decoration:none}.docs-row td{background:#F8FAFC}.dtab{width:100%;min-width:0;border-collapse:collapse}.dtab th,.dtab td{padding:5px 8px;font-size:12.5px}.dtab .c{text-align:center;width:110px}.add fieldset .chk span{font-weight:400}
.ghost-l{background:#fff!important;color:var(--navy)!important;border:1px solid var(--line)!important}.pending-bar .btn,.cfm .btn{grid-column:auto}tr.edited td{background:#FBF1DC}
.journal{list-style:none;margin:0;padding:0;max-height:420px;overflow:auto}
.journal li{display:flex;gap:14px;padding:6px 0;border-bottom:1px solid var(--line);font-size:13px}
.journal time{color:var(--muted);white-space:nowrap;min-width:150px}
.vide{color:var(--muted)}
.prg{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:6px}.prg .chk{font-size:12.5px}
.fiche{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 18px;margin-bottom:8px}.fiche div{font-size:12.5px}.fiche b{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:600}
.regles{margin:0;padding-left:18px}.regles li{margin:3px 0}
@media (max-width:720px){.add{grid-template-columns:1fr}.journal li{flex-direction:column;gap:0}.fiche{grid-template-columns:1fr 1fr}}
`;
