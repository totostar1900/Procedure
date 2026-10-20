import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------------------------------------------
// Avis par e-mail du référentiel, envoyés par Microsoft 365 depuis la boîte partagée (interface Graph, sans coût).
// Le calcul part de l'état réel (visas, lectures, circuits, journal) : chaque avis porte une clé unique enregistrée
// dans notif_items, de sorte qu'il n'est jamais envoyé deux fois, même si plusieurs exécutions se croisent.
// Appelé par la base toutes les 15 minutes (jours ouvrés, 7 h – 19 h, heure de Yaoundé) et par la page après
// chaque visa, lecture ou modification d'accès. Un avis = un e-mail par personne, regroupant ce qui la concerne.
// L'e-mail informe ; la preuve reste le visa ou l'attestation sur le site. Aucun contenu de document n'y figure.
// ---------------------------------------------------------------------------------------------------------------

import { BOITE, CATEGORIES, FONCTIONS_N, SITE, lireReglages } from "./notifier-commun";
export { BOITE, CATEGORIES, FONCTIONS_N, SITE, lireReglages };

export const configure = () => !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.M365_TENANT_ID && process.env.M365_CLIENT_ID && process.env.M365_CLIENT_SECRET);
export const service = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

// ---------- Données du référentiel (page générée) ----------
type Etape = { etape: string; label: string; role: string; regle?: string; obligatoire?: boolean; seance?: boolean; delai?: number };
type Doc = { id: string; titre: string; type: string; domaine?: string; version: string; statut: string; empreinte: string; lectureOK?: string[]; date_effet?: string; date_approbation?: string; prochaine_revue?: string; historique?: { date: string }[]; circuit: Etape[]; en?: { titre?: string }; projet?: Doc; estProjet?: boolean };
let cacheSite: { docs: Doc[]; D: Record<string, string> } | null = null;
function site() {
  if (cacheSite) return cacheSite;
  const html = fs.readFileSync(path.join(process.cwd(), "site", "index.html"), "utf8");
  const x = html.match(/<script type="application\/json" id="ref-data">([\s\S]*?)<\/script>/);
  const docs: Doc[] = x ? JSON.parse(x[1]).docs : [];
  let D: Record<string, string> = {};
  const a = html.indexOf('var D = {"'); const b = a >= 0 ? html.indexOf("};\n", a) : -1;
  if (a >= 0 && b > a) { try { D = JSON.parse(html.slice(a + 8, b + 1)); } catch { D = {}; } }
  cacheSite = { docs, D };
  return cacheSite;
}

