"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { avisDus, loc, t, useLangue, COLS, CSS, Cfm, Confirmation, Evt, FL, FONCTIONS, Membre, MoiC, PL, Prerogatives, date, msg, peutDe, statutDe, telecharger } from "../../lib/admin-ui";

type Doc = { id: string; titre: string; type: string };
type Lect = { ids?: string[]; consult?: string[]; tous?: boolean; maj?: string };
const DOMAINE = "purposecapital.africa";
const SITE = "https://referentiel.purposecapital.africa";
const VIERGE: Membre = { email: "", user_id: null, nom: "", poste: "", fonctions: ["collab"], actif: true, admin: false, super: false, prerogatives: [], cree_le: "", derniere_connexion: null, acces: "employe", tableau: false };
const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const jour = (s: string | null) => (s ? new Date(s).toLocaleDateString(loc(), { day: "2-digit", month: "short", year: "numeric" }) : "—");

// Liste déroulante à choix multiples (fonctions)
function ChoixFonctions({ val, onChange, disabled }: { val: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false); };
    document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f);
  }, []);
  return (
    <div className="msel" ref={ref}>
      <button type="button" className="msel-btn" disabled={disabled} aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)}>
        <span>{val.length ? val.map((c) => FL[c] || c).join(", ") : "Choisir les fonctions"}</span><i aria-hidden="true">▾</i>
      </button>
      {ouvert ? <div className="msel-pop" role="listbox" aria-multiselectable="true">
        {FONCTIONS.map(([c, l]) => <label key={c} className="chk"><input type="checkbox" checked={val.includes(c)} onChange={() => onChange(val.includes(c) ? val.filter((x) => x !== c) : [...val, c])} />{l}</label>)}
      </div> : null}
    </div>
  );
}

// Journal des accès : chaque modification est décrite par différence avec l'état précédent de la même personne
type Ligne = { id: number; le: string; qui: string; email: string; type: string; detail: string; par: string };
const TYPES: Record<string, string> = { CONNEXION: "Connexion", MEMBRE_INSERT: "Accès ouvert", MEMBRE_UPDATE: "Modification", MEMBRE_DELETE: "Invitation retirée" };
function lignes(evts: Evt[], nomDe: (e: string) => string): Ligne[] {
  const avant: Record<string, Partial<Membre>> = {};
  const out: Ligne[] = [];
  [...evts].sort((a, b) => (a.le < b.le ? -1 : 1)).forEach((e) => {
    const d = (e.data || {}) as Partial<Membre>, p = avant[e.path];
    const det: string[] = [];
    if (e.action === "MEMBRE_INSERT") det.push((d.fonctions || []).map((c) => FL[c] || c).join(", "), d.admin ? "administrateur" : d.acces === "employe" ? "accès employé" : "accès complet");
    if (e.action === "MEMBRE_UPDATE") {
      if (!p) det.push("état : " + ((d.fonctions || []).map((c) => FL[c] || c).join(", ") || "aucune fonction") + (d.actif === false ? ", suspendu" : ""));
      else {
        const pf = p.fonctions || [], nf = d.fonctions || [];
        const plus = nf.filter((x) => !pf.includes(x)), moins = pf.filter((x) => !nf.includes(x));
        if (plus.length) det.push("+ " + plus.map((c) => FL[c] || c).join(", "));
        if (moins.length) det.push("− " + moins.map((c) => FL[c] || c).join(", "));
        if (p.actif !== d.actif) det.push(d.actif ? "réactivé" : "suspendu");
        if (!!p.admin !== !!d.admin) det.push(d.admin ? "nommé administrateur" : "n'est plus administrateur");
        if (!!p.super !== !!d.super && d.super !== undefined) det.push(d.super ? "super administrateur" : "n'est plus super administrateur");
        const pp = p.prerogatives || [], np = d.prerogatives || [];
        if (Array.isArray(d.prerogatives) && JSON.stringify(pp) !== JSON.stringify(np)) det.push("prérogatives : " + (np.map((x) => PL[x] || x).join(", ") || "aucune"));
        if (p.acces !== d.acces && d.acces) det.push("accès " + (d.acces === "employe" ? "employé" : "complet"));
        if (!!p.tableau !== !!d.tableau && d.tableau !== undefined) det.push(d.tableau ? "tableau de bord ouvert" : "tableau de bord retiré");
        if ((p.poste || "") !== (d.poste || "")) det.push("poste : " + (d.poste || "—"));
        if ((p.nom || "") !== (d.nom || "") && p.nom) det.push("nom : " + (d.nom || "—"));
        if (!det.length) det.push("sans changement visible");
      }
    }
    if (e.action !== "CONNEXION") avant[e.path] = d; else if (!avant[e.path]) avant[e.path] = d;
    out.push({ id: e.id, le: e.le, qui: nomDe(e.path) || (d.nom as string) || e.path, email: e.path, type: TYPES[e.action] || e.action, detail: det.filter(Boolean).join(" ; "), par: e.par_email ? nomDe(e.par_email) || e.par_email : e.action === "CONNEXION" ? "" : "système" });
  });
  return out;
}

