"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { COLS, CSS, Cfm, Confirmation, Evt, FL, FONCTIONS, Membre, MoiC, PL, Prerogatives, date, libelle, msg, peutDe, statutDe, telecharger } from "../../lib/admin-ui";

type Doc = { id: string; titre: string; type: string };
type Lect = { ids?: string[]; consult?: string[]; tous?: boolean; maj?: string };
const DOMAINE = "purposecapital.africa";
const SITE = "https://referentiel.purposecapital.africa";

// Page Membres : chaque administrateur n'agit que dans la limite de ses prérogatives (la base le vérifie de nouveau).
// Personne ne modifie son propre accès, sauf le super administrateur ; seuls les super administrateurs touchent aux administrateurs.
export default function Gestion({ moi, docs }: { moi: MoiC; docs: Doc[] }) {
  const sb = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const peut = peutDe(moi);
  const [ms, setMs] = useState<Membre[]>([]);
  const [evts, setEvts] = useState<Evt[]>([]);
  const [q, setQ] = useState("");
  const [fFonction, setFFonction] = useState("");
  const [fStatut, setFStatut] = useState("");
  const [note, setNote] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [cfm, setCfm] = useState<Cfm | null>(null);
  const [pend, setPend] = useState<Record<string, Partial<Membre>>>({});
  const [pendL, setPendL] = useState<Record<string, Lect>>({});
  const vierge = { email: "", nom: "", poste: "", fonctions: ["collab"] as string[], admin: false, prerogatives: [] as string[], acces: "employe" as "complet" | "employe" };
  const [f, setF] = useState(vierge);
  const [lects, setLects] = useState<Record<string, Lect>>({});
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [fiche, setFiche] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const [a, b] = await Promise.all([
      sb.from("membres").select(COLS).order("nom", { nullsFirst: false }),
      sb.from("journal").select("id,le,par_email,action,path,data").or("action.like.MEMBRE_%,action.eq.CONNEXION").order("le", { ascending: false }).limit(300),
    ]);
    if (a.error) setNote({ t: "err", m: msg(a.error) }); else setMs(a.data as Membre[]);
    if (!b.error) setEvts(b.data as Evt[]);
    const c = await sb.from("kv").select("path,data").like("path", "lectures/%");
    if (!c.error) setLects(Object.fromEntries((c.data || []).map((r) => [String(r.path).slice(9), (r.data || {}) as Lect])));
  }, [sb]);
  useEffect(() => { charger(); }, [charger]);

  // Ce que la personne connectée peut changer sur une ligne
  const droits = (m: Membre) => {
    const soi = m.email === moi.email;
    if (soi) return { soi, membres: moi.super, tableau: false, admin: false, prerog: false, lectures: false };
    if (m.admin) return { soi, membres: moi.super, tableau: false, admin: moi.super && !m.super, prerog: moi.super && !m.super, lectures: false };
    return { soi, membres: peut("membres"), tableau: peut("tableau"), admin: peut("admins"), prerog: peut("admins"), lectures: peut("lectures") };
  };

  const idDe = (m: Membre) => m.user_id || "email:" + m.email;
  const lectOf = (d: string): Lect => pendL[d] || lects[d] || {};
  const designe = (m: Membre, d: string): "lire" | "consult" | "" => { const L = lectOf(d); const ids = [m.user_id, "email:" + m.email]; return (L.ids || []).some((x) => ids.includes(x)) ? "lire" : (L.consult || []).some((x) => ids.includes(x)) ? "consult" : ""; };
  function designer(m: Membre, d: string, mode: "lire" | "consult" | "") {
    const L: Lect = JSON.parse(JSON.stringify(lectOf(d)));
    const ids = [m.user_id, "email:" + m.email].filter(Boolean) as string[];
    L.ids = (L.ids || []).filter((x) => !ids.includes(x)); L.consult = (L.consult || []).filter((x) => !ids.includes(x));
    if (mode === "lire") L.ids.push(idDe(m)); if (mode === "consult") L.consult.push(idDe(m));
    setPendL({ ...pendL, [d]: L });
  }
  // Les changements sont préparés, puis enregistrés ensemble après double validation
  function maj(email: string, part: Partial<Membre>) { setPend({ ...pend, [email]: { ...(pend[email] || {}), ...part } }); }
  const nbPend = Object.keys(pend).length + Object.keys(pendL).length;
  const titulaires = (code: string, liste = ms) => liste.filter((m) => m.actif && m.fonctions.includes(code));
  function descriptions() {
    const out: string[] = [];
    const apres = ms.map((m) => ({ ...m, ...(pend[m.email] || {}) }));
    for (const [email, p] of Object.entries(pend)) {
      const m = ms.find((x) => x.email === email); if (!m) continue; const qui = m.nom || m.email; const d: string[] = [];
      if (p.fonctions) { const plus = p.fonctions.filter((x) => !m.fonctions.includes(x)), moins = m.fonctions.filter((x) => !p.fonctions!.includes(x)); if (plus.length) d.push("attribue " + plus.map((x) => FL[x]).join(", ")); if (moins.length) d.push("retire " + moins.map((x) => FL[x]).join(", ")); }
      if (p.actif !== undefined && p.actif !== m.actif) d.push(p.actif ? "réactive l'accès" : "suspend l'accès (départ ou absence)");
      if (p.admin !== undefined && p.admin !== m.admin) d.push(p.admin ? "nomme administrateur" : "retire les droits d'administration");
      if (p.prerogatives && (p.admin ?? m.admin)) { const plus = p.prerogatives.filter((x) => !m.prerogatives.includes(x)), moins = m.prerogatives.filter((x) => !p.prerogatives!.includes(x)); if (plus.length) d.push("prérogatives données : " + plus.map((x) => PL[x]).join(", ")); if (moins.length) d.push("prérogatives retirées : " + moins.map((x) => PL[x]).join(", ")); }
      if (p.acces && p.acces !== m.acces) d.push("accès " + (p.acces === "employe" ? "employé (documents attribués)" : "complet"));
      if (p.tableau !== undefined && p.tableau !== !!m.tableau) d.push(p.tableau ? "ouvre le tableau de bord" : "retire le tableau de bord");
      if (p.poste !== undefined && p.poste !== m.poste) d.push("poste : " + (p.poste || "—"));
      if (d.length) out.push(qui + " : " + d.join(" ; "));
    }
    // Conséquences : une fonction de circuit qui n'a plus de titulaire bloque les documents qui en dépendent
    ["pca", "dg", "rcci", "adm", "dcom", "dmc"].forEach((c) => { if (titulaires(c).length && !titulaires(c, apres).length) out.push("⚠ Plus aucun titulaire actif de la fonction « " + FL[c] + " » : les documents qui en dépendent ne pourront plus être visés tant qu'un remplaçant n'est pas désigné."); });
    for (const [doc, L] of Object.entries(pendL)) {
      const a = lects[doc] || {}; const nom = (id: string) => { const m = ms.find((x) => x.user_id === id || "email:" + x.email === id); return m ? m.nom || m.email : id; };
      const diff = (k: "ids" | "consult", lab: string) => { const av = a[k] || [], bv = L[k] || []; const plus = bv.filter((x) => !av.includes(x)).map(nom), moins = av.filter((x) => !bv.includes(x)).map(nom); return [plus.length ? lab + " pour " + plus.join(", ") : "", moins.length ? "plus " + lab + " pour " + moins.join(", ") : ""]; };
      const d = [...diff("ids", "à lire et attester"), ...diff("consult", "en consultation")].filter(Boolean);
      if (d.length) out.push(doc + " : " + d.join(" ; "));
    }
    return out;
  }
  async function enregistrer() {
    setOccupe("__pend");
    for (const [email, p] of Object.entries(pend)) { const { error } = await sb.from("membres").update(p).eq("email", email); if (error) { setOccupe(null); setNote({ t: "err", m: msg(error) }); charger(); return; } }
    for (const [doc, L] of Object.entries(pendL)) { const { error } = await sb.from("kv").upsert({ path: "lectures/" + doc, data: { ...L, maj: new Date().toISOString() } }, { onConflict: "path" }); if (error) { setOccupe(null); setNote({ t: "err", m: msg(error) }); charger(); return; } }
    setOccupe(null); setPend({}); setPendL({}); setNote({ t: "ok", m: "Modifications enregistrées." }); charger();
  }
  const verifier = () => setCfm({ titre: "Enregistrer les modifications des accès", points: [...descriptions(), "Une personne suspendue ne peut plus ouvrir le référentiel ; ses visas restent au registre."], phrase: "enregistrer les modifications", bouton: "Enregistrer", ok: enregistrer });

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    const email = f.email.trim().toLowerCase();
    const admin = f.admin || !peut("membres");
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email)) return setNote({ t: "err", m: "Adresse invalide." });
    if (!email.endsWith("@" + DOMAINE) && !confirm(`Cette adresse n'est pas en @${DOMAINE}. Seuls les comptes de votre annuaire Microsoft 365 peuvent se connecter. Ajouter quand même ?`)) return;
    if (!f.fonctions.length) return setNote({ t: "err", m: "Cochez au moins une fonction." });
    setCfm({ titre: "Ouvrir un accès au référentiel", phrase: "ouvrir l'accès", bouton: "Ouvrir l'accès", points: [
      email + (f.nom.trim() ? " (" + f.nom.trim() + ")" : ""), "Fonctions : " + f.fonctions.map((c) => FL[c]).join(", "),
      ...(admin ? ["Administrateur — prérogatives : " + (f.prerogatives.map((p) => PL[p]).join(", ") || "aucune")] : []),
      "Accès : " + (admin || f.acces === "complet" ? "complet (tout le référentiel)" : "employé (seulement les documents attribués)"),
      "La personne pourra se connecter avec son compte Microsoft 365 dès maintenant."], ok: () => ouvrir(email, admin) });
  }
  async function ouvrir(email: string, admin: boolean) {
    setOccupe("__ajout");
    const { error } = await sb.from("membres").insert({ email, nom: f.nom.trim() || null, poste: f.poste.trim() || null, fonctions: f.fonctions, admin, prerogatives: admin ? f.prerogatives : [], actif: true, acces: admin ? "complet" : f.acces });
    setOccupe(null);
    if (error) return setNote({ t: "err", m: msg(error) });
    setNote({ t: "ok", m: `Accès ouvert pour ${email}. Prévenez la personne : elle se connecte sur ${SITE} avec son compte Microsoft 365.` });
    if (f.acces === "employe" && !admin && peut("lectures")) setOuvert(email);
    setF(vierge);
    charger();
  }
  const supprimer = (m: Membre) => setCfm({ titre: "Retirer une invitation", phrase: "retirer l'invitation", bouton: "Retirer", danger: true, points: [m.email + " ne s'est jamais connecté(e).", "L'invitation est supprimée ; vous pourrez en ouvrir une nouvelle."], ok: async () => {
    const { error } = await sb.from("membres").delete().eq("email", m.email);
    if (error) setNote({ t: "err", m: msg(error) }); else setNote({ t: "ok", m: "Invitation retirée." });
    charger();
  } });
  const basculer = (m: Membre, code: string) => maj(m.email, { fonctions: m.fonctions.includes(code) ? m.fonctions.filter((x) => x !== code) : [...m.fonctions, code] });

  const vue = ms.map((m) => ({ ...m, ...(pend[m.email] || {}) }));
  const filtre = vue.filter((m) => (!fStatut ? m.actif : statutDe(m) === fStatut) && (!fFonction || (fFonction === "__admin" ? m.admin : m.fonctions.includes(fFonction)))
    && (!q || (m.email + " " + (m.nom || "") + " " + (m.poste || "")).toLowerCase().includes(q.toLowerCase())));
  const nb = { actifs: ms.filter((m) => m.actif && m.user_id).length, attente: ms.filter((m) => m.actif && !m.user_id).length, inactifs: ms.filter((m) => !m.actif).length, admins: ms.filter((m) => m.admin && m.actif).length };
  const alertes = (["dg", "rcci", "pca"] as const).filter((c) => !titulaires(c).length);
  const aLire = (m: Membre) => docs.filter((d) => { const L = lects[d.id] || {}; return L.tous || (L.ids || []).some((x) => x === m.user_id || x === "email:" + m.email); }).length;
  const exporter = () => telecharger("habilitations_" + new Date().toISOString().slice(0, 10) + ".csv", [
    ["Nom", "Adresse", "Poste", "Fonctions", "Statut", "Accès", "Niveau", "Prérogatives", "Tableau de bord", "Documents à lire", "Accès ouvert le", "Dernière connexion"],
    ...ms.map((m) => [m.nom || "", m.email, m.poste || "", m.fonctions.map((c) => FL[c] || c).join(", "), statutDe(m), m.acces === "employe" ? "Employé" : "Complet", m.super ? "Super administrateur" : m.admin ? "Administrateur" : "", m.super ? "Toutes" : m.prerogatives.map((p) => PL[p] || p).join(", "), m.admin || m.tableau ? "oui" : "", String(aLire(m)), date(m.cree_le), date(m.derniere_connexion)]),
  ]);
  const formAdmin = f.admin || !peut("membres");

  return (
    <div className="pg">
      <style>{CSS}</style>
      <main className="wrap view">
        <div className="eyebrow">Administration</div>
        <h1 className="title">Membres</h1>
        <p className="lead">Seules les personnes inscrites ici, et actives, peuvent ouvrir le référentiel avec leur compte Microsoft 365. Les fonctions déterminent qui vise quoi ; les administrateurs gèrent les accès dans la limite de leurs prérogatives{moi.super ? "" : " (les vôtres : " + (moi.prerogatives.map((p) => PL[p]).join(", ") || "aucune") + ")"}.</p>

        <div className="stats">
          <div><b>{nb.actifs}</b><span>actifs</span></div>
          <div><b>{nb.attente}</b><span>invités, jamais connectés</span></div>
          <div><b>{nb.inactifs}</b><span>suspendus</span></div>
          <div><b>{nb.admins}</b><span>administrateurs</span></div>
        </div>
        {alertes.length ? <p className="warn">Fonction sans titulaire actif : {alertes.map((c) => FL[c]).join(", ")}. Les documents qui en dépendent ne pourront pas être visés.</p> : null}
        {note ? <p role="status" className={note.t === "ok" ? "ok" : "err"}>{note.m}</p> : null}
        {nbPend ? <div className="pending-bar"><span>{nbPend} modification{nbPend > 1 ? "s" : ""} non enregistrée{nbPend > 1 ? "s" : ""}</span><button type="button" className="btn primary" disabled={occupe === "__pend"} onClick={verifier}>Vérifier et enregistrer…</button><button type="button" className="btn ghost-l" onClick={() => { setPend({}); setPendL({}); }}>Annuler</button></div> : null}
        {cfm ? <Confirmation c={cfm} fermer={() => setCfm(null)} /> : null}

        {peut("membres") || peut("admins") ? <section className="card">
          <h2>Ouvrir un accès</h2>
          <form onSubmit={ajouter} className="add">
            <label>Adresse Microsoft 365<input type="email" required value={f.email} placeholder={"prenom.nom@" + DOMAINE} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
            <label>Nom <small>(remplacé par le nom Microsoft à la 1re connexion)</small><input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} /></label>
            <label>Poste<input value={f.poste} placeholder="ex. Chargé de clientèle" onChange={(e) => setF({ ...f, poste: e.target.value })} /></label>
            <fieldset><legend>Fonctions</legend>
              {FONCTIONS.map(([c, l]) => (
                <label key={c} className="chk"><input type="checkbox" checked={f.fonctions.includes(c)} onChange={() => setF({ ...f, fonctions: f.fonctions.includes(c) ? f.fonctions.filter((x) => x !== c) : [...f.fonctions, c] })} />{l}</label>
              ))}
            </fieldset>
            {peut("admins") ? <fieldset><legend>Administration</legend>
              <label className="chk adm"><input type="checkbox" checked={formAdmin} disabled={!peut("membres")} onChange={() => setF({ ...f, admin: !f.admin })} />Administrateur</label>
              {formAdmin ? <div style={{ flexBasis: "100%" }}><span className="mail">Prérogatives (vous ne pouvez donner que les vôtres) :</span><Prerogatives val={f.prerogatives} moi={moi} onChange={(v) => setF({ ...f, prerogatives: v })} /></div> : null}
            </fieldset> : null}
            {!formAdmin ? <fieldset><legend>Accès au référentiel</legend>
              <label className="chk"><input type="radio" name="acces" checked={f.acces === "employe"} onChange={() => setF({ ...f, acces: "employe" })} /><span><b>Employé</b> — voit seulement les documents attribués</span></label>
              <label className="chk"><input type="radio" name="acces" checked={f.acces === "complet"} onChange={() => setF({ ...f, acces: "complet" })} /><span><b>Complet</b> — tout le référentiel (dirigeants, RCCI, rédacteurs, administrateurs du Conseil)</span></label>
            </fieldset> : null}
            <button className="btn" disabled={occupe === "__ajout"}>{occupe === "__ajout" ? "Enregistrement…" : "Ouvrir l'accès"}</button>
          </form>
        </section> : null}

        <section className="card">
          <div className="listhead">
            <h2>Membres</h2>
            <div className="tools">
              <input type="search" placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un membre" />
              <select className="sel" value={fFonction} onChange={(e) => setFFonction(e.target.value)} aria-label="Fonction"><option value="">Toutes les fonctions</option><option value="__admin">Administrateurs</option>{FONCTIONS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select>
              <select className="sel" value={fStatut} onChange={(e) => setFStatut(e.target.value)} aria-label="Statut"><option value="">Actifs et invités</option><option value="Actif">Actifs</option><option value="Invité">Invités</option><option value="Suspendu">Suspendus</option></select>
              <button type="button" className="btn sec" onClick={exporter}>Exporter les habilitations (CSV)</button>
            </div>
          </div>
          <div className="tbl">
            <table>
              <thead><tr><th>Personne</th><th>Fonctions</th><th>Statut</th><th>Accès</th></tr></thead>
              <tbody>
                {filtre.map((m) => {
                  const o = ms.find((x) => x.email === m.email)!; const dr = droits(o);
                  const rows = [
                    <tr key={m.email} className={(m.actif ? "" : "off ") + (occupe === m.email ? "busy" : "") + (pend[m.email] ? " edited" : "")}>
                      <td>
                        <div className="nom">{m.nom || "—"}{dr.soi ? <span className="tag">vous</span> : null}{m.super ? <span className="tag navy">super admin</span> : m.admin ? <span className="tag gold">admin</span> : null}</div>
                        <div className="mail">{m.email}</div>
                        <input className="poste" defaultValue={m.poste || ""} placeholder="Poste" aria-label={"Poste de " + m.email} disabled={!dr.membres}
                          onBlur={(e) => { const v = e.target.value.trim(); if (v !== (o.poste || "")) maj(m.email, { poste: v || null }); }} />
                        <div><button type="button" className="lnk" onClick={() => setFiche(fiche === m.email ? null : m.email)}>Fiche {fiche === m.email ? "▴" : "▾"}</button></div>
                      </td>
                      <td><div className="chips">{FONCTIONS.map(([c, l]) => (
                        <button key={c} type="button" disabled={!dr.membres} className={"chip" + (m.fonctions.includes(c) ? " on" : "")} aria-pressed={m.fonctions.includes(c)} onClick={() => basculer(m, c)}>{l}</button>
                      ))}</div>
                        {m.admin && !m.super ? <div className="mail" style={{ marginTop: 6 }}>Prérogatives : {dr.prerog ? null : (m.prerogatives.map((p) => PL[p]).join(", ") || "aucune")}{dr.prerog ? <Prerogatives val={m.prerogatives} moi={moi} onChange={(v) => maj(m.email, { prerogatives: v })} /> : null}</div> : null}
                        {dr.soi && !moi.super ? <div className="mail" style={{ marginTop: 6 }}>Votre propre accès se modifie par un autre administrateur.</div> : null}
                      </td>
                      <td className="cx"><span className={"st " + statutDe(m)}>{statutDe(m)}</span><div className="mail">{m.derniere_connexion ? "connecté(e) le " + date(m.derniere_connexion) : "invité(e) le " + date(m.cree_le)}</div></td>
                      <td className="acts">
                        <label className="chk"><input type="checkbox" checked={!m.actif} disabled={!dr.membres || dr.soi} onChange={() => maj(m.email, { actif: !m.actif })} />Suspendu</label>
                        {!m.super ? <label className="chk" title={!dr.admin ? "Réservé à la prérogative « Nommer des administrateurs » (et au super administrateur pour retirer)" : ""}><input type="checkbox" checked={m.admin} disabled={!dr.admin || (o.admin && !moi.super)} onChange={() => maj(m.email, m.admin ? { admin: false, prerogatives: [] } : { admin: true, prerogatives: [] })} />Administrateur</label> : null}
                        <label className="vfl">Accès<select value={m.admin ? "complet" : m.acces} disabled={m.admin || !dr.membres} onChange={(e) => maj(m.email, { acces: e.target.value as Membre["acces"] })}><option value="complet">Complet</option><option value="employe">Employé</option></select></label>
                        <label className="chk" title={m.admin ? "Inclus pour les administrateurs" : m.acces === "employe" ? "Réservé aux accès complets" : ""}><input type="checkbox" checked={m.admin || !!m.tableau} disabled={m.admin || m.acces === "employe" || !dr.tableau} onChange={() => maj(m.email, { tableau: !m.tableau })} />Tableau de bord</label>
                        {m.acces === "employe" && !m.admin && dr.lectures ? <button type="button" className="lnk doc" onClick={() => setOuvert(ouvert === m.email ? null : m.email)}>Documents attribués ({docs.filter((d) => designe(m, d.id)).length}) {ouvert === m.email ? "▴" : "▾"}</button> : null}
                        {!m.user_id && !dr.soi && !m.admin && peut("membres") ? <button type="button" className="lnk rouge" onClick={() => supprimer(m)}>Retirer l&apos;invitation</button> : null}
                      </td>
                    </tr>,
                  ];
                  if (fiche === m.email) {
                    const hist = evts.filter((e) => e.path === m.email).slice(0, 12);
                    const seul = m.fonctions.filter((c) => c !== "collab" && c !== "redac" && titulaires(c).length === 1 && titulaires(c)[0].email === m.email);
                    rows.push(<tr key={m.email + "-fiche"} className="docs-row"><td colSpan={4}>
                      <div className="fiche">
                        <div><b>Statut</b>{statutDe(m)}</div>
                        <div><b>Accès ouvert le</b>{date(m.cree_le)}</div>
                        <div><b>Dernière connexion</b>{date(m.derniere_connexion) || "jamais"}</div>
                        <div><b>Niveau</b>{m.super ? "Super administrateur" : m.admin ? "Administrateur" : m.acces === "employe" ? "Employé" : "Accès complet"}</div>
                        <div><b>Documents à lire</b>{aLire(m)}</div>
                        <div><b>Tableau de bord</b>{m.admin || m.tableau ? "oui" : "non"}</div>
                        <div style={{ gridColumn: "span 2" }}><b>Seul titulaire de</b>{seul.length ? seul.map((c) => FL[c]).join(", ") + " — à remplacer avant tout départ" : "aucune fonction de circuit"}</div>
                      </div>
                      <b className="mail">Historique de l&apos;accès</b>
                      <ul className="journal" style={{ maxHeight: 200 }}>{hist.map((e) => <li key={e.id}><time>{date(e.le)}</time><span>{libelle(e)}</span></li>)}{!hist.length ? <li className="vide">Aucun événement.</li> : null}</ul>
                    </td></tr>);
                  }
                  if (ouvert === m.email && m.acces === "employe" && !m.admin && dr.lectures) rows.push(
                    <tr key={m.email + "-docs"} className="docs-row"><td colSpan={4}>
                      <p className="fine" style={{ margin: "0 0 8px" }}>Documents visibles par {m.nom || m.email}. « Lire et attester » : la personne devra confirmer sa lecture une fois le document adopté. « Consultation » : visible sans attestation. Les autres documents, et le reste du site, lui sont invisibles.</p>
                      <table className="dtab"><thead><tr><th>Document</th><th className="c">Aucun</th><th className="c">Lire et attester</th><th className="c">Consultation</th></tr></thead><tbody>
                        {docs.map((d) => { const v = designe(m, d.id); const tous = !!(lects[d.id] || {}).tous; return (
                          <tr key={d.id}><td><b>{d.id}</b> {d.titre}<span className="mail"> · {d.type}{tous ? " · lecture demandée à tous" : ""}</span></td>
                            {(["", "lire", "consult"] as const).map((k) => <td key={k} className="c"><input type="radio" name={"d-" + m.email + "-" + d.id} checked={tous ? k === "lire" : v === k} disabled={tous} onChange={() => designer(m, d.id, k)} aria-label={d.id + " " + (k || "aucun")} /></td>)}
                          </tr>); })}
                      </tbody></table>
                    </td></tr>);
                  return rows;
                })}
                {!filtre.length ? <tr><td colSpan={4} className="vide">Aucun membre.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <p className="fine">Une personne qui s&apos;est déjà connectée ne se supprime pas : on la suspend, pour garder la trace de ses visas. Avant un départ, désignez un remplaçant pour chaque fonction dont elle est seule titulaire (voir sa fiche).</p>
        </section>

        <section className="card">
          <h2>Journal des accès</h2>
          <ul className="journal">
            {evts.slice(0, 60).map((e) => <li key={e.id}><time>{date(e.le)}</time><span>{libelle(e)}</span></li>)}
            {!evts.length ? <li className="vide">Aucun événement.</li> : null}
          </ul>
        </section>
      </main>
    </div>
  );
}
