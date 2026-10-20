// Outil de versionnage du référentiel.
//
//   node tools/version.mjs etat
//       Liste les documents, leur version, leur statut, leur empreinte et les révisions en cours.
//
//   node tools/version.mjs reviser <ID> <mineure|revision> "Objet de la modification" [par]
//       Ouvre une révision d'un document EN VIGUEUR : fige la version en vigueur dans vigueur/,
//       puis prépare le texte de travail (version suivante, statut Projet, ligne d'historique).
//       Pour un document encore en projet (0.x), modifier le texte directement suffit.
//
//   node tools/version.mjs visas <dossier-export>
//       Construit content/approbations.json à partir de l'export de la base des visas
//       (collections roles/ et sig/<id>/items/ enregistrées en JSON).
//
//   node tools/version.mjs adopter <ID>
//       Après les visas : passe le texte de travail en vigueur (1.0 pour un premier projet,
//       sinon la version de la révision), date d'approbation tirée des visas, archive
//       l'ancienne version dans content/archives/<ID>/v<version>/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import yaml from "js-yaml";
import { textHash } from "../build.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "content/documents");
const APPROB = path.join(ROOT, "content/approbations.json");
const today = () => new Date().toISOString().slice(0, 10);
const die = (m) => { console.error("Erreur : " + m); process.exit(1); };
const fmOf = (f) => matter(fs.readFileSync(f, "utf8"));
const norm = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : Array.isArray(v) ? v.map(norm) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, norm(x)])) : v);
function writeFm(f, data, content) {
  data = norm(data);
  const head = yaml.dump(data, { lineWidth: -1, quotingType: '"', forceQuotes: false, noRefs: true });
  fs.writeFileSync(f, "---\n" + head + "---\n" + content.replace(/^\n?/, "\n"));
}
const copyDir = (src, dst, skip = []) => {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip.includes(e.name)) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
};
const bump = (v, nature) => {
  const [maj, min] = String(v).split(".").map(Number);
  if (maj === 0) return "1.0";
  return nature === "mineure" ? `${maj}.${(min || 0) + 1}` : `${maj + 1}.0`;
};
const approbs = () => (fs.existsSync(APPROB) ? JSON.parse(fs.readFileSync(APPROB, "utf8")) : {});

const [cmd, ...args] = process.argv.slice(2);