export default function Gestion({ moi, docs }: { moi: MoiC; docs: Doc[] }) {
  const sb = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  useLangue();
  const peut = peutDe(moi);
  const [ms, setMs] = useState<Membre[]>([]);
  const [evts, setEvts] = useState<Evt[]>([]);
  const [lects, setLects] = useState<Record<string, Lect>>({});
  const [note, setNote] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [cfm, setCfm] = useState<Cfm | null>(null);
  // Liste
  const [q, setQ] = useState(""); const [fFonction, setFFonction] = useState(""); const [fStatut, setFStatut] = useState("");
  const [tri, setTri] = useState<{ k: string; s: 1 | -1 }>({ k: "nom", s: 1 });
  // Volet latéral : fiche d'un membre ou nouveau membre
  const [volet, setVolet] = useState<{ mode: "fiche" | "nouveau"; email?: string } | null>(null);
  const [ed, setEd] = useState<Membre>(VIERGE);
  const [edL, setEdL] = useState<Record<string, Lect>>({});
  const [occupe, setOccupe] = useState(false);
  // Journal
  const [jq, setJq] = useState(""); const [jType, setJType] = useState(""); const [jPers, setJPers] = useState(""); const [jPer, setJPer] = useState("0");
  const [jTri, setJTri] = useState<{ k: keyof Ligne; s: 1 | -1 }>({ k: "le", s: -1 });
  const [jNb, setJNb] = useState(50);

  const charger = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      sb.from("membres").select(COLS).order("nom", { nullsFirst: false }),
      sb.from("journal").select("id,le,par_email,action,path,data").or("action.like.MEMBRE_%,action.eq.CONNEXION").order("le", { ascending: false }).limit(1000),
      sb.from("kv").select("path,data").like("path", "lectures/%"),
    ]);
    if (a.error) setNote({ t: "err", m: msg(a.error) }); else setMs(a.data as Membre[]);
    if (!b.error) setEvts(b.data as Evt[]);
    if (!c.error) setLects(Object.fromEntries((c.data || []).map((r) => [String(r.path).slice(9), (r.data || {}) as Lect])));
  }, [sb]);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === "Escape" && !cfm) setVolet(null); }; document.addEventListener("keydown", f); return () => document.removeEventListener("keydown", f); }, [cfm]);

  const nomDe = (email: string) => { const m = ms.find((x) => x.email === email); return m ? m.nom || m.email : ""; };
  const titulaires = (code: string, liste = ms) => liste.filter((m) => m.actif && m.fonctions.includes(code));
  const droits = (m: Membre) => {
    const soi = m.email === moi.email;
    if (soi) return { soi, membres: moi.super, tableau: false, admin: false, lectures: false };
    if (m.admin) return { soi, membres: moi.super, tableau: false, admin: moi.super && !m.super, lectures: false };
    return { soi, membres: peut("membres"), tableau: peut("tableau"), admin: peut("admins"), lectures: peut("lectures") };
  };
  const idsDe = (m: Membre) => [m.user_id, "email:" + m.email].filter(Boolean) as string[];
  const lectDe = (d: string): Lect => edL[d] || lects[d] || {};
  const designe = (m: Membre, d: string): "lire" | "consult" | "" => { const L = lectDe(d), ids = idsDe(m); return (L.ids || []).some((x) => ids.includes(x)) ? "lire" : (L.consult || []).some((x) => ids.includes(x)) ? "consult" : ""; };
  const aLire = (m: Membre) => docs.filter((d) => { const L = lects[d.id] || {}; return L.tous || (L.ids || []).some((x) => idsDe(m).includes(x)); }).length;

  function ouvrirFiche(m: Membre) { setEd({ ...m, nom: m.nom || "", poste: m.poste || "" }); setEdL({}); setVolet({ mode: "fiche", email: m.email }); setNote(null); }
  function ouvrirNouveau() { setEd({ ...VIERGE, admin: !peut("membres") }); setEdL({}); setVolet({ mode: "nouveau" }); setNote(null); }
  const orig = volet?.mode === "fiche" ? ms.find((m) => m.email === volet.email) : undefined;

  // Différences entre la fiche et l'enregistrement
  function patch(): Partial<Membre> {
    if (!orig) return {};
    const p: Partial<Membre> = {};
    if ((ed.nom || "").trim() !== (orig.nom || "")) p.nom = (ed.nom || "").trim() || null;
    if ((ed.poste || "").trim() !== (orig.poste || "")) p.poste = (ed.poste || "").trim() || null;
    if (JSON.stringify([...ed.fonctions].sort()) !== JSON.stringify([...orig.fonctions].sort())) p.fonctions = ed.fonctions;
    if (ed.actif !== orig.actif) p.actif = ed.actif;
    if (ed.admin !== orig.admin) p.admin = ed.admin;
    if (ed.admin && JSON.stringify([...ed.prerogatives].sort()) !== JSON.stringify([...orig.prerogatives].sort())) p.prerogatives = ed.prerogatives;
    if (!ed.admin && orig.admin) p.prerogatives = [];
    if (!ed.admin && ed.acces !== orig.acces) p.acces = ed.acces;
    if (!!ed.tableau !== !!orig.tableau) p.tableau = !!ed.tableau;
    return p;
  }
  function decrire(p: Partial<Membre>, m: Membre) {
    const d: string[] = [];
    if (p.nom !== undefined) d.push("nom : " + (p.nom || "—"));
    if (p.poste !== undefined) d.push("poste : " + (p.poste || "—"));
    if (p.fonctions) { const plus = p.fonctions.filter((x) => !m.fonctions.includes(x)), moins = m.fonctions.filter((x) => !p.fonctions!.includes(x)); if (plus.length) d.push("attribue " + plus.map((x) => FL[x]).join(", ")); if (moins.length) d.push("retire " + moins.map((x) => FL[x]).join(", ")); }
    if (p.actif !== undefined) d.push(p.actif ? "réactive l'accès" : "suspend l'accès (départ ou absence)");
    if (p.admin !== undefined) d.push(p.admin ? "nomme administrateur" : "retire les droits d'administration");
    if (p.prerogatives && p.admin !== false) d.push("prérogatives : " + (p.prerogatives.map((x) => PL[x]).join(", ") || "aucune"));
    if (p.acces) d.push("accès " + (p.acces === "employe" ? "employé (documents attribués)" : "complet"));
    if (p.tableau !== undefined) d.push(p.tableau ? "ouvre le tableau de bord" : "retire le tableau de bord");
    const apres = ms.map((x) => (x.email === m.email ? { ...x, ...p } : x));
    ["pca", "dg", "rcci", "adm", "dcom", "dmc"].forEach((c) => { if (titulaires(c).length && !titulaires(c, apres).length) d.push("⚠ plus aucun titulaire actif de la fonction « " + FL[c] + " » : les documents qui en dépendent ne pourront plus être visés"); });
    Object.keys(edL).forEach((doc) => { const v = designe(m, doc); d.push(doc + " : " + (v === "lire" ? "à lire et attester" : v === "consult" ? "en consultation" : "retiré")); });
    return d;
  }
  function enregistrerFiche() {
    if (!orig) return;
    const p = patch(); const d = decrire(p, orig);
    if (!d.length) { setVolet(null); return; }
    if (!ed.fonctions.length) return setNote({ t: "err", m: "Au moins une fonction est nécessaire." });
    setCfm({ titre: "Modifier l'accès de " + (orig.nom || orig.email), points: d, phrase: "modifier l'accès", bouton: "Enregistrer", danger: p.actif === false, ok: async () => {
      setOccupe(true);
      if (Object.keys(p).length) { const { error } = await sb.from("membres").update(p).eq("email", orig.email); if (error) { setOccupe(false); setNote({ t: "err", m: msg(error) }); charger(); return; } }
      for (const [doc, L] of Object.entries(edL)) { const { error } = await sb.from("kv").upsert({ path: "lectures/" + doc, data: { ...L, maj: new Date().toISOString() } }, { onConflict: "path" }); if (error) { setOccupe(false); setNote({ t: "err", m: msg(error) }); charger(); return; } }
      setOccupe(false); setVolet(null); setNote({ t: "ok", m: "Accès de " + (ed.nom || orig.email) + " mis à jour." }); charger(); avisDus();
    } });
  }
  function creer() {
    const email = ed.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email)) return setNote({ t: "err", m: "Adresse invalide." });
    if (!ed.fonctions.length) return setNote({ t: "err", m: "Choisissez au moins une fonction." });
    if (ms.some((m) => m.email === email)) return setNote({ t: "err", m: "Cette adresse a déjà un accès." });
    const hors = !email.endsWith("@" + DOMAINE);
    setCfm({ titre: "Ouvrir un accès au référentiel", phrase: "ouvrir l'accès", bouton: "Ouvrir l'accès", points: [
      email + (ed.nom ? " (" + ed.nom + ")" : "") + (ed.poste ? " — " + ed.poste : ""), "Fonctions : " + ed.fonctions.map((c) => FL[c]).join(", "),
      ...(ed.admin ? ["Administrateur — prérogatives : " + (ed.prerogatives.map((p) => PL[p]).join(", ") || "aucune")] : []),
      "Accès : " + (ed.admin || ed.acces === "complet" ? "complet (tout le référentiel)" : "employé (seulement les documents attribués)"),
      ...(hors ? ["⚠ Adresse hors de @" + DOMAINE + " : seuls les comptes de votre annuaire Microsoft 365 peuvent se connecter."] : []),
      "La personne pourra se connecter avec son compte Microsoft 365 dès maintenant."], ok: async () => {
      setOccupe(true);
      const { error } = await sb.from("membres").insert({ email, nom: ed.nom?.trim() || null, poste: ed.poste?.trim() || null, fonctions: ed.fonctions, admin: ed.admin, prerogatives: ed.admin ? ed.prerogatives : [], actif: true, acces: ed.admin ? "complet" : ed.acces, tableau: !!ed.tableau && peut("tableau") });
      setOccupe(false);
      if (error) return setNote({ t: "err", m: msg(error) });
      setNote({ t: "ok", m: `Accès ouvert pour ${email}. Elle se connecte sur ${SITE} avec son compte Microsoft 365 ; un avis lui est envoyé par e-mail si les envois automatiques sont actifs.` }); avisDus();
      await charger();
      const m = { ...VIERGE, ...ed, email, cree_le: new Date().toISOString() };
      if (!ed.admin && ed.acces === "employe" && peut("lectures")) { setEd(m); setVolet({ mode: "fiche", email }); } else setVolet(null);
    } });
  }
  const retirer = (m: Membre) => setCfm({ titre: "Retirer une invitation", phrase: "retirer l'invitation", bouton: "Retirer", danger: true, points: [m.email + " ne s'est jamais connecté(e).", "L'invitation est supprimée ; vous pourrez en ouvrir une nouvelle."], ok: async () => {
    const { error } = await sb.from("membres").delete().eq("email", m.email);
    if (error) setNote({ t: "err", m: msg(error) }); else { setNote({ t: "ok", m: "Invitation retirée." }); setVolet(null); }
    charger();
  } });
  function designer(m: Membre, d: string, mode: "lire" | "consult" | "") {
    const L: Lect = JSON.parse(JSON.stringify(lectDe(d))); const ids = idsDe(m);
    L.ids = (L.ids || []).filter((x) => !ids.includes(x)); L.consult = (L.consult || []).filter((x) => !ids.includes(x));
    const id = m.user_id || "email:" + m.email;
    if (mode === "lire") L.ids.push(id); if (mode === "consult") L.consult.push(id);
    setEdL({ ...edL, [d]: L });
  }

  // ---------- Liste ----------
  const niveau = (m: Membre) => (m.super ? "Super admin" : m.admin ? "Administrateur" : m.acces === "employe" ? "Employé" : "Complet");
  const cle = (m: Membre, k: string): string => k === "nom" ? norm(m.nom || m.email) : k === "poste" ? norm(m.poste || "~") : k === "fonctions" ? m.fonctions.map((c) => FL[c]).join(",") : k === "statut" ? statutDe(m) : k === "niveau" ? niveau(m) : k === "cx" ? (m.derniere_connexion || "") : "";
  const mots = norm(q).split(/\s+/).filter(Boolean);
  const liste = ms.filter((m) => (!fStatut ? m.actif : statutDe(m) === fStatut) && (!fFonction || (fFonction === "__admin" ? m.admin : m.fonctions.includes(fFonction)))
    && mots.every((w) => norm([m.nom, m.email, m.poste, m.fonctions.map((c) => FL[c]).join(" "), statutDe(m), niveau(m)].join(" ")).includes(w)))
    .sort((a, b) => (cle(a, tri.k) < cle(b, tri.k) ? -1 : cle(a, tri.k) > cle(b, tri.k) ? 1 : 0) * tri.s);
  const th = (k: string, l: string) => <th aria-sort={tri.k === k ? (tri.s > 0 ? "ascending" : "descending") : "none"}><button type="button" className="thb" onClick={() => setTri({ k, s: tri.k === k ? (-tri.s as 1 | -1) : 1 })}>{l}{tri.k === k ? (tri.s > 0 ? " ▴" : " ▾") : ""}</button></th>;
  const nb = { actifs: ms.filter((m) => m.actif && m.user_id).length, attente: ms.filter((m) => m.actif && !m.user_id).length, inactifs: ms.filter((m) => !m.actif).length, admins: ms.filter((m) => m.admin && m.actif).length };
  const alertes = (["dg", "rcci", "pca"] as const).filter((c) => !titulaires(c).length);
  const exporter = () => telecharger("habilitations_" + new Date().toISOString().slice(0, 10) + ".csv", [
    ["Nom", "Adresse", "Poste", "Fonctions", "Statut", "Niveau", "Prérogatives", "Tableau de bord", "Documents à lire", "Accès ouvert le", "Dernière connexion"],
    ...ms.map((m) => [m.nom || "", m.email, m.poste || "", m.fonctions.map((c) => FL[c] || c).join(", "), statutDe(m), niveau(m), m.super ? "Toutes" : m.prerogatives.map((p) => PL[p] || p).join(", "), m.admin || m.tableau ? "oui" : "", String(aLire(m)), date(m.cree_le), date(m.derniere_connexion)]),
  ]);

  // ---------- Journal ----------
  const toutes = useMemo(() => lignes(evts, nomDe), [evts, ms]); // eslint-disable-line react-hooks/exhaustive-deps
  const jMots = norm(jq).split(/\s+/).filter(Boolean);
  const jLim = +jPer ? Date.now() - +jPer * 86400000 : 0;
  const jListe = toutes.filter((l) => (!jType || l.type === jType) && (!jPers || l.email === jPers || l.par === nomDe(jPers)) && (!jLim || new Date(l.le).getTime() >= jLim)
    && jMots.every((w) => norm([l.qui, l.email, l.type, l.detail, l.par, date(l.le)].join(" ")).includes(w)))
    .sort((a, b) => (String(a[jTri.k]) < String(b[jTri.k]) ? -1 : String(a[jTri.k]) > String(b[jTri.k]) ? 1 : 0) * jTri.s);
  const jth = (k: keyof Ligne, l: string) => <th aria-sort={jTri.k === k ? (jTri.s > 0 ? "ascending" : "descending") : "none"}><button type="button" className="thb" onClick={() => setJTri({ k, s: jTri.k === k ? (-jTri.s as 1 | -1) : k === "le" ? -1 : 1 })}>{l}{jTri.k === k ? (jTri.s > 0 ? " ▴" : " ▾") : ""}</button></th>;
  const jExport = () => telecharger("journal-acces_" + new Date().toISOString().slice(0, 10) + ".csv", [["Date", "Personne", "Adresse", "Événement", "Détail", "Par"], ...jListe.map((l) => [date(l.le), l.qui, l.email, l.type, l.detail, l.par])]);

  // ---------- Volet ----------
  const dr = orig ? droits(orig) : { soi: false, membres: peut("membres"), tableau: peut("tableau"), admin: peut("admins"), lectures: peut("lectures") };
  const nouveau = volet?.mode === "nouveau";
  const hist = orig ? toutes.filter((l) => l.email === orig.email).sort((a, b) => (a.le < b.le ? 1 : -1)).slice(0, 15) : [];
  const seul = orig ? orig.fonctions.filter((c) => c !== "collab" && c !== "redac" && titulaires(c).length === 1 && titulaires(c)[0].email === orig.email) : [];
  const modifiable = nouveau || dr.membres || dr.admin || dr.tableau || dr.lectures;

  return (
    <div className="pg">
      <style>{CSS + EXTRA}</style>
      <main className="wrap view">
        <div className="mhead">
          <div><div className="eyebrow">Administration</div><h1 className="title">Membres</h1></div>
          <div className="tools">{moi.super ? <a className="btn sec" href="/comme" style={{ textDecoration: "none" }}>Voir comme…</a> : null}{peut("membres") || peut("admins") ? <button type="button" className="btn" onClick={ouvrirNouveau}>+ Nouveau membre</button> : null}<button type="button" className="btn sec" onClick={exporter}>Exporter les habilitations</button></div>
        </div>
        <p className="lead">Seules les personnes inscrites ici, et actives, ouvrent le référentiel avec leur compte Microsoft 365. Cliquez une ligne pour voir la fiche et la modifier{moi.super ? "" : " (dans la limite de vos prérogatives : " + (moi.prerogatives.map((p) => PL[p]).join(", ") || "aucune") + ")"}.</p>
        <div className="stats">
          <div><b>{nb.actifs}</b><span>actifs</span></div><div><b>{nb.attente}</b><span>invités</span></div><div><b>{nb.inactifs}</b><span>suspendus</span></div><div><b>{nb.admins}</b><span>administrateurs</span></div>
        </div>
        {alertes.length ? <p className="warn">Fonction sans titulaire actif : {alertes.map((c) => FL[c]).join(", ")}. Les documents qui en dépendent ne pourront pas être visés.</p> : null}
        {note && !volet ? <p role="status" className={note.t === "ok" ? "ok" : "err"}>{note.m}</p> : null}
        <section className="card">
          <div className="listhead">
            <div className="tools">
              <input type="search" className="grand" placeholder="Rechercher : nom, adresse, poste, fonction…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un membre" />
              <select className="sel" value={fFonction} onChange={(e) => setFFonction(e.target.value)} aria-label="Fonction"><option value="">Toutes les fonctions</option><option value="__admin">Administrateurs</option>{FONCTIONS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select>
              <select className="sel" value={fStatut} onChange={(e) => setFStatut(e.target.value)} aria-label="Statut"><option value="">Actifs et invités</option><option value="Actif">Actifs</option><option value="Invité">Invités</option><option value="Suspendu">Suspendus</option></select>
            </div>
            <span className="mail">{liste.length + (liste.length > 1 ? " membres" : " membre")}</span>
          </div>
          <div className="tbl">
            <table className="ml">
              <thead><tr>{th("nom", "Membre")}{th("poste", "Poste")}{th("fonctions", "Fonctions")}{th("niveau", "Niveau")}{th("statut", "Statut")}{th("cx", "Dernière connexion")}</tr></thead>
              <tbody>
                {liste.map((m) => (
                  <tr key={m.email} className={"cl" + (m.actif ? "" : " off") + (volet?.email === m.email ? " sel" : "")} tabIndex={0} onClick={() => ouvrirFiche(m)} onKeyDown={(e) => { if (e.key === "Enter") ouvrirFiche(m); }}>
                    <td><b>{m.nom || "—"}</b>{m.email === moi.email ? <span className="tag">vous</span> : null}<div className="mail">{m.email}</div></td>
                    <td>{m.poste || <span className="mail">—</span>}</td>
                    <td>{m.fonctions.map((c) => FL[c] || c).join(", ")}</td>
                    <td>{m.super ? <span className="tag navy">Super admin</span> : m.admin ? <span className="tag gold">Administrateur</span> : niveau(m)}</td>
                    <td><span className={"st " + statutDe(m)}>{statutDe(m)}</span></td>
                    <td className="cx">{m.derniere_connexion ? date(m.derniere_connexion) : <span className="wait">jamais</span>}</td>
                  </tr>
                ))}
                {!liste.length ? <tr><td colSpan={6} className="vide">Aucun membre ne correspond.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <p className="fine">Une personne qui s&apos;est déjà connectée ne se supprime pas : on la suspend, pour garder la trace de ses visas.</p>
        </section>

        <section className="card">
          <div className="listhead"><h2>Journal des accès</h2><button type="button" className="btn sec" onClick={jExport}>Exporter la sélection</button></div>
          <div className="tools" style={{ marginBottom: 10 }}>
            <input type="search" className="grand" placeholder="Rechercher : personne, fonction, « suspendu », date…" value={jq} onChange={(e) => setJq(e.target.value)} aria-label="Rechercher dans le journal" />
            <select className="sel" value={jType} onChange={(e) => setJType(e.target.value)} aria-label="Événement"><option value="">Tous les événements</option>{Object.values(TYPES).map((t) => <option key={t}>{t}</option>)}</select>
            <select className="sel" value={jPers} onChange={(e) => setJPers(e.target.value)} aria-label="Personne"><option value="">Toutes les personnes</option>{ms.map((m) => <option key={m.email} value={m.email}>{m.nom || m.email}</option>)}</select>
            <select className="sel" value={jPer} onChange={(e) => setJPer(e.target.value)} aria-label="Période"><option value="0">Depuis l&apos;origine</option><option value="1">24 heures</option><option value="7">7 jours</option><option value="30">30 jours</option><option value="90">90 jours</option></select>
            {jq || jType || jPers || jPer !== "0" ? <button type="button" className="lnk" onClick={() => { setJq(""); setJType(""); setJPers(""); setJPer("0"); }}>Effacer les filtres</button> : null}
          </div>
          <div className="tbl">
            <table className="ml jt">
              <thead><tr>{jth("le", "Date")}{jth("qui", "Personne")}{jth("type", "Événement")}<th>Détail</th>{jth("par", "Par")}</tr></thead>
              <tbody>
                {jListe.slice(0, jNb).map((l) => <tr key={l.id}><td className="cx">{date(l.le)}</td><td><b>{l.qui}</b>{l.qui !== l.email ? <div className="mail">{l.email}</div> : null}</td><td><span className={"ev ev-" + l.type.split(" ")[0]}>{l.type}</span></td><td>{l.detail}</td><td className="mail">{l.par}</td></tr>)}
                {!jListe.length ? <tr><td colSpan={5} className="vide">Aucun événement ne correspond.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <p className="fine">{jListe.length + (jListe.length > 1 ? " événements" : " événement")}{jListe.length > jNb ? <> · <button type="button" className="lnk" onClick={() => setJNb(jNb + 100)}>en afficher plus</button></> : null}</p>
        </section>
      </main>

      {volet ? <>
        <div className="sd-scrim" onClick={() => setVolet(null)} />
        <aside className="sd" role="dialog" aria-modal="true" aria-label={nouveau ? "Nouveau membre" : "Fiche du membre"}>
          <header className="sd-h">
            <div><div className="eyebrow">{nouveau ? "Nouveau membre" : "Fiche du membre"}</div><h2>{nouveau ? "Ouvrir un accès" : orig?.nom || orig?.email}</h2>{orig ? <div className="mail">{orig.email}</div> : null}{orig && moi.super ? <a className="lnk" style={{ display: "inline-block", marginTop: 6, fontSize: 12.5 }} href={"/comme/activer?cible=" + encodeURIComponent(orig.email)}>Voir le référentiel comme cette personne</a> : null}</div>
            <button type="button" className="sd-x" onClick={() => setVolet(null)} aria-label="Fermer">✕</button>
          </header>
          <div className="sd-b">
            {note ? <p role="status" className={note.t === "ok" ? "ok" : "err"}>{note.m}</p> : null}
            {orig ? <div className="fiche">
              <div><b>Statut</b><span className={"st " + statutDe(orig)}>{statutDe(orig)}</span></div>
              <div><b>Niveau</b>{niveau(orig)}</div>
              <div><b>Accès ouvert le</b>{jour(orig.cree_le)}</div>
              <div><b>Dernière connexion</b>{orig.derniere_connexion ? date(orig.derniere_connexion) : "jamais"}</div>
              <div><b>Documents à lire</b>{aLire(orig)}</div>
              <div><b>Tableau de bord</b>{orig.admin || orig.tableau ? "oui" : "non"}</div>
              {seul.length ? <div style={{ gridColumn: "1/-1" }} className="warn">Seul titulaire actif de : {seul.map((c) => FL[c]).join(", ")}. Désignez un remplaçant avant toute suspension.</div> : null}
            </div> : null}
            {orig && dr.soi && !moi.super ? <p className="warn">Votre propre accès se modifie par un autre administrateur.</p> : null}
            {orig && orig.admin && !moi.super && !dr.soi ? <p className="warn">Seul le super administrateur modifie un administrateur.</p> : null}

            <h3>Identité</h3>
            <div className="frm">
              {nouveau ? <label>Adresse Microsoft 365<input type="email" value={ed.email} placeholder={"prenom.nom@" + DOMAINE} onChange={(e) => setEd({ ...ed, email: e.target.value })} autoFocus /></label> : null}
              <label>Nom<input value={ed.nom || ""} disabled={!nouveau && !dr.membres} onChange={(e) => setEd({ ...ed, nom: e.target.value })} placeholder="Prénom Nom" /></label>
              <label>Poste<input value={ed.poste || ""} disabled={!nouveau && !dr.membres} onChange={(e) => setEd({ ...ed, poste: e.target.value })} placeholder="ex. Chargé de clientèle" /></label>
              <label>Fonctions<ChoixFonctions val={ed.fonctions} disabled={!nouveau && !dr.membres} onChange={(v) => setEd({ ...ed, fonctions: v })} /></label>
            </div>

            <h3>Accès</h3>
            <div className="frm">
              {!ed.admin ? <label>Type d&apos;accès<select className="sel" value={ed.acces} disabled={!nouveau && !dr.membres} onChange={(e) => setEd({ ...ed, acces: e.target.value as Membre["acces"], tableau: e.target.value === "employe" ? false : ed.tableau })}>
                <option value="employe">Employé — seulement les documents attribués</option><option value="complet">Complet — tout le référentiel</option></select></label> : <p className="mail">Accès complet (administrateur).</p>}
              <label className="chk"><input type="checkbox" checked={ed.admin || !!ed.tableau} disabled={ed.admin || ed.acces === "employe" || !(nouveau ? peut("tableau") : dr.tableau)} onChange={() => setEd({ ...ed, tableau: !ed.tableau })} />Tableau de bord</label>
              {orig && !dr.soi ? <label className="chk"><input type="checkbox" checked={!ed.actif} disabled={!dr.membres} onChange={() => setEd({ ...ed, actif: !ed.actif })} />Suspendre l&apos;accès (départ, absence prolongée)</label> : null}
            </div>

            {!ed.super && (nouveau ? peut("admins") : dr.admin || ed.admin) ? <>
              <h3>Administration</h3>
              <label className="chk adm"><input type="checkbox" checked={ed.admin} disabled={nouveau ? !peut("membres") : !dr.admin} onChange={() => setEd({ ...ed, admin: !ed.admin, prerogatives: [] })} />Administrateur</label>
              {ed.admin ? <><p className="mail" style={{ margin: "6px 0 0" }}>Prérogatives (vous ne pouvez donner que les vôtres) :</p><Prerogatives val={ed.prerogatives} moi={moi} disabled={!nouveau && !dr.admin} onChange={(v) => setEd({ ...ed, prerogatives: v })} /></> : null}
            </> : null}
            {ed.super ? <><h3>Administration</h3><p className="mail">Super administrateur : toutes les prérogatives.</p></> : null}

            {orig && !orig.admin && orig.acces === "employe" && ed.acces === "employe" && dr.lectures ? <>
              <h3>Documents attribués</h3>
              <p className="mail" style={{ margin: "0 0 6px" }}>« Lire et attester » : lecture à confirmer une fois le document adopté. « Consultation » : visible sans attestation. Le reste du site lui est invisible.</p>
              <table className="dtab"><thead><tr><th>Document</th><th className="c">Aucun</th><th className="c">Lire</th><th className="c">Consulter</th></tr></thead><tbody>
                {docs.map((d) => { const v = designe(orig, d.id); const tous = !!(lects[d.id] || {}).tous; return (
                  <tr key={d.id} className={edL[d.id] ? "edited" : ""}><td><b>{d.id}</b> <span className="mail">{d.titre}{tous ? " · demandé à tous" : ""}</span></td>
                    {(["", "lire", "consult"] as const).map((k) => <td key={k} className="c"><input type="radio" name={"d-" + d.id} checked={tous ? k === "lire" : v === k} disabled={tous} onChange={() => designer(orig, d.id, k)} aria-label={d.id + " " + (k || "aucun")} /></td>)}
                  </tr>); })}
              </tbody></table>
            </> : null}

            {orig ? <>
              <h3>Historique de l&apos;accès</h3>
              <ul className="journal">{hist.map((l) => <li key={l.id}><time>{date(l.le)}</time><span><b>{l.type}</b>{l.detail ? <> — <span>{l.detail}</span></> : null}{l.par ? " · " + l.par : ""}</span></li>)}{!hist.length ? <li className="vide">Aucun événement.</li> : null}</ul>
            </> : null}
          </div>
          <footer className="sd-f">
            {nouveau ? <button type="button" className="btn" disabled={occupe} onClick={creer}>Ouvrir l&apos;accès…</button> : modifiable ? <button type="button" className="btn" disabled={occupe} onClick={enregistrerFiche}>Enregistrer…</button> : null}
            <button type="button" className="btn sec" onClick={() => setVolet(null)}>{modifiable ? "Annuler" : "Fermer"}</button>
            {orig && !orig.user_id && !dr.soi && !orig.admin && peut("membres") ? <button type="button" className="lnk rouge" style={{ marginLeft: "auto" }} onClick={() => retirer(orig)}>Retirer l&apos;invitation</button> : null}
          </footer>
        </aside>
      </> : null}
      {cfm ? <Confirmation c={cfm} fermer={() => setCfm(null)} /> : null}
    </div>
  );
}

const EXTRA = `
.cfm-scrim{z-index:60!important}
.mhead{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap}.mhead .btn{grid-column:auto}
.tools .btn{grid-column:auto}
input.grand{min-width:280px;flex:1}
table.ml{min-width:820px}table.ml td{padding:9px 8px;vertical-align:middle}
table.ml tr.cl{cursor:pointer}table.ml tr.cl:hover td{background:#F5F8FC}table.ml tr.sel td{background:#EEF3F9}
table.ml .tag{margin-left:6px}
.thb{background:none;border:0;padding:0;font:inherit;color:inherit;text-transform:inherit;letter-spacing:inherit;cursor:pointer}
.jt td{font-size:12.5px;vertical-align:top}
.ev{font-size:11px;font-weight:600;padding:1px 6px;border-radius:2px;background:#EEF1F5;color:var(--muted);white-space:nowrap}
.ev-Accès{background:#E5F3EA;color:#1D5B34}.ev-Modification{background:#E8EEF5;color:var(--navy)}.ev-Invitation{background:#FBE6E4;color:#8A2219}
.sd-scrim{position:fixed;inset:0;background:rgba(6,27,51,.32);z-index:40;animation:sdf .15s ease}
.sd{position:fixed;top:0;right:0;bottom:0;width:min(560px,100vw);background:#fff;z-index:41;display:flex;flex-direction:column;box-shadow:-12px 0 36px rgba(6,27,51,.22);animation:sdi .2s ease}
@keyframes sdi{from{transform:translateX(100%)}to{transform:none}}@keyframes sdf{from{opacity:0}to{opacity:1}}
.sd-h{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:18px 22px 14px;border-bottom:1px solid var(--line)}
.sd-h h2{margin:2px 0 0;font-size:19px}
.sd-x{background:none;border:0;font-size:16px;cursor:pointer;color:var(--muted);padding:4px 6px}
.sd-b{flex:1;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:14px 22px 22px}
/* Un seul défilement dans le volet : ni la liste ni le tableau n'ont leur propre barre */
.sd-b .journal{max-height:none;overflow:visible}.sd-b table{min-width:0}.sd-b .tbl{overflow:visible}
body:has(.sd){overflow:hidden}
.sd-b h3{margin:18px 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.sd-f{display:flex;gap:8px;align-items:center;padding:12px 22px;border-top:1px solid var(--line);background:#FAFBFD}.sd-f .btn{grid-column:auto}
.frm{display:flex;flex-direction:column;gap:10px}
.frm>label:not(.chk){display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:12.5px}
.frm input:not([type=checkbox]),.frm select{border:1px solid var(--line);border-radius:2px;padding:7px 9px;font:inherit;font-weight:400;background:#fff;color:inherit}
.frm input:disabled,.frm select:disabled{background:#F5F7FA;color:var(--muted)}
.fiche{grid-template-columns:repeat(3,minmax(0,1fr))}.fiche .warn{margin:0}
.msel{position:relative;font-weight:400}
.msel-btn{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;border:1px solid var(--line);border-radius:2px;padding:7px 9px;font:inherit;background:#fff;color:inherit;cursor:pointer;text-align:left}
.msel-btn:disabled{background:#F5F7FA;color:var(--muted);cursor:not-allowed}.msel-btn span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.msel-pop{position:absolute;z-index:5;left:0;right:0;top:calc(100% + 2px);background:#fff;border:1px solid var(--line);box-shadow:0 8px 24px rgba(6,27,51,.14);padding:6px 10px;display:flex;flex-direction:column;gap:4px}
.msel-pop .chk{padding:3px 0}
.dtab tr.edited td{background:#FBF1DC}
@media (max-width:720px){input.grand{min-width:0;width:100%}.fiche{grid-template-columns:1fr 1fr}}
`;