// ---------- Textes FR / EN ----------
type L = "fr" | "en";
const T: Record<string, [string, string]> = {
  marque: ["Référentiel documentaire — Purpose Capital S.A.", "Document repository — Purpose Capital S.A."],
  ouvrir: ["Ouvrir le référentiel", "Open the repository"],
  pied: ["Message automatique du référentiel. Il vous informe ; la preuve de vos visas et lectures reste sur le site. Une question : répondez à ce message.", "Automatic message from the repository. It is for information; the record of your sign-offs and readings remains on the site. Any question: reply to this message."],
  visa: ["Documents qui attendent votre visa", "Documents awaiting your sign-off"],
  lecture: ["Documents à lire et attester", "Documents to read and acknowledge"],
  renvoi: ["Documents renvoyés pour modification", "Documents returned for changes"],
  abrogation: ["Documents abrogés", "Repealed documents"],
  redaction: ["Modifications de documents", "Document changes"],
  acces: ["Accès au référentiel", "Access to the repository"],
  droits: ["Fonctions et prérogatives", "Functions and powers"],
  suspension: ["Suspensions et réactivations", "Suspensions and reactivations"],
  rappel: ["Rappel : ce qui vous attend", "Reminder: what is awaiting you"],
  escalade: ["Retards persistants", "Persistent delays"],
  nouveautes: ["Nouveautés de la semaine", "This week's new documents"],
  revue: ["Revues périodiques à prévoir", "Periodic reviews to plan"],
  resume: ["Résumé du référentiel", "Repository summary"],
};
const tx = (k: string, l: L) => (T[k] ? T[k][l === "en" ? 1 : 0] : k);
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const enDate = (iso: string, l: L) => { if (!iso) return ""; const d = new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso); return d.toLocaleDateString(l === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Douala" }); };

type Ligne = { ref: string; titre: string; detail: string; lien?: string; alerte?: boolean };
type Section = { h: string; lignes: Ligne[]; texte?: string };
function courriel(l: L, titre: string, intro: string, sections: Section[], bandeau?: string) {
  const s = sections.filter((x) => x.lignes.length || x.texte).map((x) =>
    `<h2 style="font:600 14px Arial,sans-serif;color:#0B2E52;margin:22px 0 8px;border-bottom:1px solid #DCE4EE;padding-bottom:4px">${esc(x.h)}</h2>` +
    (x.texte ? `<p style="margin:0 0 8px">${x.texte}</p>` : "") +
    x.lignes.map((r) => `<table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 8px"><tr><td style="padding:8px 10px;background:${r.alerte ? "#F8E6E3" : "#F4F7FB"};border-left:3px solid ${r.alerte ? "#9B2C1F" : "#E8A020"}">` +
      `<div style="font:11px Arial,sans-serif;color:#5B6B80">${esc(r.ref)}</div>` +
      `<div style="font:600 14px Arial,sans-serif;color:#0B2E52">${r.lien ? `<a href="${esc(r.lien)}" style="color:#0B2E52;text-decoration:none">${esc(r.titre)}</a>` : esc(r.titre)}</div>` +
      `<div style="font:12.5px Arial,sans-serif;color:${r.alerte ? "#9B2C1F" : "#3E5068"}">${esc(r.detail)}</div></td></tr></table>`).join("")).join("");
  return `<!doctype html><html lang="${l}"><body style="margin:0;background:#EEF3F9;padding:18px 0">` +
    `<table role="presentation" width="100%" style="border-collapse:collapse"><tr><td align="center"><table role="presentation" width="600" style="max-width:600px;width:100%;background:#fff;border-collapse:collapse">` +
    `<tr><td style="background:#0B2E52;padding:16px 22px;color:#fff;font:600 13px Arial,sans-serif;letter-spacing:.04em">${esc(tx("marque", l))}<div style="height:2px;background:#E8A020;width:48px;margin-top:8px"></div></td></tr>` +
    (bandeau ? `<tr><td style="background:#FBF1DC;color:#6B4A0E;padding:10px 22px;font:12.5px Arial,sans-serif">${bandeau}</td></tr>` : "") +
    `<tr><td style="padding:20px 22px;font:14px/1.5 Arial,sans-serif;color:#0A2540"><h1 style="font:600 19px Georgia,serif;color:#0B2E52;margin:0 0 8px">${esc(titre)}</h1><p style="margin:0">${intro}</p>${s}` +
    `<p style="margin:24px 0 6px"><a href="${SITE}" style="background:#0B2E52;color:#fff;text-decoration:none;padding:10px 16px;font:600 13px Arial,sans-serif;display:inline-block">${esc(tx("ouvrir", l))}</a></p></td></tr>` +
    `<tr><td style="padding:14px 22px;border-top:1px solid #DCE4EE;font:11.5px Arial,sans-serif;color:#5B6B80">${esc(tx("pied", l))}</td></tr></table></td></tr></table></body></html>`;
}

// ---------- Microsoft Graph ----------
let jeton: { v: string; exp: number } | null = null;
async function token() {
  if (jeton && jeton.exp > Date.now() + 60000) return jeton.v;
  const r = await fetch(`https://login.microsoftonline.com/${process.env.M365_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.M365_CLIENT_ID!, client_secret: process.env.M365_CLIENT_SECRET!, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error("Microsoft 365 : " + (j.error_description || j.error || r.status));
  jeton = { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return jeton.v;
}
export async function envoyerGraph(de: string, a: string[], sujet: string, html: string) {
  const r = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(de)}/sendMail`, {
    method: "POST", headers: { Authorization: "Bearer " + (await token()), "Content-Type": "application/json" },
    body: JSON.stringify({ message: { subject: sujet, body: { contentType: "HTML", content: html }, toRecipients: a.map((x) => ({ emailAddress: { address: x } })) }, saveToSentItems: true }),
  });
  if (r.status !== 202) { let m = String(r.status); try { const j = await r.json(); m = (j.error && (j.error.code + " : " + j.error.message)) || m; } catch { /* corps vide */ } throw new Error(m); }
}

// ---------- Heure de Yaoundé ----------
const locale = () => { const d = new Date(Date.now() + 3600e3); return { h: d.getUTCHours(), j: d.getUTCDay(), date: d.toISOString().slice(0, 10), jourMois: d.getUTCDate() }; };
const semaine = (dateIso: string) => { const d = new Date(dateIso + "T00:00:00Z"); const j = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - j + 3); const a = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return d.getUTCFullYear() + "-S" + String(1 + Math.round(((d.getTime() - a.getTime()) / 864e5 - 3 + ((a.getUTCDay() + 6) % 7)) / 7)).padStart(2, "0"); };
const JOUR = 864e5;
const jours = (iso?: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso).getTime()) / JOUR)) : 0);

// ---------- Exécution ----------
type Membre = { email: string; user_id: string | null; nom: string | null; fonctions: string[]; actif: boolean; acces: string; admin: boolean; super: boolean; prerogatives: string[] | null; tableau: boolean | null };
type Sig = { by: string; doc: string; etape: string; role: string; empreinte: string; version?: string; at: string; seance?: string };
type Avis = { cle: string; cat: string; a: string; quand: string | null; ligne: Ligne; sujet1?: string; texte?: string };

