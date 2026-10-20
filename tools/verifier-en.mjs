// Vérifie qu'une traduction anglaise (content/documents/<ID>/en/) respecte la structure du texte français.
//   node tools/verifier-en.mjs            tous les documents traduits
//   node tools/verifier-en.mjs PC-COD-001 un document
// Contrôles : fichiers présents, en-tête (clés, références, historique), titres et articles, variables {{…}},
// balises HTML, tableaux, champs du formulaire (modèles de contrat).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import yaml from "js-yaml";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "content/documents");
const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(DOCS).filter((d) => fs.existsSync(path.join(DOCS, d, "en")));
let erreurs = 0;
const ko = (id, m) => { erreurs++; console.log("✗ " + id + " : " + m); };
const titres = (md) => (md.match(/^#{2,3} .*$/gm) || []).map((h) => h.replace(/^(##) (?:Titre|Title) ([IVXLC]+) —.*/, "$1 T$2").replace(/^(###) Article (\d+).*/, "$1 A$2").replace(/^(#{2,3}) (?!T[IVXLC]|A\d).*/, "$1 *"));
const vars = (md) => (md.match(/\{\{[^}]*\}\}|\{%[^%]*%\}/g) || []).sort();
const balises = (md) => (md.match(/<\/?[a-z][a-z0-9]*/gi) || []).map((x) => x.toLowerCase()).sort().join(",");
const lignesTab = (md) => (md.match(/^\|.*\|\s*$/gm) || []).length;
const comparer = (id, quoi, fr, en) => {
  const tf = titres(fr), te = titres(en);
  if (tf.join("|") !== te.join("|")) ko(id, quoi + " : titres/articles différents (FR " + tf.length + ", EN " + te.length + ") " + tf.filter((x, i) => x !== te[i]).slice(0, 3).join(" "));
  const vf = vars(fr), ve = vars(en);
  if (vf.join("|") !== ve.join("|")) ko(id, quoi + " : variables {{…}} différentes — manquantes : " + vf.filter((v) => !ve.includes(v)).slice(0, 5).join(" ") + " ; en trop : " + ve.filter((v) => !vf.includes(v)).slice(0, 5).join(" "));
  if (balises(fr) !== balises(en)) ko(id, quoi + " : balises HTML différentes");
  if (lignesTab(fr) !== lignesTab(en)) ko(id, quoi + " : lignes de tableau différentes (FR " + lignesTab(fr) + ", EN " + lignesTab(en) + ")");
  if (/[àâçéèêëîïôûùœ]{1}[a-z]+ (?:le|la|les|des|du|et|pour) /i.test(en.replace(/\{\{[^}]*\}\}/g, ""))) ko(id, quoi + " : du français semble rester dans le texte");
};
for (const id of ids) {
  const base = path.join(DOCS, id), en = path.join(base, "en");
  if (!fs.existsSync(path.join(en, "document.md"))) { ko(id, "en/document.md manquant"); continue; }
  let F, E;
  try { F = matter(fs.readFileSync(path.join(base, "document.md"), "utf8")); E = matter(fs.readFileSync(path.join(en, "document.md"), "utf8")); }
  catch (e) { ko(id, "YAML illisible : " + e.message.split("\n")[0]); continue; }
  for (const k of ["titre", "resume", "diffusion"]) if (F.data[k] && !E.data[k]) ko(id, "en-tête : " + k + " manquant");
  const rf = (F.data.references || []).map((r) => r.ref), re = (E.data.references || []).map((r) => r.ref);
  if (rf.join(",") !== re.join(",")) ko(id, "références : codes ou ordre différents");
  const hf = F.data.historique || [], he = E.data.historique || [];
  if (hf.length !== he.length || hf.some((h, i) => String(h.version) !== String((he[i] || {}).version))) ko(id, "historique : entrées différentes");
  if ((F.data.notes_redaction || []).length !== (E.data.notes_redaction || []).length) ko(id, "notes_redaction : nombre différent");
  comparer(id, "document", F.content, E.content);
  const af = path.join(base, "annexes");
  if (fs.existsSync(af)) for (const f of fs.readdirSync(af).filter((x) => x.endsWith(".md"))) {
    const fe = path.join(en, "annexes", f);
    if (!fs.existsSync(fe)) { ko(id, "annexe " + f + " manquante"); continue; }
    try {
      const a = matter(fs.readFileSync(path.join(af, f), "utf8")), b = matter(fs.readFileSync(fe, "utf8"));
      if (a.data.id !== b.data.id) ko(id, "annexe " + f + " : id différent");
      for (const k of Object.keys(a.data)) if (b.data[k] === undefined) ko(id, "annexe " + f + " : clé " + k + " manquante");
      comparer(id, "annexe " + f, a.content, b.content);
    } catch (e) { ko(id, "annexe " + f + " : YAML illisible : " + e.message.split("\n")[0]); }
  }
  const vf = path.join(base, "variables.yaml");
  if (fs.existsSync(vf)) {
    const ve = path.join(en, "variables.yaml");
    if (!fs.existsSync(ve)) ko(id, "en/variables.yaml manquant");
    else try {
      const a = yaml.load(fs.readFileSync(vf, "utf8")), b = yaml.load(fs.readFileSync(ve, "utf8"));
      const champs = (s) => (s.sections || []).flatMap((x) => (x.champs || []).map((c) => c.id + ":" + c.type + ":" + (c.options || []).map((o) => o.valeur).join("/")));
      if (champs(a).join("|") !== champs(b).join("|")) ko(id, "variables.yaml : champs, types ou options différents");
      if ((a.intitule || "") !== (b.intitule || "")) ko(id, "variables.yaml : intitule modifié");
    } catch (e) { ko(id, "en/variables.yaml illisible : " + e.message.split("\n")[0]); }
  }
  if (!erreurs) console.log("✓ " + id);
}
process.exit(erreurs ? 1 : 0);
