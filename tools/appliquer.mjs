// Publication automatique des modifications faites en ligne.
//
//   node tools/appliquer.mjs            applique les brouillons soumis (redaction/<ID>, statut « soumis »)
//   node tools/appliquer.mjs --compter  affiche seulement le nombre de brouillons soumis
//
// Variables d'environnement : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Pour chaque brouillon soumis :
//   1. vérifie qu'il part bien du texte actuel (même empreinte), sinon le marque « conflit » ;
//   2. document en vigueur : ouvre la révision (version.mjs reviser : la version en vigueur est figée dans vigueur/) ;
//      document en projet : ajoute une ligne d'historique ;
//   3. remplace le texte, le titre et le résumé.
// Puis régénère le site, les PDF et les Word (node build.mjs), enregistre et pousse le dépôt
// (fait par le workflow), et seulement ensuite marque les brouillons « applique » avec la nouvelle empreinte
// et note leurs rédacteurs (auteurs/<ID>~<empreinte>) : ils ne pourront pas viser cette version.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import yaml from "js-yaml";
import { textHash } from "../build.mjs";
import { ANCIENNES, cartes, convertir } from "./renvois-anciens.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "content/documents");
const URL_ = (process.env.SUPABASE_URL || "").replace(/\/$/, ""), KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!URL_ || !KEY) { console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires."); process.exit(1); }
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };
const api = async (p, opt = {}) => { const r = await fetch(URL_ + "/rest/v1/" + p, { ...opt, headers: { ...H, ...(opt.headers || {}) } }); const t = await r.text(); if (!r.ok) throw new Error(r.status + " " + t); return t ? JSON.parse(t) : null; };
const today = () => new Date().toISOString().slice(0, 10);
const norm = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : Array.isArray(v) ? v.map(norm) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, norm(x)])) : v);
const writeFm = (f, data, content) => fs.writeFileSync(f, "---\n" + yaml.dump(norm(data), { lineWidth: -1, quotingType: '"', noRefs: true }) + "---\n" + content.replace(/^\n?/, "\n"));
const setKv = (p, data) => api("kv?on_conflict=path", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ path: p, data }) });

// Après la régénération et l'enregistrement du dépôt : marque les brouillons publiés et note leurs rédacteurs
if (process.argv.includes("--confirmer")) {
  const f = path.join(ROOT, "build", "appliques.json");
  const list = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : [];
  for (const a of list) {
    const emp = textHash(path.join(DOCS, a.id));
    await setKv("auteurs/" + a.id + "~" + emp, { auteurs: a.auteurs, objet: a.objet, version: a.version, at: new Date().toISOString() });
    await setKv(a.p, { ...a.b, statut: "applique", empreinte: emp, version: a.version, traite_le: new Date().toISOString() });
    console.log(a.id + " : publié, empreinte " + emp + ".");
  }
  // Noms d'annexes publiés : retirés de la liste d'attente (sauf s'ils ont été changés entre-temps)
  const fn = path.join(ROOT, "build", "noms.json");
  const faits = fs.existsSync(fn) ? JSON.parse(fs.readFileSync(fn, "utf8")) : {};
  if (Object.keys(faits).length) {
    const [nk] = await api("kv?select=data&path=eq.noms%2Fannexes");
    const ch = { ...((nk && nk.data && nk.data.changements) || {}) };
    for (const [k, v] of Object.entries(faits)) if (ch[k] && ch[k].le === v.le) delete ch[k];
    await setKv("noms/annexes", { changements: ch, en_attente: Object.keys(ch).length ? "oui" : "non", publie_le: new Date().toISOString() });
    console.log(Object.keys(faits).length + " nom(s) d'annexe publié(s).");
  }
  // Présentation publiée : retirée de l'attente (sauf si elle a été modifiée entre-temps)
  const fpr = path.join(ROOT, "build", "presentation.json");
  if (fs.existsSync(fpr)) {
    const { maj } = JSON.parse(fs.readFileSync(fpr, "utf8"));
    const [pk] = await api("kv?select=data&path=eq.presentation%2Freglages");
    if (pk && pk.data && pk.data.maj === maj) await setKv("presentation/reglages", { ...pk.data, en_attente: "non", publie_le: new Date().toISOString() });
  }
  process.exit(0);
}

