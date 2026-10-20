// Adoption automatique des documents dont le circuit d'approbation est complet.
//
//   node tools/adopter-auto.mjs              adopte les documents approuvés (dans le dépôt de travail)
//   node tools/adopter-auto.mjs --confirmer  après l'enregistrement du dépôt : marque les demandes d'adoption traitées
//
// Variables d'environnement : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Les visas sont relus dans la base et vérifiés ici avec les mêmes règles que la page :
// circuit figé au premier visa (sinon celui du type, sinon celui du document), étapes obligatoires dans l'ordre,
// une personne / toutes / la majorité des titulaires actifs de la fonction, aucun renvoi sur ce texte.
// L'adoption ne touche que l'en-tête du document (statut, version, dates, historique) : l'empreinte du texte,
// donc la validité des visas et des lectures, ne change pas.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import yaml from "js-yaml";
import { textHash, circuitOf } from "../build.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "content/documents");
const APPROB = path.join(ROOT, "content/approbations.json");
const OUT = path.join(ROOT, "build", "adoptes.json");
const URL_ = (process.env.SUPABASE_URL || "").replace(/\/$/, ""), KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!URL_ || !KEY) { console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires."); process.exit(1); }
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };
const api = async (p, opt = {}) => { const r = await fetch(URL_ + "/rest/v1/" + p, { ...opt, headers: { ...H, ...(opt.headers || {}) } }); const t = await r.text(); if (!r.ok) throw new Error(r.status + " " + t); return t ? JSON.parse(t) : null; };
const setKv = (p, data) => api("kv?on_conflict=path", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ path: p, data }) });
const norm = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : Array.isArray(v) ? v.map(norm) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, norm(x)])) : v);
const writeFm = (f, data, content) => fs.writeFileSync(f, "---\n" + yaml.dump(norm(data), { lineWidth: -1, quotingType: '"', noRefs: true }) + "---\n" + content.replace(/^\n?/, "\n"));
const copyDir = (src, dst) => { fs.mkdirSync(dst, { recursive: true }); for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s = path.join(src, e.name), d = path.join(dst, e.name); if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } };
const typeKey = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const FLABEL = { pca: "Président du Conseil d'Administration", adm: "Administrateur (membre du Conseil)", dg: "Directeur Général", rcci: "RCCI", dcom: "Directeur Commercial", dmc: "Directeur des Marchés de Capitaux", redac: "Rédacteur", collab: "Collaborateur" };

if (process.argv.includes("--confirmer")) {
  const list = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
  for (const a of list) { await setKv("adoptions/" + a.id + "~" + a.empreinte, { statut: "adopte", version: a.version, date: a.date, traite_le: new Date().toISOString() }); console.log(a.id + " : adoption publiée (v" + a.version + ")."); }
  process.exit(0);
}

const kv = await api("kv?select=path,data&or=(path.like.figes%2F*,path.like.circuits%2F*,path.like.sig%2F*,path.like.etats%2F*,path.like.adoptions%2F*)");
const membres = await api("membres?select=user_id,fonctions,actif");
const byPrefix = (pre) => kv.filter((r) => r.path.startsWith(pre));
const figes = Object.fromEntries(byPrefix("figes/").map((r) => [r.path.slice(6), r.data]));
const circuits = Object.fromEntries(byPrefix("circuits/").map((r) => [r.path.slice(9), r.data]));
const etats = Object.fromEntries(byPrefix("etats/").map((r) => [r.path.slice(6), r.data]));
const sigs = byPrefix("sig/").map((r) => ({ ...r.data, by: r.path.split("/")[1] }));
const hasRole = (uid, role) => membres.some((m) => m.user_id === uid && m.actif && (m.fonctions || []).includes(role));
const holders = (role) => membres.filter((m) => m.user_id && m.actif && (m.fonctions || []).includes(role)).map((m) => m.user_id);
const normStep = (s) => ({ etape: s.etape, label: s.label, role: s.role, fonction: s.fonction || FLABEL[s.role] || s.role, regle: s.regle || "un", obligatoire: s.obligatoire !== false, seance: s.seance != null ? !!s.seance : s.etape === "adoption" });

