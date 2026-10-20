"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useCallback, useEffect, useMemo, useState } from "react";

type Membre = { email: string; user_id: string | null; nom: string | null; poste: string | null; fonctions: string[]; actif: boolean; admin: boolean; cree_le: string; derniere_connexion: string | null; acces: "complet" | "employe" };
type Doc = { id: string; titre: string; type: string };
type Lect = { ids?: string[]; consult?: string[]; tous?: boolean; maj?: string };
type Evt = { id: number; le: string; par_email: string | null; action: string; path: string; data: Partial<Membre> };

const FONCTIONS: [string, string][] = [
  ["pca", "Président du Conseil"], ["adm", "Administrateur du Conseil"], ["dg", "Directeur Général"], ["rcci", "RCCI"],
  ["dcom", "Directeur Commercial"], ["dmc", "Directeur des Marchés de Capitaux"], ["redac", "Rédacteur"], ["collab", "Collaborateur"],
];
const FL: Record<string, string> = Object.fromEntries(FONCTIONS);
const DOMAINE = "purposecapital.africa";
const SITE = "https://referentiel.purposecapital.africa";
const date = (s: string | null) => (s ? new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
const msg = (e: { message?: string } | null) => {
  const m = (e && e.message) || "Erreur inconnue";
  if (/duplicate key|membres_pkey/.test(m)) return "Cette adresse a déjà un accès.";
  if (/row-level security|permission/.test(m)) return "Opération refusée : réservée à l'administrateur.";
  return m;
};

export default function Gestion({ moi, docs }: { moi: string; docs: Doc[] }) {
  const sb = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const [ms, setMs] = useState<Membre[]>([]);
  const [evts, setEvts] = useState<Evt[]>([]);
  const [q, setQ] = useState("");
  const [inactifs, setInactifs] = useState(false);
  const [note, setNote] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [f, setF] = useState({ email: "", nom: "", poste: "", fonctions: ["collab"] as string[], admin: false, acces: "employe" as "complet" | "employe" });
  const [lects, setLects] = useState<Record<string, Lect>>({});
  const [ouvert, setOuvert] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const [a, b] = await Promise.all([
      sb.from("membres").select("email,user_id,nom,poste,fonctions,actif,admin,cree_le,derniere_connexion,acces").order("nom", { nullsFirst: false }),
      sb.from("journal").select("id,le,par_email,action,path,data").or("action.like.MEMBRE_%,action.eq.CONNEXION").order("le", { ascending: false }).limit(40),
    ]);
    if (a.error) setNote({ t: "err", m: msg(a.error) }); else setMs(a.data as Membre[]);
    if (!b.error) setEvts(b.data as Evt[]);
    const c = await sb.from("kv").select("path,data").like("path", "lectures/%");
    if (!c.error) setLects(Object.fromEntries((c.data || []).map((r) => [String(r.path).slice(9), (r.data || {}) as Lect])));
  }, [sb]);
  const idDe = (m: Membre) => m.user_id || "email:" + m.email;
  const designe = (m: Membre, d: string): "lire" | "consult" | "" => { const L = lects[d] || {}; const ids = [m.user_id, "email:" + m.email]; return (L.ids || []).some((x) => ids.includes(x)) ? "lire" : (L.consult || []).some((x) => ids.includes(x)) ? "consult" : ""; };
  async function designer(m: Membre, d: string, mode: "lire" | "consult" | "") {
    const L: Lect = JSON.parse(JSON.stringify(lects[d] || { ids: [], consult: [], tous: false }));
    const ids = [m.user_id, "email:" + m.email].filter(Boolean) as string[];
    L.ids = (L.ids || []).filter((x) => !ids.includes(x)); L.consult = (L.consult || []).filter((x) => !ids.includes(x));
    if (mode === "lire") L.ids.push(idDe(m)); if (mode === "consult") L.consult.push(idDe(m));
    L.maj = new Date().toISOString();
    setLects({ ...lects, [d]: L });
    const { error } = await sb.from("kv").upsert({ path: "lectures/" + d, data: L }, { onConflict: "path" });
    if (error) { setNote({ t: "err", m: msg(error) }); charger(); }
  }
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { if (!note) return; const t = setTimeout(() => setNote(null), 5000); return () => clearTimeout(t); }, [note]);

  async function maj(email: string, part: Partial<Membre>, quoi: string) {
    setOccupe(email);
    const { error } = await sb.from("membres").update(part).eq("email", email);
    setOccupe(null);
    if (error) setNote({ t: "err", m: msg(error) }); else setNote({ t: "ok", m: quoi });
    charger();
  }
  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    const email = f.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email)) return setNote({ t: "err", m: "Adresse invalide." });
    if (!email.endsWith("@" + DOMAINE) && !confirm(`Cette adresse n'est pas en @${DOMAINE}. Seuls les comptes de votre annuaire Microsoft 365 peuvent se connecter. Ajouter quand même ?`)) return;
    if (!f.fonctions.length) return setNote({ t: "err", m: "Cochez au moins une fonction." });
    setOccupe("__ajout");
    const { error } = await sb.from("membres").insert({ email, nom: f.nom.trim() || null, poste: f.poste.trim() || null, fonctions: f.fonctions, admin: f.admin, actif: true, acces: f.admin ? "complet" : f.acces });
    setOccupe(null);
    if (error) return setNote({ t: "err", m: msg(error) });
    setNote({ t: "ok", m: `Accès ouvert pour ${email}. Prévenez la personne : elle se connecte sur ${SITE} avec son compte Microsoft 365.` });
    if (f.acces === "employe" && !f.admin) setOuvert(email);
    setF({ email: "", nom: "", poste: "", fonctions: ["collab"], admin: false, acces: "employe" });
    charger();
  }
  async function supprimer(m: Membre) {
    if (!confirm(`Retirer l'invitation de ${m.email} ? (Cette personne ne s'est jamais connectée.)`)) return;
    const { error } = await sb.from("membres").delete().eq("email", m.email);
    if (error) setNote({ t: "err", m: msg(error) }); else setNote({ t: "ok", m: "Invitation retirée." });
    charger();
  }
  const basculer = (m: Membre, code: string) => {
    const fs = m.fonctions.includes(code) ? m.fonctions.filter((x) => x !== code) : [...m.fonctions, code];
    maj(m.email, { fonctions: fs }, `${FL[code]} ${m.fonctions.includes(code) ? "retiré" : "attribué"} à ${m.nom || m.email}.`);
  };

  const filtre = ms.filter((m) => (inactifs || m.actif) && (!q || (m.email + " " + (m.nom || "") + " " + (m.poste || "")).toLowerCase().includes(q.toLowerCase())));
  const nb = { actifs: ms.filter((m) => m.actif).length, attente: ms.filter((m) => m.actif && !m.user_id).length, inactifs: ms.filter((m) => !m.actif).length };
  const titulaires = (code: string) => ms.filter((m) => m.actif && m.fonctions.includes(code));
  const alertes = (["dg", "rcci", "pca"] as const).filter((c) => !titulaires(c).length);

  return (
    <div className="pg">
      <style>{CSS}</style>
      <main className="wrap view">
        <div className="eyebrow">Administration</div>
        <h1 className="title">Membres</h1>
        <p className="lead">Seules les personnes inscrites ici, et actives, peuvent ouvrir le référentiel avec leur compte Microsoft 365. Les fonctions déterminent qui vise quoi : le RCCI vérifie, le Directeur Général approuve, le Président du Conseil enregistre l&apos;adoption ; les collaborateurs attestent leur lecture.</p>

        <div className="stats">
          <div><b>{nb.actifs}</b><span>accès actifs</span></div>
          <div><b>{nb.attente}</b><span>jamais connectés</span></div>
          <div><b>{nb.inactifs}</b><span>désactivés</span></div>
        </div>
        {alertes.length ? <p className="warn">Fonction sans titulaire actif : {alertes.map((c) => FL[c]).join(", ")}. Les documents qui en dépendent ne pourront pas être visés.</p> : null}
        {note ? <p role="status" className={note.t === "ok" ? "ok" : "err"}>{note.m}</p> : null}

        <section className="card">
          <h2>Ouvrir un accès</h2>
          <form onSubmit={ajouter} className="add">
            <label>Adresse Microsoft 365<input type="email" required value={f.email} placeholder={"prenom.nom@" + DOMAINE} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
            <label>Nom <small>(remplacé par le nom Microsoft à la 1re connexion)</small><input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} /></label>
            <label>Poste<input value={f.poste} placeholder="ex. Chargé de clientèle" onChange={(e) => setF({ ...f, poste: e.target.value })} /></label>
            <fieldset><legend>Fonctions</legend>
              {FONCTIONS.map(([c, l]) => (
                <label key={c} className="chk"><input type="checkbox" checked={f.fonctions.includes(c)} onChange={() => setF({ ...f, fonctions: f.fonctions.includes(c) ? f.fonctions.filter((x) => x !== c) : [...f.fonctions, c] })} />{l}</label>
              ))}
              <label className="chk adm"><input type="checkbox" checked={f.admin} onChange={() => setF({ ...f, admin: !f.admin })} />Administrateur (gère les membres)</label>
            </fieldset>
            <fieldset><legend>Accès au référentiel</legend>
              <label className="chk"><input type="radio" name="acces" checked={f.acces === "employe"} onChange={() => setF({ ...f, acces: "employe" })} /><span><b>Employé</b> — voit seulement les documents que vous lui attribuez</span></label>
              <label className="chk"><input type="radio" name="acces" checked={f.acces === "complet"} onChange={() => setF({ ...f, acces: "complet" })} /><span><b>Complet</b> — tout le référentiel (dirigeants, RCCI, rédacteurs, administrateurs du Conseil)</span></label>
            </fieldset>
            <button className="btn" disabled={occupe === "__ajout"}>{occupe === "__ajout" ? "Enregistrement…" : "Ouvrir l'accès"}</button>
          </form>
        </section>

        <section className="card">
          <div className="listhead">
            <h2>Membres</h2>
            <div className="tools">
              <input type="search" placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un membre" />
              <label className="chk"><input type="checkbox" checked={inactifs} onChange={() => setInactifs(!inactifs)} />Afficher les désactivés</label>
            </div>
          </div>
          <div className="tbl">
            <table>
              <thead><tr><th>Personne</th><th>Fonctions</th><th>Connexion</th><th>Accès</th></tr></thead>
              <tbody>
                {filtre.map((m) => {
                  const soi = m.email === moi;
                  return [
                    <tr key={m.email} className={(m.actif ? "" : "off ") + (occupe === m.email ? "busy" : "")}>
                      <td>
                        <div className="nom">{m.nom || "—"}{soi ? <span className="tag">vous</span> : null}{m.admin ? <span className="tag gold">admin</span> : null}</div>
                        <div className="mail">{m.email}</div>
                        <input className="poste" defaultValue={m.poste || ""} placeholder="Poste" aria-label={"Poste de " + m.email}
                          onBlur={(e) => { const v = e.target.value.trim(); if (v !== (m.poste || "")) maj(m.email, { poste: v || null }, "Poste mis à jour."); }} />
                      </td>
                      <td><div className="chips">{FONCTIONS.map(([c, l]) => (
                        <button key={c} type="button" className={"chip" + (m.fonctions.includes(c) ? " on" : "")} aria-pressed={m.fonctions.includes(c)} onClick={() => basculer(m, c)}>{l}</button>
                      ))}</div></td>
                      <td className="cx">{m.derniere_connexion ? date(m.derniere_connexion) : <span className="wait">En attente de 1re connexion</span>}</td>
                      <td className="acts">
                        <label className="chk"><input type="checkbox" checked={m.actif} disabled={soi} onChange={() => maj(m.email, { actif: !m.actif }, `${m.nom || m.email} ${m.actif ? "désactivé : son accès est coupé immédiatement" : "réactivé"}.`)} />Actif</label>
                        <label className="chk"><input type="checkbox" checked={m.admin} disabled={soi} onChange={() => maj(m.email, { admin: !m.admin }, `Droits d'administration ${m.admin ? "retirés à" : "donnés à"} ${m.nom || m.email}.`)} />Admin</label>
                        <label className="vfl">Accès<select value={m.admin ? "complet" : m.acces} disabled={m.admin} onChange={(e) => maj(m.email, { acces: e.target.value as Membre["acces"] }, `Accès de ${m.nom || m.email} : ${e.target.value === "employe" ? "employé (documents attribués)" : "complet"}.`)}><option value="complet">Complet</option><option value="employe">Employé</option></select></label>
                        {m.acces === "employe" && !m.admin ? <button type="button" className="lnk doc" onClick={() => setOuvert(ouvert === m.email ? null : m.email)}>Documents attribués ({docs.filter((d) => designe(m, d.id)).length}) {ouvert === m.email ? "▴" : "▾"}</button> : null}
                        {!m.user_id && !soi ? <button type="button" className="lnk" onClick={() => supprimer(m)}>Retirer l&apos;invitation</button> : null}
                      </td>
                    </tr>
                  , ouvert === m.email && m.acces === "employe" && !m.admin ? (
                    <tr key={m.email + "-docs"} className="docs-row"><td colSpan={4}>
                      <p className="fine" style={{ margin: "0 0 8px" }}>Documents visibles par {m.nom || m.email}. « Lire et attester » : la personne devra confirmer sa lecture une fois le document adopté. « Consultation » : visible sans attestation. Les autres documents, et le reste du site, lui sont invisibles.</p>
                      <table className="dtab"><thead><tr><th>Document</th><th className="c">Aucun</th><th className="c">Lire et attester</th><th className="c">Consultation</th></tr></thead><tbody>
                        {docs.map((d) => { const v = designe(m, d.id); const tous = !!(lects[d.id] || {}).tous; return (
                          <tr key={d.id}><td><b>{d.id}</b> {d.titre}<span className="mail"> · {d.type}{tous ? " · lecture demandée à tous" : ""}</span></td>
                            {(["", "lire", "consult"] as const).map((k) => <td key={k} className="c"><input type="radio" name={"d-" + m.email + "-" + d.id} checked={tous ? k === "lire" : v === k} disabled={tous} onChange={() => designer(m, d.id, k)} aria-label={d.id + " " + (k || "aucun")} /></td>)}
                          </tr>); })}
                      </tbody></table>
                    </td></tr>) : null];
                })}
                {!filtre.length ? <tr><td colSpan={4} className="vide">Aucun membre.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <p className="fine">Une personne qui s&apos;est déjà connectée ne se supprime pas : on la désactive, pour garder la trace de ses visas.</p>
        </section>

        <section className="card">
          <h2>Journal des accès</h2>
          <ul className="journal">
            {evts.map((e) => (
              <li key={e.id}><time>{date(e.le)}</time><span>{libelle(e)}</span></li>
            ))}
            {!evts.length ? <li className="vide">Aucun événement.</li> : null}
          </ul>
        </section>
      </main>
    </div>
  );
}