// Noms d'annexes revus dans Paramétrage : écrits dans l'en-tête des annexes (FR, EN, et version en vigueur figée).
// Le nom n'entre pas dans l'empreinte : aucun visa ni circuit n'est touché, les renvois [[annexe:…]] suivent seuls.
{
  const [nk] = await api("kv?select=data&path=eq.noms%2Fannexes");
  const faits = {};
  for (const [k, v] of Object.entries((nk && nk.data && nk.data.changements) || {})) {
    const [doc, cle] = k.split("/");
    if (!/^PC-[A-Z0-9-]+$/.test(doc) || !/^A\d+$/.test(cle)) continue;
    let ok = false;
    for (const sous of ["", "vigueur"]) for (const [lang, val] of [["", v.fr], ["en", v.en]]) {
      const f = path.join(DOCS, doc, sous, lang, "annexes", cle + ".md");
      if (!val || !fs.existsSync(f)) continue;
      const raw = fs.readFileSync(f, "utf8"), ligne = 'nom: "' + String(val).trim().replace(/["\\]/g, "") + '"';
      // Seule la ligne « nom: » change : le reste de l'en-tête et le texte restent identiques
      const neuf = /^nom:.*$/m.test(raw.split("\n---")[0]) ? raw.replace(/^nom:.*$/m, ligne) : raw.replace(/^(titre:.*)$/m, "$1\n" + ligne);
      if (neuf !== raw) { fs.writeFileSync(f, neuf); ok = true; }
    }
    faits[k] = v; if (ok) console.log(k + " : nom « " + v.fr + " » / “" + (v.en || "") + "”.");
  }
  fs.mkdirSync(path.join(ROOT, "build"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "build", "noms.json"), JSON.stringify(faits));
}
// État réel de la plateforme pour les fiches de maîtrise des PDF et des Word : circuits réglés dans Paramétrage
// et lectures obligatoires (fonctions désignées). Réécrit seulement s'il a changé.
if (!process.argv.includes("--compter")) {
  const circ = await api("kv?select=path,data&path=like.circuits%2F*"), lect = await api("kv?select=path,data&path=like.lectures%2F*");
  const etat = {
    circuits: Object.fromEntries(circ.filter((r) => r.data && r.data.type && Array.isArray(r.data.etapes)).map((r) => [r.data.type, r.data.etapes.map((e) => ({ etape: e.etape, label: e.label, role: e.role, fonction: e.fonction, obligatoire: e.obligatoire !== false }))]).sort()),
    lectures: Object.fromEntries(lect.map((r) => { const L = r.data || {}; return [r.path.slice(9), { tous: !!L.tous, fonctions: L.fonctions || [], consult_fonctions: L.consult_fonctions || [], personnes: (L.ids || []).length, consult_personnes: (L.consult || []).length }]; }).sort()),
  };
  const f = path.join(ROOT, "content", "etat-plateforme.json"), txt = JSON.stringify(etat, null, 1) + "\n";
  if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== txt) { fs.writeFileSync(f, txt); console.log("État de la plateforme (circuits, lectures) mis à jour pour les fiches de maîtrise."); }
}
// Brouillons préparés hors de la plateforme (content/brouillons/<ID>.json) : déposés comme brouillons non soumis,
// pour qu'un rédacteur les reprenne dans l'éditeur et les soumette lui-même. Jamais par-dessus un brouillon en cours.
if (!process.argv.includes("--compter")) {
  const dir = path.join(ROOT, "content", "brouillons");
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => /^PC-[A-Z0-9-]+\.json$/.test(x)) : []) {
    const id = f.slice(0, -5), root = path.join(DOCS, id);
    if (!fs.existsSync(path.join(root, "document.md"))) { console.warn(id + " : document introuvable, brouillon non déposé."); continue; }
    const [cur] = await api("kv?select=data&path=eq.redaction%2F" + encodeURIComponent(id));
    if (cur && cur.data && ["brouillon", "soumis", "conflit"].includes(cur.data.statut)) { console.warn(id + " : un brouillon est déjà en cours, dépôt différé."); continue; }
    const b = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), now = new Date().toISOString();
    await setKv("redaction/" + id, { ...b, base: textHash(root), statut: "brouillon", cree_le: now, maj: now, par: null, auteurs: b.auteurs || [] });
    fs.rmSync(path.join(dir, f));
    console.log(id + " : brouillon déposé (" + (b.objet || "") + ").");
  }
}
// Présentation des documents revue dans Paramétrage : écrite dans content/presentation.json (PDF et Word régénérés ensuite)
{
  const [pk] = await api("kv?select=data&path=eq.presentation%2Freglages");
  if (pk && pk.data && pk.data.en_attente === "oui") {
    const { societe = {}, types = {}, documents = {}, maj } = pk.data;
    const propre = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k, v]) => /^[a-z_]+$/.test(k) && typeof v === "string").map(([k, v]) => [k, v.trim().slice(0, 200)]));
    const reg = (r) => ({ ...(r.garde ? { garde: String(r.garde) } : {}), ...(r.entete ? { entete: String(r.entete) } : {}), ...(r.pied ? { pied: String(r.pied) } : {}), ...(Array.isArray(r.champs) ? { champs: r.champs.map(String) } : {}) });
    const out = { societe: propre(societe), types: Object.fromEntries(Object.entries(types).map(([k, r]) => [k, reg(r || {})])), documents: Object.fromEntries(Object.entries(documents).filter(([k]) => /^PC-[A-Z0-9-]+$/.test(k)).map(([k, r]) => [k, reg(r || {})])) };
    fs.writeFileSync(path.join(ROOT, "content", "presentation.json"), JSON.stringify(out, null, 1) + "\n");
    fs.mkdirSync(path.join(ROOT, "build"), { recursive: true });
    fs.writeFileSync(path.join(ROOT, "build", "presentation.json"), JSON.stringify({ maj }));
    console.log("Présentation des documents mise à jour.");
  }
}
// Brouillons ouverts avant le passage aux noms d'annexes : « l'Annexe 2 » devient [[annexe:A2]] et le brouillon
// repart du texte actuel (seuls les renvois ont changé entre les deux), sans conflit pour son rédacteur.
if (!process.argv.includes("--compter")) {
  const carte = cartes(DOCS);
  for (const { path: p, data: b } of await api("kv?select=path,data&path=like.redaction%2F*")) {
    const id = p.split("/")[1];
    if (!b || !ANCIENNES[id] || b.base !== ANCIENNES[id] || !["brouillon", "soumis"].includes(b.statut) || !fs.existsSync(path.join(DOCS, id, "document.md"))) continue;
    const ignores = [];
    const conv = (t) => { const r = convertir(id, "fr", t, carte); ignores.push(...r.ignores); return r.texte; };
    const nb = { ...b, body: conv(b.body || ""), base: textHash(path.join(DOCS, id)), renvois_convertis_le: new Date().toISOString() };
    if (Array.isArray(b.annexes)) nb.annexes = b.annexes.map((a) => ({ ...a, body: conv(a.body || "") }));
    await setKv(p, nb);
    console.log(id + " : brouillon remis à niveau (renvois vers les annexes convertis)" + (ignores.length ? " ; laissés tels quels : " + ignores.join(" · ") : "") + ".");
  }
}
const soumis = await api("kv?select=path,data&path=like.redaction%2F*&data->>statut=eq.soumis");
if (process.argv.includes("--compter")) { console.log(soumis.length); process.exit(0); }
if (!soumis.length) { console.log("Aucune modification soumise."); process.exit(0); }

