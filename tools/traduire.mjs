// Traduction anglaise de courtoisie des documents (content/documents/<ID>/en/).
//
//   node tools/traduire.mjs --marquer [ID…]   inscrit dans en/document.md l'empreinte du texte français traduit (source)
//   node tools/traduire.mjs --etat            liste les traductions à jour, en retard ou manquantes
//   node tools/traduire.mjs [ID…]             retraduit les documents dont la traduction manque ou est en retard
//
// La retraduction utilise l'API Anthropic (variable ANTHROPIC_API_KEY, secret GitHub) avec les consignes de
// content/en/CONSIGNES.md et, pour la cohérence, la traduction précédente du même document. Chaque résultat est
// contrôlé par tools/verifier-en.mjs ; en cas d'échec, l'ancienne traduction est conservée (signalée « en retard »).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import yaml from "js-yaml";
import { textHash } from "../build.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "content/documents");
const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith("--")), ids0 = args.filter((a) => !a.startsWith("--"));
const tous = fs.readdirSync(DOCS).filter((d) => fs.existsSync(path.join(DOCS, d, "document.md")));
const ids = ids0.length ? ids0 : tous;
// Les variantes : texte de travail (racine) et version en vigueur figée pendant une révision (vigueur/)
const bases = (id) => [path.join(DOCS, id), path.join(DOCS, id, "vigueur")].filter((b) => fs.existsSync(path.join(b, "document.md")));
const enFile = (b) => path.join(b, "en", "document.md");
const source = (b) => (fs.existsSync(enFile(b)) ? matter(fs.readFileSync(enFile(b), "utf8")).data.source || null : null);
function marquer(b) {
  const f = enFile(b); const raw = fs.readFileSync(f, "utf8"); const emp = textHash(b);
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const head = m[1].replace(/^source:.*\n?/m, "").replace(/\n?$/, "");
  fs.writeFileSync(f, "---\n" + head + "\nsource: " + emp + "\n---\n" + raw.slice(m[0].length));
  return emp;
}

if (flags.includes("--marquer")) {
  for (const id of ids) for (const b of bases(id)) if (fs.existsSync(enFile(b))) console.log(path.relative(DOCS, b) + " : source " + marquer(b));
  process.exit(0);
}
const etat = [];
for (const id of ids) for (const b of bases(id)) {
  const s = source(b), e = textHash(b);
  etat.push({ id, b, statut: !fs.existsSync(enFile(b)) ? "manquante" : s === e ? "à jour" : "en retard" });
}
if (flags.includes("--etat")) { etat.forEach((x) => console.log(x.statut.padEnd(10) + " " + path.relative(DOCS, x.b))); process.exit(0); }

const KEY = process.env.ANTHROPIC_API_KEY;
const todo = etat.filter((x) => x.statut !== "à jour");
if (!todo.length) { console.log("Traductions à jour."); process.exit(0); }
if (!KEY) { console.log("ANTHROPIC_API_KEY absent : " + todo.length + " traduction(s) restent signalées en retard."); process.exit(0); }
const MODEL = process.env.TRADUCTION_MODELE || "claude-sonnet-5-5";
const consignes = fs.readFileSync(path.join(ROOT, "content/en/CONSIGNES.md"), "utf8");
const lire = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null);

async function traduireFichier(nom, fr, ancien, contexte) {
  const prompt = `${consignes}\n\n---\nYou are updating the English courtesy translation of one file of document ${contexte}.\n` +
    (ancien ? "Here is the PREVIOUS English translation of this file. Keep its wording wherever the French did not change; translate only what changed, and keep terminology consistent with it.\n<previous_english>\n" + ancien + "\n</previous_english>\n" : "") +
    `Here is the CURRENT French file (${nom}):\n<french>\n${fr}\n</french>\n\nReturn ONLY the complete English file (front matter included when the French has one), with no commentary and no code fences.`;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 32000, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error("API " + r.status + " " + (await r.text()).slice(0, 300));
  const j = await r.json();
  return j.content.map((c) => c.text || "").join("").replace(/^```[a-z]*\n|\n```\s*$/g, "").trim() + "\n";
}

let echecs = 0;
for (const x of todo) {
  const b = x.b, rel = path.relative(DOCS, b), en = path.join(b, "en");
  fs.mkdirSync(path.join(ROOT, "build"), { recursive: true });
  const sauve = fs.existsSync(en) ? fs.mkdtempSync(path.join(ROOT, "build", "en-")) : null;
  if (sauve) fs.cpSync(en, sauve, { recursive: true });
  try {
    fs.mkdirSync(path.join(en, "annexes"), { recursive: true });
    const fichiers = ["document.md", ...(fs.existsSync(path.join(b, "annexes")) ? fs.readdirSync(path.join(b, "annexes")).filter((f) => f.endsWith(".md")).map((f) => "annexes/" + f) : []), ...(fs.existsSync(path.join(b, "variables.yaml")) ? ["variables.yaml"] : [])];
    for (const f of fichiers) {
      const out = await traduireFichier(f, fs.readFileSync(path.join(b, f), "utf8"), lire(path.join(en, f)), x.id);
      if (f === "variables.yaml") yaml.load(out); else matter(out);
      fs.writeFileSync(path.join(en, f), out);
    }
    execFileSync("node", [path.join(ROOT, "tools/verifier-en.mjs"), x.id], { stdio: "inherit" });
    marquer(b);
    console.log(rel + " : traduit et vérifié.");
  } catch (e) {
    echecs++;
    console.warn(rel + " : traduction refusée (" + String(e.message).split("\n")[0] + ") — l'ancienne traduction est conservée.");
    if (sauve) { fs.rmSync(en, { recursive: true, force: true }); fs.cpSync(sauve, en, { recursive: true }); }
  } finally { if (sauve) fs.rmSync(sauve, { recursive: true, force: true }); }
}
console.log(todo.length - echecs + " traduction(s) mise(s) à jour, " + echecs + " en échec.");