export async function executer(opts: { force?: boolean } = {}) {
  if (!configure()) return { ok: false, raison: "configuration Microsoft 365 absente" };
  const sb = service();
  const { data: rk } = await sb.from("kv").select("data").eq("path", "notifications/reglages").maybeSingle();
  const R = lireReglages(rk && rk.data);
  if (!R.actif && !opts.force) return { ok: true, raison: "envois désactivés" };
  const loc = locale();
  if (!opts.force && (loc.j === 0 || loc.j === 6 || loc.h < 7 || loc.h >= 19)) return { ok: true, raison: "hors des heures d'envoi" };
  // Une exécution à la fois (20 s minimum entre deux)
  const { data: verrou } = await sb.from("notif_etat").update({ derniere: new Date().toISOString() }).eq("id", 1).lt("derniere", new Date(Date.now() - 20000).toISOString()).select("curseur_journal");
  if (!verrou || !verrou.length) return { ok: true, raison: "exécution récente" };
  const curseur = verrou[0].curseur_journal as number | null;

  // Données
  const [mr, kr, jr] = await Promise.all([
    sb.from("membres").select("email,user_id,nom,fonctions,actif,acces,admin,super,prerogatives,tableau"),
    sb.from("kv").select("path,data").or("path.like.sig/%,path.like.lectures/%,path.like.circuits/%,path.like.figes/%,path.like.etats/%,path.like.auteurs/%,path.like.redaction/%,path.like.annuaire/%"),
    curseur == null ? sb.from("journal").select("id").order("id", { ascending: false }).limit(1) : sb.from("journal").select("id,le,action,path,data").gt("id", curseur).like("action", "MEMBRE_%").order("id").limit(500),
  ]);
  if (mr.error || kr.error || jr.error) throw new Error((mr.error || kr.error || jr.error)!.message);
  const ms = (mr.data || []) as Membre[];
  const kv: Record<string, Record<string, unknown>> = {}; (kr.data || []).forEach((r: { path: string; data: Record<string, unknown> }) => { kv[r.path] = r.data; });
  const { docs, D } = site();
  const tr = (s: string, l: L) => (l === "en" && D[s]) || s;
  const idDe = (m: Membre) => m.user_id || "email:" + m.email;
  const parId: Record<string, Membre> = {}; ms.forEach((m) => { parId[idDe(m)] = m; parId["email:" + m.email] = m; if (m.user_id) parId[m.user_id] = m; });
  const mb = (id: string) => parId[id];
  const langue = (m?: Membre): L => { const a = m && m.user_id ? kv["annuaire/" + m.user_id] : null; return a && a.langue === "en" ? "en" : "fr"; };
  const nom = (id: string) => { const m = mb(id); return m ? m.nom || m.email : id.replace(/^email:/, ""); };
  const hasRole = (id: string, role: string) => { const m = mb(id); return !!(m && m.actif && (m.fonctions || []).includes(role)); };
  const holders = (role: string) => ms.filter((m) => m.actif && (m.fonctions || []).includes(role)).map(idDe);
  const sigs: Sig[] = Object.keys(kv).filter((p) => p.startsWith("sig/")).map((p) => ({ ...(kv[p] as unknown as Sig), by: p.split("/")[1] }));
  const sigsOf = (doc: string, etape?: string) => sigs.filter((s) => s.doc === doc && (!etape || s.etape === etape)).sort((a, b) => (a.at < b.at ? 1 : -1));
  const typeKey = (t: string) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const norm = (s: Etape): Required<Etape> => ({ etape: s.etape, label: s.label, role: s.role, regle: s.regle || "un", obligatoire: s.obligatoire !== false, seance: !!s.seance, delai: Number(s.delai) > 0 ? Number(s.delai) : 7 });
  const circOf = (d: Doc) => {
    const f = kv["figes/" + d.id + "~" + d.empreinte] as { etapes?: Etape[] } | undefined; if (f && f.etapes && f.etapes.length) return f.etapes.map(norm);
    const c = kv["circuits/" + typeKey(d.type)] as { etapes?: Etape[] } | undefined; if (c && c.etapes && c.etapes.length) return c.etapes.map(norm);
    return (d.circuit || []).map(norm);
  };
  const delaiLecture = (t: string) => { const c = kv["circuits/" + typeKey(t)] as { delaiLecture?: number } | undefined; return c && Number(c.delaiLecture) > 0 ? Number(c.delaiLecture) : 15; };
  const suivi = kv["circuits/_suivi"] as { seuil?: number } | undefined; const seuil = (suivi && Number(suivi.seuil) > 0 ? Number(suivi.seuil) : 75) / 100;
  const lecturesDe = (id: string) => { const L = kv["lectures/" + id] as { tous?: boolean; ids?: string[]; consult?: string[] } | undefined; return L || null; };
  const readersOf = (d: Doc) => {
    const L = lecturesDe(d.id); if (!L) return [] as string[];
    const ids = (L.ids || []).map((x) => (mb(x) ? idDe(mb(x)) : x));
    if (L.tous) ms.forEach((m) => { if (m.actif && !ids.includes(idDe(m))) ids.push(idDe(m)); });
    return ids.filter((x, i, a) => a.indexOf(x) === i);
  };
  const auteursDe = (d: Doc) => { const a = kv["auteurs/" + d.id + "~" + d.empreinte] as { auteurs?: string[] } | undefined; return (a && a.auteurs) || []; };
  const signedOther = (d: Doc, etape: string, who: string) => sigs.some((s) => s.doc === d.id && s.by === who && s.empreinte === d.empreinte && s.etape !== etape && s.etape !== "lecture" && s.etape !== "renvoi");
  const etat = (d: Doc) => {
    const steps = circOf(d).map((st) => {
      const all = sigsOf(d.id, st.etape).filter((s) => hasRole(s.by, st.role)), cur = all.filter((s) => s.empreinte === d.empreinte);
      const by = cur.map((s) => s.by).filter((x, i, a) => a.indexOf(x) === i), h = holders(st.role);
      const need = st.regle === "tous" ? Math.max(1, h.length) : st.regle === "majorite" ? Math.floor(h.length / 2) + 1 : 1;
      return { st, sigs: cur, by, holders: h, done: by.length >= need };
    });
    const renvois = sigsOf(d.id, "renvoi").filter((s) => s.empreinte === d.empreinte);
    const approved = !renvois.length && steps.some((x) => x.st.obligatoire) && steps.every((x) => x.done || !x.st.obligatoire);
    const current = !approved && !renvois.length ? steps.find((x) => !x.done && x.st.obligatoire) || null : null;
    const readers = readersOf(d), ok = d.lectureOK || [d.empreinte];
    const lus = sigsOf(d.id, "lecture"); const read = readers.filter((id) => lus.some((s) => s.by === id && ok.includes(s.empreinte)));
    let debut: string | null = null;
    if (current) { const i = steps.indexOf(current); steps.slice(0, i).forEach((s) => { if (s.done) s.sigs.forEach((g) => { if (!debut || g.at > debut) debut = g.at; }); }); debut = debut || (d.historique && d.historique[0] && d.historique[0].date) || null; }
    let approbation: string | null = null; steps.forEach((s) => { if (s.st.obligatoire) s.sigs.forEach((g) => { if (!approbation || g.at > approbation) approbation = g.at; }); });
    approbation = approbation || d.date_approbation || null;
    return { steps, renvois, approved, current, readers, read, debut, approbation };
  };
  const etats = (id: string) => kv["etats/" + id] as { statut?: string; date?: string; motif?: string } | undefined;
  const variantes = docs.flatMap((d) => (d.projet ? [d, { ...d.projet, estProjet: true }] : [d])).filter((d) => !etats(d.id));
  const lien = (d: Doc) => SITE + "/#" + d.id + (d.estProjet ? "~projet" : "");
  const titreDe = (d: Doc, l: L) => (l === "en" && d.en && d.en.titre) || d.titre;
  const refDe = (d: Doc, l: L) => d.id + " · " + tr(d.type, l) + " v" + d.version + (d.estProjet ? (l === "en" ? " · revision" : " · révision") : "");
  const fn = (r: string, l: L) => tr((FONCTIONS_N.find((f) => f[0] === r) || ["", r])[1], l);
  const boite = { email: R.boite, user_id: null, nom: "Boîte partagée", fonctions: [], actif: true, acces: "complet", admin: false, super: false, prerogatives: [], tableau: false } as Membre;
  const autorise = (m: Membre | undefined) => !!m && m.actif && (m.email === R.boite || (m.fonctions.length ? m.fonctions : ["collab"]).some((f) => R.fonctions[f] !== false));
  const avis: Avis[] = [];
  const pousser = (cat: string, cle: string, m: Membre | undefined, quand: string | null, ligne: (l: L) => Ligne) => {
    if (!R.types[cat] || !autorise(m)) return;
    avis.push({ cle: cat + "|" + cle + "|" + m!.email, cat, a: m!.email, quand, ligne: ligne(m!.email === R.boite ? "fr" : langue(m)) });
  };

  // 1. Visas attendus, lectures demandées, renvois
  const enCours: { d: Doc; m: Membre; cat: "visa" | "lecture"; age: number; delai: number; etape: string; cle: string }[] = [];
  for (const d of variantes) {
    const e = etat(d);
    if (e.current) {
      const x = e.current;
      const qui = x.holders.filter((h) => !x.by.includes(h) && !auteursDe(d).includes(h) && !signedOther(d, x.st.etape, h));
      for (const h of qui) {
        const m = mb(h); if (!m) continue;
        pousser("visa", d.id + "|" + d.empreinte + "|" + x.st.etape, m, e.debut, (l) => ({ ref: refDe(d, l), titre: titreDe(d, l), detail: (l === "en" ? "Step: " : "Étape : ") + tr(x.st.label, l) + " · " + (l === "en" ? "deadline " + x.st.delai + " days" : "délai " + x.st.delai + " jours"), lien: lien(d) }));
        enCours.push({ d, m, cat: "visa", age: jours(e.debut), delai: x.st.delai, etape: x.st.label, cle: d.id + "|" + d.empreinte + "|" + x.st.etape });
      }
    }
    if (e.approved && !d.estProjet) {
      const dl = delaiLecture(d.type);
      for (const id of e.readers.filter((r) => !e.read.includes(r))) {
        const m = mb(id); if (!m) continue;
        pousser("lecture", d.id + "|" + d.empreinte, m, e.approbation, (l) => ({ ref: refDe(d, l), titre: titreDe(d, l), detail: l === "en" ? "Read it and acknowledge your reading within " + dl + " days." : "À lire et attester sous " + dl + " jours.", lien: lien(d) }));
        enCours.push({ d, m, cat: "lecture", age: jours(e.approbation), delai: dl, etape: "Lecture", cle: d.id + "|" + d.empreinte });
      }
    }
    for (const s of e.renvois) {
      const dest = [...auteursDe(d).map(mb), ...holders("rcci").filter((h) => h !== s.by).map(mb)].filter((m, i, a) => m && a.indexOf(m) === i) as Membre[];
      for (const m of dest) pousser("renvoi", d.id + "|" + d.empreinte + "|" + s.at, m, s.at, (l) => ({ ref: refDe(d, l), titre: titreDe(d, l), detail: l === "en" ? "Returned by " + nom(s.by) + " on " + enDate(s.at, l) + ". See the reason on the site." : "Renvoyé par " + nom(s.by) + " le " + enDate(s.at, l) + ". Le motif est sur le site.", lien: lien(d), alerte: true }));
    }
  }
  // 2. Abrogations
  for (const d of docs) {
    const s = etats(d.id); if (!s || s.statut !== "abroge") continue;
    const dest = [...readersOf(d).map(mb), boite].filter((m, i, a) => m && a.indexOf(m) === i) as Membre[];
    for (const m of dest) pousser("abrogation", d.id + "|" + (s.date || ""), m, s.date || null, (l) => ({ ref: refDe(d, l), titre: titreDe(d, l), detail: l === "en" ? "No longer in force since " + enDate(s.date || "", l) + "." : "N'est plus en vigueur depuis le " + enDate(s.date || "", l) + "." }));
  }
  // 3. Modifications soumises, publiées, refusées
  for (const p of Object.keys(kv).filter((x) => x.startsWith("redaction/"))) {
    const r = kv[p] as { statut?: string; maj?: string; auteurs?: string[]; par?: string; objet?: string; version?: string; titre?: string; message?: string; nouveau?: boolean };
    if (!r.statut || !["soumis", "applique", "conflit"].includes(r.statut)) continue;
    const id = p.slice(10), d = docs.find((x) => x.id === id);
    const dest = [...(r.auteurs || [r.par || ""]).map(mb), boite].filter((m, i, a) => m && a.indexOf(m) === i) as Membre[];
    for (const m of dest) pousser("redaction", id + "|" + r.statut + "|" + (r.maj || ""), m, r.maj || null, (l) => ({
      ref: id, titre: d ? titreDe(d, l) : r.titre || id, alerte: r.statut === "conflit",
      detail: r.statut === "soumis" ? (l === "en" ? "Change submitted; publication in progress." : "Modification soumise ; publication en cours.") + (r.objet ? " « " + r.objet + " »" : "")
        : r.statut === "applique" ? (l === "en" ? "Published as version " : "Publiée en version ") + (r.version || "") + (l === "en" ? "; it now goes through its approval workflow." : " ; elle repart dans son circuit d'approbation.")
        : (l === "en" ? "Publication refused: " : "Publication refusée : ") + (r.message || ""),
      lien: SITE + "/#" + id,
    }));
  }
  // 4. Accès, droits, suspensions (journal des membres)
  let nouveauCurseur = curseur;
  if (curseur == null) nouveauCurseur = ((jr.data || [])[0] as { id: number } | undefined)?.id || 0;
  else for (const j of (jr.data || []) as { id: number; le: string; action: string; path: string; data: Membre & { avant?: Partial<Membre> } }[]) {
    nouveauCurseur = j.id;
    const n = j.data, m = ms.find((x) => x.email === j.path) || n, a = n.avant;
    const qui = (n.nom || n.email) + " (" + n.email + ")";
    const fl = (xs: string[] | null | undefined, l: L) => (xs || []).map((f) => fn(f, l)).join(", ") || "—";
    if (j.action === "MEMBRE_INSERT" && n.actif) {
      pousser("acces", String(j.id), m, j.le, (l) => ({ ref: l === "en" ? "Your access" : "Votre accès", titre: l === "en" ? "Your access to the repository is open" : "Votre accès au référentiel est ouvert", detail: (l === "en" ? "Sign in at " + SITE + " with your Microsoft 365 account (" + n.email + "). Functions: " : "Connectez-vous sur " + SITE + " avec votre compte Microsoft 365 (" + n.email + "). Fonctions : ") + fl(n.fonctions, l) + ".", lien: SITE }));
      pousser("acces", String(j.id), boite, j.le, () => ({ ref: "Accès ouvert", titre: qui, detail: "Fonctions : " + fl(n.fonctions, "fr") + (n.admin ? " · administrateur" : "") + (n.acces === "employe" ? " · accès employé" : "") }));
    } else if (j.action === "MEMBRE_UPDATE" && a) {
      if (a.actif !== n.actif) {
        if (!n.actif) pousser("suspension", String(j.id), boite, j.le, () => ({ ref: "Suspension", titre: qui, detail: "Accès suspendu ; ses visas restent au registre.", alerte: true }));
        else { pousser("suspension", String(j.id), boite, j.le, () => ({ ref: "Réactivation", titre: qui, detail: "Accès rétabli." })); pousser("suspension", String(j.id), m, j.le, (l) => ({ ref: l === "en" ? "Your access" : "Votre accès", titre: l === "en" ? "Your access to the repository has been restored" : "Votre accès au référentiel est rétabli", detail: l === "en" ? "Sign in with your Microsoft 365 account." : "Connectez-vous avec votre compte Microsoft 365.", lien: SITE })); }
      }
      const ch = (l: L) => {
        const out: string[] = [];
        const pf = a.fonctions || [], nf = n.fonctions || [];
        const plus = nf.filter((x) => !pf.includes(x)), moins = pf.filter((x) => !nf.includes(x));
        if (plus.length) out.push((l === "en" ? "functions added: " : "fonctions ajoutées : ") + fl(plus, l));
        if (moins.length) out.push((l === "en" ? "functions removed: " : "fonctions retirées : ") + fl(moins, l));
        if (!!a.admin !== !!n.admin) out.push(n.admin ? (l === "en" ? "appointed administrator" : "nommé(e) administrateur") : (l === "en" ? "no longer administrator" : "n'est plus administrateur"));
        if (!!a.super !== !!n.super) out.push(n.super ? (l === "en" ? "super administrator" : "super administrateur") : (l === "en" ? "no longer super administrator" : "n'est plus super administrateur"));
        const pp = a.prerogatives || [], np = n.prerogatives || [];
        if (pp.join() !== np.join()) out.push((l === "en" ? "powers: " : "prérogatives : ") + (np.join(", ") || "—"));
        if (a.acces !== n.acces) out.push(n.acces === "employe" ? (l === "en" ? "employee access (assigned documents only)" : "accès employé (documents attribués)") : (l === "en" ? "full access" : "accès complet"));
        if (!!a.tableau !== !!n.tableau) out.push(n.tableau ? (l === "en" ? "dashboard opened" : "tableau de bord ouvert") : (l === "en" ? "dashboard closed" : "tableau de bord retiré"));
        return out;
      };
      if (n.actif && ch("fr").length) {
        pousser("droits", String(j.id), m, j.le, (l) => ({ ref: l === "en" ? "Your access" : "Votre accès", titre: l === "en" ? "Your functions or powers have changed" : "Vos fonctions ou prérogatives ont changé", detail: ch(l).join(" · "), lien: SITE }));
        pousser("droits", String(j.id), boite, j.le, () => ({ ref: "Droits modifiés", titre: qui, detail: ch("fr").join(" · ") }));
      }
    }
  }

  // 5. Avis périodiques (une fois par jour ouvré)
  const periodiques: { cle: string; cat: string; m: Membre; l: L; titre: string; intro: string; sections: Section[]; sujet: string; paliers?: string[] }[] = [];
  // 5a. Rappels : nouveau palier franchi (seuil, échéance, puis tous les 3 jours de retard) => un e-mail listant tout ce qui attend la personne
  const palier = (x: { cat: string; age: number; delai: number }) => {
    const s = x.cat === "lecture" ? 0.5 : seuil;
    if (x.age > x.delai) return "r" + Math.floor((x.age - x.delai) / 3);
    if (x.age >= x.delai) return "e"; if (x.age >= Math.ceil(x.delai * s)) return "s"; return "";
  };
  if (R.types.rappel) {
    const parPers: Record<string, typeof enCours> = {};
    enCours.forEach((x) => { if (autorise(x.m)) (parPers[x.m.email] = parPers[x.m.email] || []).push(x); });
    const candidats = Object.values(parPers).flat().filter((x) => palier(x)).map((x) => "palier|" + x.cat + "|" + x.cle + "|" + x.m.email + "|" + palier(x));
    const deja = new Set<string>();
    for (let i = 0; i < candidats.length; i += 200) { const { data } = await sb.from("notif_items").select("cle").in("cle", candidats.slice(i, i + 200)); (data || []).forEach((r: { cle: string }) => deja.add(r.cle)); }
    for (const [email, xs] of Object.entries(parPers)) {
      const nouveaux = xs.filter((x) => palier(x) && !deja.has("palier|" + x.cat + "|" + x.cle + "|" + email + "|" + palier(x)));
      if (!nouveaux.length) continue;
      const m = xs[0].m, l = langue(m);
      const ligne = (x: typeof xs[0]): Ligne => ({ ref: refDe(x.d, l), titre: titreDe(x.d, l), lien: lien(x.d), alerte: x.age > x.delai,
        detail: (x.cat === "visa" ? tr(x.etape, l) : l === "en" ? "Reading" : "Lecture") + " · " + (l === "en" ? "day " + x.age + " of " + x.delai : "J" + x.age + " sur " + x.delai) + (x.age > x.delai ? (l === "en" ? " · overdue by " + (x.age - x.delai) + " d" : " · en retard de " + (x.age - x.delai) + " j") : "") });
      periodiques.push({ cle: "rappel|" + email + "|" + loc.date, cat: "rappel", m, l, sujet: l === "en" ? "Repository: " + xs.length + " item(s) awaiting you" : "Référentiel : " + xs.length + " action(s) vous attendent",
        titre: tx("rappel", l), intro: l === "en" ? "Here is everything awaiting your action. Items in red are past their deadline." : "Voici tout ce qui attend votre action. En rouge, ce qui a dépassé son délai.",
        sections: [{ h: tx("visa", l), lignes: xs.filter((x) => x.cat === "visa").sort((a, b) => b.age - b.delai - (a.age - a.delai)).map(ligne) }, { h: tx("lecture", l), lignes: xs.filter((x) => x.cat === "lecture").map(ligne) }],
        paliers: nouveaux.map((x) => "palier|" + x.cat + "|" + x.cle + "|" + email + "|" + palier(x)) });
    }
  }
  // 5b. Escalade : retard >= N jours, puis chaque semaine
  if (R.types.escalade) {
    const N = Math.max(1, R.escalade_jours || 3);
    const vus = new Set<string>(); const retards = enCours.filter((x) => x.age - x.delai >= N && !vus.has(x.cat + x.cle + x.m.email) && vus.add(x.cat + x.cle + x.m.email));
    const groupes: Record<string, { d: Doc; cat: string; etape: string; age: number; delai: number; qui: string[] }> = {};
    retards.forEach((x) => { const k = x.cat + "|" + x.cle; (groupes[k] = groupes[k] || { d: x.d, cat: x.cat, etape: x.etape, age: x.age, delai: x.delai, qui: [] }).qui.push(x.m.nom || x.m.email); });
    const ks = Object.keys(groupes).map((k) => "palier|escalade|" + k + "|" + Math.floor((groupes[k].age - groupes[k].delai - N) / 7));
    const deja = new Set<string>(); if (ks.length) { const { data } = await sb.from("notif_items").select("cle").in("cle", ks); (data || []).forEach((r: { cle: string }) => deja.add(r.cle)); }
    if (ks.some((k) => !deja.has(k))) {
      const dest = [...R.escalade_vers.flatMap((r) => holders(r)).map(mb), boite].filter((m, i, a) => m && a.indexOf(m) === i) as Membre[];
      for (const m of dest) {
        if (!autorise(m)) continue;
        const l = m.email === R.boite ? "fr" : langue(m);
        periodiques.push({ cle: "escalade|" + m.email + "|" + loc.date, cat: "escalade", m, l, paliers: ks.filter((k) => !deja.has(k)),
          sujet: l === "en" ? "Repository: " + ks.length + " persistent delay(s)" : "Référentiel : " + ks.length + " retard(s) persistant(s)", titre: tx("escalade", l),
          intro: l === "en" ? "These steps are more than " + N + " days past their deadline." : "Ces étapes ont dépassé leur délai de plus de " + N + " jours.",
          sections: [{ h: tx("escalade", l), lignes: Object.values(groupes).sort((a, b) => b.age - b.delai - (a.age - a.delai)).map((g) => ({ ref: refDe(g.d, l), titre: titreDe(g.d, l), lien: lien(g.d), alerte: true,
            detail: (g.cat === "visa" ? tr(g.etape, l) : l === "en" ? "Reading" : "Lecture") + " · " + (l === "en" ? "overdue by " + (g.age - g.delai) + " d · waiting for: " : "en retard de " + (g.age - g.delai) + " j · attendu de : ") + g.qui.join(", ") })) }] });
      }
    }
  }
  // 5c. Nouveautés (lundi) : documents entrés en vigueur cette semaine, pour les personnes concernées qui ne doivent pas les lire
  if (R.types.nouveautes && loc.j === 1) {
    const recents = docs.filter((d) => d.statut === "En vigueur" && !etats(d.id) && jours(d.date_effet || d.date_approbation || "") <= 7 && (d.date_effet || d.date_approbation));
    const parPers: Record<string, Doc[]> = {};
    for (const d of recents) {
      const L = lecturesDe(d.id), lecteurs = readersOf(d);
      const concernes = [...((L && L.consult) || []), ...circOf(d).flatMap((s) => holders(s.role))].map((x) => mb(x)).filter((m) => m && !lecteurs.includes(idDe(m))) as Membre[];
      concernes.forEach((m) => { if (autorise(m)) (parPers[m.email] = parPers[m.email] || []).includes(d) || parPers[m.email].push(d); });
    }
    for (const [email, ds] of Object.entries(parPers)) {
      const m = ms.find((x) => x.email === email)!, l = langue(m);
      periodiques.push({ cle: "nouveautes|" + email + "|" + semaine(loc.date), cat: "nouveautes", m, l, sujet: l === "en" ? "Repository: new documents in force" : "Référentiel : nouveaux documents en vigueur",
        titre: tx("nouveautes", l), intro: l === "en" ? "These documents came into force in the last seven days and concern your functions." : "Ces documents sont entrés en vigueur ces sept derniers jours et concernent vos fonctions.",
        sections: [{ h: tx("nouveautes", l), lignes: ds.map((d) => ({ ref: refDe(d, l), titre: titreDe(d, l), lien: lien(d), detail: (l === "en" ? "In force since " : "En vigueur depuis le ") + enDate(d.date_effet || d.date_approbation || "", l) })) }] });
    }
  }
  // 5d. Revues périodiques (premier jour ouvré du mois)
  if (R.types.revue && loc.jourMois <= 3) {
    const ech = (d: Doc) => { const v = String(d.prochaine_revue || ""); if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; const mm = v.match(/(\d+)\s*mois/), base = d.date_effet || d.date_approbation; if (mm && base && d.statut === "En vigueur") { const x = new Date(base + "T00:00:00Z"); x.setUTCMonth(x.getUTCMonth() + +mm[1]); return x.toISOString().slice(0, 10); } return null; };
    const lim = new Date(Date.now() + 60 * JOUR).toISOString().slice(0, 10);
    const rv = docs.filter((d) => !etats(d.id)).map((d) => ({ d, e: ech(d) })).filter((x) => x.e && x.e <= lim).sort((a, b) => (a.e! < b.e! ? -1 : 1));
    if (rv.length) for (const m of [...holders("rcci").map(mb), boite].filter((m, i, a) => m && a.indexOf(m) === i) as Membre[]) {
      if (!autorise(m)) continue; const l = m.email === R.boite ? "fr" : langue(m);
      periodiques.push({ cle: "revue|" + m.email + "|" + loc.date.slice(0, 7), cat: "revue", m, l, sujet: l === "en" ? "Repository: periodic reviews due" : "Référentiel : revues périodiques à prévoir", titre: tx("revue", l),
        intro: l === "en" ? "Documents whose periodic review is overdue or due within 60 days." : "Documents dont la revue périodique est échue ou tombe dans les 60 jours.",
        sections: [{ h: tx("revue", l), lignes: rv.map((x) => ({ ref: refDe(x.d, l), titre: titreDe(x.d, l), lien: lien(x.d), alerte: x.e! < loc.date, detail: (l === "en" ? "Review due " : "Revue prévue le ") + enDate(x.e!, l) })) }] });
    }
  }
  // 5e. Résumé quotidien pour la boîte partagée
  if (R.types.resume) {
    const { data: hier } = await sb.from("notifications").select("categorie,statut").gte("cree_le", new Date(Date.now() - JOUR).toISOString());
    const cpt: Record<string, number> = {}; (hier || []).forEach((r: { categorie: string; statut: string }) => { if (r.statut === "envoye") cpt[r.categorie] = (cpt[r.categorie] || 0) + 1; });
    const nV = enCours.filter((x) => x.cat === "visa"), nL = enCours.filter((x) => x.cat === "lecture"), late = enCours.filter((x) => x.age > x.delai);
    const docsV = new Set(nV.map((x) => x.d.id + x.d.empreinte)).size;
    periodiques.push({ cle: "resume|" + loc.date, cat: "resume", m: boite, l: "fr", sujet: "Référentiel : résumé du " + enDate(loc.date, "fr"), titre: tx("resume", "fr") + " — " + enDate(loc.date, "fr"),
      intro: docsV + " document(s) en attente de visa, " + nL.length + " lecture(s) attendue(s), " + late.length + " élément(s) en retard.",
      sections: [
        { h: "Avis envoyés ces dernières 24 heures", lignes: [], texte: Object.keys(cpt).length ? Object.entries(cpt).map(([c, n]) => esc((CATEGORIES.find((x) => x[0] === c) || ["", c])[1]) + " : " + n).join("<br>") : "Aucun." },
        { h: "En retard", lignes: late.sort((a, b) => b.age - b.delai - (a.age - a.delai)).slice(0, 25).map((x) => ({ ref: refDe(x.d, "fr"), titre: titreDe(x.d, "fr"), lien: lien(x.d), alerte: true, detail: (x.cat === "visa" ? x.etape : "Lecture") + " · " + (x.m.nom || x.m.email) + " · en retard de " + (x.age - x.delai) + " j" })) },
      ] });
  }

  // 6. Réservation des clés puis envoi : un e-mail par personne et par exécution pour les avis immédiats
  const actifDepuis = R.actif_depuis || "";
  const anciens = avis.filter((x) => actifDepuis && x.quand && x.quand < actifDepuis);
  const neufs = avis.filter((x) => !anciens.includes(x));
  if (anciens.length) await sb.from("notif_items").upsert(anciens.map((x) => ({ cle: x.cle, statut: "ignore" })), { onConflict: "cle", ignoreDuplicates: true });
  const pris = new Set<string>();
  for (let i = 0; i < neufs.length; i += 200) {
    const { data } = await sb.from("notif_items").upsert(neufs.slice(i, i + 200).map((x) => ({ cle: x.cle })), { onConflict: "cle", ignoreDuplicates: true }).select("cle");
    (data || []).forEach((r: { cle: string }) => pris.add(r.cle));
  }
  const parDest: Record<string, Avis[]> = {};
  neufs.filter((x) => pris.has(x.cle)).forEach((x) => { (parDest[x.a] = parDest[x.a] || []).push(x); });
  const envois: { a: string; cat: string; sujet: string; html: string; cles: string[] }[] = [];
  const ORDRE = ["acces", "droits", "suspension", "visa", "lecture", "renvoi", "abrogation", "redaction"];
  for (const [email, xs] of Object.entries(parDest)) {
    const m = email === R.boite ? boite : ms.find((x) => x.email === email); const l = email === R.boite ? "fr" : langue(m);
    const cats = ORDRE.filter((c) => xs.some((x) => x.cat === c));
    const seul = xs.length === 1 ? xs[0] : null;
    const sujet = seul ? (l === "en" ? "Repository: " : "Référentiel : ") + (seul.cat === "visa" ? (l === "en" ? "your sign-off is awaited on " : "votre visa est attendu sur ") + seul.ligne.ref.split(" · ")[0]
      : seul.cat === "lecture" ? (l === "en" ? "please read " : "à lire et attester : ") + seul.ligne.ref.split(" · ")[0] : seul.ligne.titre)
      : (l === "en" ? "Repository: " + xs.length + " notices" : "Référentiel : " + xs.length + " avis");
    const intro = email === R.boite ? "Copie des avis du référentiel." : l === "en" ? "Here is what concerns you in the document repository." : "Voici ce qui vous concerne dans le référentiel documentaire.";
    envois.push({ a: email, cat: cats.length === 1 ? cats[0] : "avis", sujet, cles: xs.map((x) => x.cle), html: courriel(l, seul ? seul.ligne.titre : email === R.boite ? "Copie des avis" : cats.length === 1 ? tx(cats[0], l) : l === "en" ? "Your notices" : "Vos avis", intro, cats.map((c) => ({ h: tx(c, l), lignes: xs.filter((x) => x.cat === c).map((x) => x.ligne) }))) });
  }
  for (const p of periodiques) {
    const { data } = await sb.from("notif_items").upsert({ cle: p.cle }, { onConflict: "cle", ignoreDuplicates: true }).select("cle");
    if (!data || !data.length) continue;
    if (p.paliers && p.paliers.length) await sb.from("notif_items").upsert(p.paliers.map((c) => ({ cle: c })), { onConflict: "cle", ignoreDuplicates: true });
    envois.push({ a: p.m.email, cat: p.cat, sujet: p.sujet, cles: [p.cle], html: courriel(p.l, p.titre, p.intro, p.sections) });
  }
  // Envoi (en mode test, tout part vers la boîte partagée, avec les destinataires prévus en bandeau)
  let ok = 0, ko = 0;
  for (const e of envois) {
    const a = R.test ? [R.boite] : [e.a];
    const html = R.test ? e.html.replace('<tr><td style="padding:20px 22px', `<tr><td style="background:#FBF1DC;color:#6B4A0E;padding:10px 22px;font:12.5px Arial,sans-serif">Période d'essai (redirigé) — destinataire prévu : ${esc(e.a)}</td></tr><tr><td style="padding:20px 22px`) : e.html;
    const sujet = (R.test ? "[ESSAI → " + e.a + "] " : "") + e.sujet;
    const { data: n } = await sb.from("notifications").insert({ categorie: e.cat, a, sujet, html }).select("id").single();
    try { await envoyerGraph(R.boite, a, sujet, html); ok++; if (n) await sb.from("notifications").update({ statut: "envoye", envoye_le: new Date().toISOString(), tentatives: 1 }).eq("id", n.id); }
    catch (er) { ko++; if (n) await sb.from("notifications").update({ statut: "erreur", erreur: String((er as Error).message).slice(0, 500), tentatives: 1 }).eq("id", n.id); }
    if (n) await sb.from("notif_items").update({ envoi: n.id }).in("cle", e.cles);
  }
  // Nouvelle tentative pour les envois en erreur (trois au plus)
  const { data: err } = await sb.from("notifications").select("id,a,sujet,html,tentatives").eq("statut", "erreur").lt("tentatives", 3).lt("cree_le", new Date(Date.now() - 60000).toISOString()).limit(20);
  for (const e of (err || []) as { id: number; a: string[]; sujet: string; html: string; tentatives: number }[]) {
    try { await envoyerGraph(R.boite, e.a, e.sujet, e.html); ok++; await sb.from("notifications").update({ statut: "envoye", envoye_le: new Date().toISOString(), tentatives: e.tentatives + 1, erreur: null }).eq("id", e.id); }
    catch (er) { await sb.from("notifications").update({ tentatives: e.tentatives + 1, erreur: String((er as Error).message).slice(0, 500) }).eq("id", e.id); }
  }
  if (nouveauCurseur !== curseur) await sb.from("notif_etat").update({ curseur_journal: nouveauCurseur }).eq("id", 1);
  return { ok: true, envoyes: ok, erreurs: ko, ignores: anciens.length };
}

// E-mail d'essai vers la boîte partagée (bouton de Paramétrage)
export async function essai(par: string) {
  if (!configure()) throw new Error("configuration Microsoft 365 absente (variables Vercel)");
  const sb = service();
  const { data: rk } = await sb.from("kv").select("data").eq("path", "notifications/reglages").maybeSingle();
  const R = lireReglages(rk && rk.data);
  const html = courriel("fr", "E-mail d'essai", "Cet e-mail confirme que le référentiel peut envoyer des avis depuis " + esc(R.boite) + ". Demandé par " + esc(par) + ".", []);
  const sujet = "Référentiel : e-mail d'essai";
  const { data: n } = await sb.from("notifications").insert({ categorie: "essai", a: [R.boite], sujet, html }).select("id").single();
  try { await envoyerGraph(R.boite, [R.boite], sujet, html); if (n) await sb.from("notifications").update({ statut: "envoye", envoye_le: new Date().toISOString(), tentatives: 1 }).eq("id", n.id); }
  catch (e) { if (n) await sb.from("notifications").update({ statut: "erreur", erreur: String((e as Error).message).slice(0, 500), tentatives: 3 }).eq("id", n.id); throw e; }
}
export type { SupabaseClient };
