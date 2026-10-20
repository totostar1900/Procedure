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
  process.exit(0);
}
const soumis = await api("kv?select=path,data&path=like.redaction%2F*&data->>statut=eq.soumis");
if (process.argv.includes("--compter")) { console.log(soumis.length); process.exit(0); }
if (!soumis.length) { console.log("Aucune modification soumise."); process.exit(0); }

const membres = await api("membres?select=user_id,nom,email");
const nomDe = (uid) => { const m = membres.find((x) => x.user_id === uid); return m ? m.nom || m.email : "Rédacteur"; };
const appliques = [];
for (const { path: p, data: b } of soumis) {
  const id = p.split("/")[1], root = path.join(DOCS, id), vig = path.join(root, "vigueur");
  const conflit = (message) => { console.warn(id + " : " + message); return setKv(p, { ...b, statut: "conflit", message, traite_le: new Date().toISOString() }); };
  if (!/^[A-Z0-9-]+$/.test(id) || !fs.existsSync(path.join(root, "document.md"))) { await conflit("document introuvable"); continue; }
  if (b.base !== textHash(root)) { await conflit("le texte a changé depuis la création du brouillon ; repartez du texte publié"); continue; }
  if (typeof b.body !== "string" || !b.body.trim()) { await conflit("texte vide"); continue; }
  const par = (b.auteurs || [b.par]).map(nomDe).join(", ");
  let { data: fm } = matter(fs.readFileSync(path.join(root, "document.md"), "utf8"));
  if (fm.statut === "En vigueur" && !fs.existsSync(vig)) {
    execFileSync("node", [path.join(ROOT, "tools/version.mjs"), "reviser", id, b.nature === "revision" ? "revision" : "mineure", b.objet || "Modification", par], { stdio: "inherit" });
    fm = matter(fs.readFileSync(path.join(root, "document.md"), "utf8")).data;
  } else {
    fm.historique = [{ version: String(fm.version), date: today(), objet: b.objet || "Modification du projet", par, ...(fs.existsSync(vig) ? { nature: (fm.historique || [])[0]?.nature || "revision" } : {}) }, ...(fm.historique || [])];
  }
  if (b.titre) fm.titre = b.titre;
  if (b.resume) fm.resume = b.resume;
  writeFm(path.join(root, "document.md"), fm, b.body.replace(/\r/g, ""));
  appliques.push({ id, p, b, version: String(fm.version) });
  console.log(id + " : modification appliquée (v" + fm.version + ").");
}
fs.mkdirSync(path.join(ROOT, "build"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "build", "appliques.json"), JSON.stringify(appliques.map((a) => ({ id: a.id, p: a.p, version: a.version, auteurs: a.b.auteurs || [a.b.par], objet: a.b.objet, b: a.b }))));
console.log(appliques.length + " modification(s) appliquée(s).");