function libelle(e: Evt) {
  const qui = e.data?.nom || e.path;
  const par = e.par_email ? ` — par ${e.par_email}` : "";
  if (e.action === "CONNEXION") return `${qui} s'est connecté(e)`;
  if (e.action === "MEMBRE_INSERT") return `Accès ouvert : ${e.path} (${(e.data?.fonctions || []).map((c) => FL[c] || c).join(", ")})${par}`;
  if (e.action === "MEMBRE_DELETE") return `Invitation retirée : ${e.path}${par}`;
  return `Accès modifié : ${qui} — ${e.data?.actif ? "actif" : "désactivé"}${e.data?.admin ? ", admin" : ""} ; ${(e.data?.fonctions || []).map((c) => FL[c] || c).join(", ") || "aucune fonction"}${par}`;
}

const CSS = `
.pg{--navy:#0B2E52;--gold:#E8A020;--ink:#1C2B3A;--muted:#5A6B80;--line:#DCE3EC;--bg:#F5F7FA;--card:#fff;color:var(--ink);font:13px/1.5 Inter,"Helvetica Neue",Arial,sans-serif}

.top{background:var(--navy);color:#fff;padding:18px 0 16px}
.tophead{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap}
.brand{letter-spacing:.18em;font-weight:600;font-size:12.5px}.rule{width:28px;height:2px;background:var(--gold);margin:6px 0 8px}
.ttl{font-family:"Playfair Display",Georgia,serif;font-size:20px}
.top nav{display:flex;gap:18px;font-size:13.5px}.top a{color:#B9C8DA}.top a:hover{color:#fff}
.lead{max-width:780px;color:var(--muted);margin:22px 0 16px}
.stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.stats div{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:10px 16px;min-width:140px}
.stats b{display:block;font-size:20px;color:var(--navy)}.stats span{color:var(--muted);font-size:13px}
.warn,.ok,.err{border-radius:4px;padding:10px 12px;margin:0 0 14px;font-size:13.5px}
.warn{background:#FBF1DC;color:#6B4A0E}.ok{background:#E5F3EA;color:#1D5B34}.err{background:#FBE6E4;color:#8A2219}
.card{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:18px 20px;margin-bottom:18px}
h2{font-family:"Playfair Display",Georgia,serif;color:var(--navy);font-size:16px;margin:0 0 12px;font-weight:600}
.add{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 16px;align-items:end}
.add>label{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:13px}.add small{font-weight:400;color:var(--muted)}
input[type=email],input[type=search],.add input:not([type=checkbox]),.poste{border:1px solid var(--line);border-radius:4px;padding:8px 10px;font:inherit;background:#fff;color:inherit}
fieldset{grid-column:1/-1;border:1px solid var(--line);border-radius:4px;padding:8px 12px;display:flex;flex-wrap:wrap;gap:6px 18px}
legend{font-weight:600;font-size:13px;padding:0 4px}
.chk{display:inline-flex;align-items:center;gap:6px;font-size:13.5px;cursor:pointer}.adm{color:#6B4A0E}
.btn{grid-column:1/-1;justify-self:start;background:var(--navy);color:#fff;border:0;border-radius:4px;padding:10px 18px;font:inherit;font-weight:600;cursor:pointer}.btn:disabled{opacity:.6}
.listhead{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px}.listhead h2{margin:0}
.tools{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.tbl{overflow-x:auto}table{width:100%;border-collapse:collapse;min-width:760px}
th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:2px solid var(--line);padding:8px}
td{border-bottom:1px solid var(--line);padding:10px 8px;vertical-align:top}
tr.off td{opacity:.55}tr.busy{opacity:.6;pointer-events:none}
.nom{font-weight:600;display:flex;gap:6px;align-items:center;flex-wrap:wrap}.mail{color:var(--muted);font-size:13px}
.poste{margin-top:6px;padding:4px 8px;font-size:13px;width:100%;max-width:240px;box-sizing:border-box}
.tag{font-size:11px;font-weight:600;background:#E8EEF5;color:var(--navy);border-radius:10px;padding:1px 8px}.tag.gold{background:#FBF1DC;color:#6B4A0E}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{border:1px solid var(--line);background:#fff;color:var(--muted);border-radius:14px;padding:3px 10px;font:inherit;font-size:12.5px;cursor:pointer}
.chip.on{background:var(--navy);border-color:var(--navy);color:#fff}
.cx{font-size:13px;white-space:nowrap}.wait{color:#6B4A0E}
.acts{display:flex;flex-direction:column;gap:4px;white-space:nowrap}
.lnk{background:none;border:0;padding:0;color:#8A2219;text-decoration:underline;font:inherit;font-size:12.5px;cursor:pointer;text-align:left}
.fine{color:var(--muted);font-size:12.5px;margin:10px 0 0}
.vfl{display:flex;flex-direction:column;gap:2px;font-size:12px;color:var(--muted);margin-top:4px}.vfl select{font:inherit;font-size:13px;padding:3px 6px;border:1px solid var(--line);border-radius:4px}.lnk.doc{color:var(--navy);font-weight:600}.docs-row td{background:#F8FAFC}.dtab{width:100%;min-width:0;border-collapse:collapse}.dtab th,.dtab td{padding:5px 8px;font-size:13px}.dtab .c{text-align:center;width:110px}.add fieldset .chk span{font-weight:400}
.journal{list-style:none;margin:0;padding:0;max-height:360px;overflow:auto}
.journal li{display:flex;gap:14px;padding:6px 0;border-bottom:1px solid var(--line);font-size:13.5px}
.journal time{color:var(--muted);white-space:nowrap;min-width:150px}
.vide{color:var(--muted)}
@media (max-width:720px){.add{grid-template-columns:1fr}.journal li{flex-direction:column;gap:0}}
`;