const membres = await api("membres?select=user_id,fonctions");
// Dans les documents, une personne est désignée par sa fonction, jamais par son nom
const TITRES = { pca: "Président du Conseil d'Administration", adm: "Administrateur", dg: "Directeur Général", rcci: "RCCI", dcom: "Directeur Commercial", dmc: "Directeur des Marchés de Capitaux" };
const nomDe = (uid) => { const m = membres.find((x) => x.user_id === uid); const f = ((m && m.fonctions) || []).find((x) => TITRES[x]); return f ? TITRES[f] : "Rédacteur"; };
const appliques = [];
for (const { path: p, data: b } of soumis) {
  const id = p.split("/")[1], root = path.join(DOCS, id), vig = path.join(root, "vigueur");
  const conflit = (message) => { console.warn(id + " : " + message); return setKv(p, { ...b, statut: "conflit", message, traite_le: new Date().toISOString() }); };
  if (!/^[A-Z0-9-]+$/.test(id)) { await conflit("référence invalide"); continue; }
  if (typeof b.body !== "string" || !b.body.trim()) { await conflit("texte vide"); continue; }
  // Images importées d'un Word : media:<empreinte> → images/<empreinte>.<ext> dans le dossier du document
  const avecImages = async (texte) => {
    const refs = [...new Set((String(texte).match(/media:[0-9a-f]{16}/g) || []).map((x) => x.slice(6)))];
    let c = String(texte).replace(/\r/g, "");
    if (refs.length) fs.mkdirSync(path.join(root, "images"), { recursive: true });
    for (const h of refs) {
      const [m] = await api("kv?select=data&path=eq.medias%2F" + h);
      if (!m) { await conflit("image introuvable (" + h + ")"); return null; }
      const ext = ({ "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif" })[m.data.type] || "png";
      fs.writeFileSync(path.join(root, "images", h + "." + ext), Buffer.from(m.data.data, "base64"));
      c = c.split("media:" + h).join("images/" + h + "." + ext);
    }
    return c;
  };
  const corps = await avecImages(b.body);
  if (corps === null) continue;
  // Annexes (brouillons récents) : modifiées, ajoutées (clé suivante), supprimées ; désignées par leur nom, ordre d'affichage noté
  let annexesOK = true;
  const appliquerAnnexes = async () => {
    if (!Array.isArray(b.annexes)) return;
    const dir = path.join(root, "annexes"), dirEn = path.join(root, "en", "annexes");
    fs.mkdirSync(dir, { recursive: true });
    const existants = fs.readdirSync(dir).filter((f) => /^A\d+\.md$/.test(f)).map((f) => f.slice(0, -3));
    let max = Math.max(0, ...existants.map((c) => +c.slice(1)));
    const gardes = new Set();
    for (const [i, a] of b.annexes.entries()) {
      const contenu = await avecImages(a.body || "");
      if (contenu === null) { annexesOK = false; return; }
      const cle = a.cle && existants.includes(a.cle) ? a.cle : "A" + ++max;
      gardes.add(cle);
      const f = path.join(dir, cle + ".md");
      const ancien = fs.existsSync(f) ? matter(fs.readFileSync(f, "utf8")).data : { id: id + "-" + cle };
      const fmA = { ...ancien, id: ancien.id || id + "-" + cle, titre: a.titre, nom: a.nom, nature: a.nature, renseigne_par: a.renseigne_par, conserve_par: a.conserve_par, frequence: a.frequence, ordre: i + 1 };
      if (a.orientation === "paysage") fmA.orientation = "paysage"; else delete fmA.orientation;
      for (const k of ["renseigne_par", "conserve_par", "frequence"]) if (!fmA[k]) delete fmA[k];
      writeFm(f, fmA, contenu);
      // Traduction : l'ordre suit ; le reste est retraduit (traduction signalée en retard)
      const fe = path.join(dirEn, cle + ".md");
      if (fs.existsSync(fe)) { const x = matter(fs.readFileSync(fe, "utf8")); x.data.ordre = i + 1; if (fmA.orientation) x.data.orientation = "paysage"; else delete x.data.orientation; writeFm(fe, x.data, x.content); }
    }
    for (const c of existants) if (!gardes.has(c)) { fs.rmSync(path.join(dir, c + ".md")); fs.rmSync(path.join(dirEn, c + ".md"), { force: true }); console.log(id + " : annexe " + c + " supprimée."); }
  };
  // Nouveau document : création du dossier et de l'en-tête à partir des informations saisies
  if (b.nouveau) {
    if (fs.existsSync(path.join(root, "document.md"))) { await conflit("un document porte déjà cette référence"); continue; }
    const m = b.meta || {};
    const fm = { id, titre: b.titre || m.titre, type: m.type, domaine: m.domaine, version: "0.9", statut: "Projet", confidentialite: m.confidentialite || "Interne",
      proprietaire: m.proprietaire, redige_par: m.redige_par, verifie_par: m.verifie_par, approuve_par: m.approuve_par, date_approbation: null, date_effet: null,
      prochaine_revue: m.prochaine_revue || "12 mois après adoption", diffusion: m.diffusion || "Tous les collaborateurs", public: false, resume: b.resume || "",
      references: [], historique: [{ version: "0.9", date: today(), objet: "Projet initial", par: (b.auteurs || [b.par]).map(nomDe).join(", ") }], notes_redaction: [] };
    fs.mkdirSync(root, { recursive: true });
    writeFm(path.join(root, "document.md"), fm, corps);
    await appliquerAnnexes(); if (!annexesOK) continue;
    appliques.push({ id, p, b, version: "0.9" });
    console.log(id + " : nouveau document créé (v0.9).");
    continue;
  }
  if (!fs.existsSync(path.join(root, "document.md"))) { await conflit("document introuvable"); continue; }
  if (b.base !== textHash(root)) { await conflit("le texte a changé depuis la création du brouillon ; repartez du texte publié"); continue; }
  const par = [b.import_par, ...(b.auteurs || [b.par]).filter(Boolean).map(nomDe)].filter((x, i, a) => x && a.indexOf(x) === i).join(", ") || "Rédacteur";
  let { data: fm } = matter(fs.readFileSync(path.join(root, "document.md"), "utf8"));
  if (fm.statut === "En vigueur" && !fs.existsSync(vig)) {
    execFileSync("node", [path.join(ROOT, "tools/version.mjs"), "reviser", id, b.nature === "revision" ? "revision" : "mineure", b.objet || "Modification", par], { stdio: "inherit" });
    fm = matter(fs.readFileSync(path.join(root, "document.md"), "utf8")).data;
  } else {
    fm.historique = [{ version: String(fm.version), date: today(), objet: b.objet || "Modification du projet", par, ...(fs.existsSync(vig) ? { nature: (fm.historique || [])[0]?.nature || "revision" } : {}) }, ...(fm.historique || [])];
  }
  if (b.titre) fm.titre = b.titre;
  if (b.resume) fm.resume = b.resume;
  // Texte remplacé, gardé pour montrer « ce qui a changé » quand il n'y a pas encore de version en vigueur
  // (precedent.json est hors empreinte : seuls document.md, annexes/ et variables.yaml y entrent)
  if (!fs.existsSync(vig)) { const avant = matter(fs.readFileSync(path.join(root, "document.md"), "utf8")); fs.writeFileSync(path.join(root, "precedent.json"), JSON.stringify({ version: String(avant.data.version), titre: avant.data.titre, body: avant.content, remplace_le: today() }, null, 1) + "\n"); }
  writeFm(path.join(root, "document.md"), fm, corps);
  await appliquerAnnexes(); if (!annexesOK) continue;
  appliques.push({ id, p, b, version: String(fm.version) });
  console.log(id + " : modification appliquée (v" + fm.version + ").");
}
fs.mkdirSync(path.join(ROOT, "build"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "build", "appliques.json"), JSON.stringify(appliques.map((a) => ({ id: a.id, p: a.p, version: a.version, auteurs: a.b.auteurs || [a.b.par], objet: a.b.objet, b: a.b }))));
console.log(appliques.length + " modification(s) appliquée(s).");