if (cmd === "etat") {
  for (const id of fs.readdirSync(DOCS).sort()) {
    const root = path.join(DOCS, id); if (!fs.existsSync(path.join(root, "document.md"))) continue;
    const vig = path.join(root, "vigueur");
    const cur = fmOf(path.join(fs.existsSync(vig) ? vig : root, "document.md")).data;
    let line = `${id.padEnd(16)} v${String(cur.version).padEnd(5)} ${String(cur.statut).padEnd(11)} ${textHash(fs.existsSync(vig) ? vig : root)}`;
    if (fs.existsSync(vig)) { const p = fmOf(path.join(root, "document.md")).data; line += `   révision v${p.version} en cours (${(p.historique || [])[0]?.nature || "?"}) ${textHash(root)}`; }
    const ap = approbs()[id] || {};
    const h = textHash(root);
    if (ap[h]) line += "   visas : " + Object.keys(ap[h]).join(", ");
    console.log(line);
  }
} else if (cmd === "reviser") {
  const [id, nature, objet, par = "RCCI"] = args;
  if (!id || !["mineure", "revision"].includes(nature) || !objet) die('usage : reviser <ID> <mineure|revision> "objet" [par]');
  const root = path.join(DOCS, id), vig = path.join(root, "vigueur");
  if (!fs.existsSync(path.join(root, "document.md"))) die("document introuvable : " + id);
  if (fs.existsSync(vig)) die("une révision est déjà en cours pour " + id);
  const { data, content } = fmOf(path.join(root, "document.md"));
  if (data.statut !== "En vigueur") die(id + " n'est pas en vigueur : modifiez directement le texte du projet.");
  // Empreinte de la version en vigueur, notée dans son historique (sert aux lectures des corrections mineures)
  const hist = (data.historique || []).map((h) => ({ ...h }));
  if (hist[0] && !hist[0].empreinte) hist[0].empreinte = textHash(root);
  const snapshotData = { ...data, historique: hist };
  copyDir(root, vig, ["vigueur"]);
  writeFm(path.join(vig, "document.md"), snapshotData, content);
  const version = bump(data.version, nature);
  writeFm(path.join(root, "document.md"), {
    ...data, version, statut: "Projet", date_approbation: null, date_effet: null,
    historique: [{ version, date: today(), objet, par, nature }, ...hist],
  }, content);
  console.log(`Révision ouverte : ${id} v${data.version} figée dans vigueur/, texte de travail v${version} (${nature}).`);
  console.log("Modifiez maintenant content/documents/" + id + "/document.md et ses annexes, puis lancez node build.mjs.");
} else if (cmd === "visas") {
  const dir = args[0]; if (!dir || !fs.existsSync(dir)) die("dossier d'export introuvable");
  const body = (f) => { const j = JSON.parse(fs.readFileSync(f, "utf8")); return j.data && typeof j.data === "object" ? j.data : j; };
  const rolesDir = path.join(dir, "roles"), sigDir = path.join(dir, "sig");
  const roles = {};
  if (fs.existsSync(rolesDir)) for (const f of fs.readdirSync(rolesDir)) roles[f.replace(/\.json$/, "")] = body(path.join(rolesDir, f));
  const out = {};
  if (fs.existsSync(sigDir)) for (const uid of fs.readdirSync(sigDir)) {
    const items = path.join(sigDir, uid, "items"); if (!fs.existsSync(items)) continue;
    for (const f of fs.readdirSync(items)) {
      const s = body(path.join(items, f));
      if (!s.doc || !s.empreinte || s.etape === "lecture" || s.etape === "renvoi") continue;
      const r = roles[uid]; if (!r || r.actif === false || !(r.fonctions || []).includes(s.role)) { console.warn("visa ignoré (fonction non détenue) :", f); continue; }
      const slot = ((out[s.doc] ||= {})[s.empreinte] ||= {});
      const prev = slot[s.etape];
      const date = s.etape === "adoption" && s.seance ? s.seance : String(s.at).slice(0, 10);
      if (!prev || prev.at < s.at) slot[s.etape] = { date, at: s.at, par: uid, role: s.role, ...(s.seance ? { seance: s.seance } : {}), ...(s.pv ? { pv: s.pv } : {}) };
    }
  }
  fs.writeFileSync(APPROB, JSON.stringify(out, null, 2));
  console.log("approbations.json écrit :", Object.keys(out).length, "document(s) visé(s).");
} else if (cmd === "adopter") {
  const [id] = args;
  const root = path.join(DOCS, id || ""), vig = path.join(root, "vigueur");
  if (!id || !fs.existsSync(path.join(root, "document.md"))) die("document introuvable : " + id);
  const h = textHash(root), ap = (approbs()[id] || {})[h];
  const { data, content } = fmOf(path.join(root, "document.md"));
  const needs = ["verification", /Conseil/.test(data.approuve_par || "") ? "adoption" : "approbation"];
  const missing = needs.filter((e) => !(ap && ap[e]));
  if (missing.length) die(`visas manquants sur le texte actuel (${h}) : ${missing.join(", ")}. Exportez d'abord les visas (commande visas).`);
  const decision = ap.adoption || ap.approbation;
  const version = String(data.version).startsWith("0.") ? "1.0" : String(data.version);
  const hist = (data.historique || []).map((x) => ({ ...x }));
  if (String(data.version).startsWith("0.")) hist.unshift({ version, date: decision.date, objet: "Adoption" + (ap.adoption ? ` par le Conseil d'Administration (séance du ${ap.adoption.seance}${ap.adoption.pv ? ", " + ap.adoption.pv : ""})` : " par le Directeur Général"), par: ap.adoption ? "Conseil d'Administration" : "Directeur Général", nature: "revision", empreinte: h });
  else if (hist[0]) hist[0].empreinte = h;
  if (fs.existsSync(vig)) {
    const old = fmOf(path.join(vig, "document.md")).data;
    copyDir(vig, path.join(ROOT, "content/archives", id, "v" + old.version));
    fs.rmSync(vig, { recursive: true, force: true });
  }
  writeFm(path.join(root, "document.md"), { ...data, version, statut: "En vigueur", date_approbation: decision.date, date_effet: data.date_effet || decision.date, historique: hist }, content);
  console.log(`${id} adopté : v${version} en vigueur depuis le ${decision.date} (empreinte ${h}).`);
} else {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"));
}