const approb = fs.existsSync(APPROB) ? JSON.parse(fs.readFileSync(APPROB, "utf8")) : {};
const adoptes = [];
for (const id of fs.readdirSync(DOCS).sort()) {
  const root = path.join(DOCS, id), vig = path.join(root, "vigueur"), file = path.join(root, "document.md");
  if (!fs.existsSync(file)) continue;
  const { data: fm, content } = matter(fs.readFileSync(file, "utf8"));
  if (fm.statut === "En vigueur" && !fs.existsSync(vig)) continue; // rien en attente
  if (etats[id] && ["abroge", "supprime"].includes(etats[id].statut)) continue;
  const emp = textHash(root);
  const f = figes[id + "~" + emp], c = circuits[typeKey(fm.type)];
  const steps = (f && f.etapes && f.etapes.length ? f.etapes : c && c.etapes && c.etapes.length ? c.etapes : circuitOf(fm)).map(normStep);
  if (!steps.some((s) => s.obligatoire)) continue;
  if (sigs.some((s) => s.doc === id && s.etape === "renvoi" && s.empreinte === emp)) continue;
  const etat = steps.map((st) => {
    const v = sigs.filter((s) => s.doc === id && s.etape === st.etape && s.empreinte === emp && hasRole(s.by, st.role)).sort((a, b) => (a.at < b.at ? -1 : 1));
    const by = [...new Set(v.map((s) => s.by))], h = holders(st.role);
    const need = st.regle === "tous" ? Math.max(1, h.length) : st.regle === "majorite" ? Math.floor(h.length / 2) + 1 : 1;
    return { st, v, done: by.length >= need };
  });
  if (!etat.every((x) => x.done || !x.st.obligatoire)) continue;
  // Décision : la dernière étape obligatoire (date de séance si elle en porte une)
  const last = etat.filter((x) => x.st.obligatoire).pop();
  const dsig = last.v[last.v.length - 1];
  const date = (dsig.seance || String(dsig.at)).slice(0, 10);
  const nouvelle = String(fm.version).startsWith("0.") ? "1.0" : String(fm.version);
  const decideur = last.st.seance ? "Conseil d'Administration" : last.st.fonction;
  const hist = (fm.historique || []).map((h) => ({ ...h }));
  if (String(fm.version).startsWith("0.")) hist.unshift({ version: nouvelle, date, objet: "Adoption" + (last.st.seance ? ` par le Conseil d'Administration (séance du ${date}${dsig.pv ? ", " + dsig.pv : ""})` : ` (${last.st.label.toLowerCase()} : ${decideur})`), par: decideur, nature: "revision", empreinte: emp });
  else if (hist[0]) hist[0].empreinte = emp;
  if (fs.existsSync(vig)) {
    const old = matter(fs.readFileSync(path.join(vig, "document.md"), "utf8")).data;
    copyDir(vig, path.join(ROOT, "content/archives", id, "v" + old.version));
    fs.rmSync(vig, { recursive: true, force: true });
  }
  writeFm(file, { ...fm, version: nouvelle, statut: "En vigueur", date_approbation: date, date_effet: fm.date_effet || date, historique: hist }, content);
  // Visas repris dans la fiche de maîtrise des PDF
  const rec = { _circuit: steps.map((s) => ({ etape: s.etape, label: s.label, fonction: s.fonction })), _decision: { date } };
  for (const x of etat) if (x.v.length) { const s = x.v[x.v.length - 1]; rec[x.st.etape] = { date: (s.seance || String(s.at)).slice(0, 10), at: s.at, role: s.role, ...(s.seance ? { seance: s.seance } : {}), ...(s.pv ? { pv: s.pv } : {}) }; }
  (approb[id] ||= {})[emp] = rec;
  adoptes.push({ id, empreinte: emp, version: nouvelle, date });
  console.log(`${id} adopté : v${nouvelle} en vigueur depuis le ${date} (empreinte ${emp}).`);
}
fs.writeFileSync(APPROB, JSON.stringify(approb, null, 2));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(adoptes));
// Demandes d'adoption sans suite (circuit incomplet, texte modifié entre-temps) : closes, pour ne pas relancer la publication chaque heure
for (const r of byPrefix("adoptions/").filter((r) => r.data && r.data.statut === "demande")) {
  const [id, emp] = r.path.slice(10).split("~");
  if (!adoptes.some((a) => a.id === id && a.empreinte === emp)) await setKv(r.path, { ...r.data, statut: "sans_suite", traite_le: new Date().toISOString() });
}
console.log(adoptes.length + " document(s) adopté(s).");
