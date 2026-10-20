// Générateur du référentiel documentaire Purpose Capital S.A.
// Source : content/ (Markdown + YAML)  →  dist/index.html + dist/pdf/*.pdf
// Usage : node build.mjs            (tout)
//         node build.mjs --no-pdf   (HTML seul, réutilise les PDF existants)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import yaml from "js-yaml";
import { Marked } from "marked";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { createRequire } from "node:module";
import { docxCorps, docxAnnexe, docxModeleVierge, langue } from "./templates/docx.mjs";
import JSZip from "jszip";
// Rend un .docx reproductible : dates du paquet et des propriétés fixées à la date de la version
async function docxFixe(buf, d) {
  const iso = (d.historique[0] && d.historique[0].date ? d.historique[0].date : "2026-01-01") + "T00:00:00Z";
  const z = await JSZip.loadAsync(buf), date = new Date(iso);
  const core = z.file("docProps/core.xml");
  if (core) z.file("docProps/core.xml", (await core.async("string")).replace(/(<dcterms:(created|modified)[^>]*>)[^<]*/g, "$1" + iso.replace(".000", "")), { date });
  // identifiants aléatoires des liens hypertextes -> identifiants stables
  const docF = z.file("word/document.xml"), relF = z.file("word/_rels/document.xml.rels");
  if (docF && relF) {
    let doc = await docF.async("string"), rel = await relF.async("string"); const map = {}; let n = 0;
    doc = doc.replace(/rId[a-z0-9_-]{12,}/g, (m) => (map[m] ||= "rIdLien" + ++n));
    rel = rel.replace(/rId[a-z0-9_-]{12,}/g, (m) => map[m] || m);
    z.file("word/document.xml", doc, { date }); z.file("word/_rels/document.xml.rels", rel, { date });
  }
  z.forEach((p, f) => { f.date = date; });
  return z.generateAsync({ type: "nodebuffer", compression: "DEFLATE", date });
}
const Engine = createRequire(import.meta.url)("./templates/engine.cjs");

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const P = (...p) => path.join(ROOT, ...p);
const read = (f) => fs.readFileSync(f, "utf8");
import { createHash } from "node:crypto";
const APPROB_FILE = P("content/approbations.json");
const APPROB = fs.existsSync(APPROB_FILE) ? JSON.parse(read(APPROB_FILE)) : {};
const NO_PDF = process.argv.includes("--no-pdf");

const cfg = yaml.load(read(P("content/referentiel.yaml")));
// Version anglaise des données communes (glossaire, textes de référence, documents prévus) : traduction de courtoisie
const cfgEn = fs.existsSync(P("content/en/referentiel.yaml")) ? yaml.load(read(P("content/en/referentiel.yaml"))) : null;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const iso = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v) : "");
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const frDate = (s) => { if (!s) return ""; const [y, m, d] = s.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${y}`; };
const TODAY = new Date().toISOString().slice(0, 10);
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const enDate = (s) => { if (!s) return ""; const [y, m, d] = s.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const dDate = (d, s) => (d && d.lang === "en" ? enDate(s) : frDate(s));

// ---------- Markdown → HTML avec sommaire ----------
function renderMarkdown(md) {
  const toc = [];
  const m = new Marked({
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        let id = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (depth === 2) {
          const t = text.match(/^(?:Titre|Title)\s+([IVXLC]+)\s+—\s+(.+)$/);
          if (t) id = "titre-" + t[1].toLowerCase();
          toc.push({ id, label: t ? `${t[1]}. ${t[2]}` : text, articles: [] });
        } else if (depth === 3) {
          const a = text.match(/^Article\s+(\d+)/);
          if (a) id = "art-" + a[1];
          if (toc.length) toc[toc.length - 1].articles.push({ id, n: a ? a[1] : "", label: text });
        }
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
    },
  });
  const html = m.parse(md).replace(/<p><em>ci-après/g, '<p class="party-role"><em>ci-après');
  return { html, toc };
}

// ---------- Circuit de visas ----------
// Qui vise quoi, déduit des champs verifie_par et approuve_par du document.
const roleOf = (t = "") => /Conseil d'Administration/i.test(t) ? "pca" : /Directeur Général/i.test(t) ? "dg" : /RCCI|conformité/i.test(t) ? "rcci"
  : /Directeur Commercial/i.test(t) ? "dcom" : /Marchés de Capitaux/i.test(t) ? "dmc" : null;
export const circuitOf = (fm) => {
  const out = [];
  const v = roleOf(fm.verifie_par); if (v) out.push({ etape: "verification", label: "Vérification", fonction: fm.verifie_par, role: v });
  const a = roleOf(fm.approuve_par);
  if (a === "pca") out.push({ etape: "adoption", label: "Adoption par le Conseil d'Administration", fonction: "Conseil d'Administration (enregistrée par le Président)", role: "pca" });
  else if (a) out.push({ etape: "approbation", label: "Approbation", fonction: fm.approuve_par, role: a });
  return out;
};

// ---------- Lecture des documents ----------
const DOC_DIR = P("content/documents");
export const IMAGES = {}; // "ID/fichier" -> chemin sur disque
// Un document = la version en vigueur. Si une révision est en cours, la version en vigueur
// est figée dans vigueur/ et le texte de travail (racine du dossier) devient d.projet.
function loadVariant(base, fallbackHist) {
  const { data: fm, content } = matter(read(path.join(base, "document.md")));
  const schemaFile = path.join(base, "variables.yaml");
  const schema = fs.existsSync(schemaFile) ? yaml.load(read(schemaFile)) : null;
  const societe = cfg.societe;
  const asModel = (md) => Engine.render(md, schema || { sections: [] }, {}, "modele", { societe });
  // Images du document (dossier images/ à côté du texte) : servies sous img/<ID>/ par le site
  const { html: html0, toc } = renderMarkdown(asModel(content));
  const html = html0.replace(/src="images\/([^"]+)"/g, (m, f) => `src="img/${fm.id}/${f}"`);
  const imgDir = path.join(base, "images");
  if (fs.existsSync(imgDir)) for (const f of fs.readdirSync(imgDir)) IMAGES[`${fm.id}/${f}`] = path.join(imgDir, f);
  const annexDir = path.join(base, "annexes");
  const annexFiles = fs.existsSync(annexDir) ? fs.readdirSync(annexDir).filter((f) => f.endsWith(".md")).sort() : [];
  const annexes = annexFiles.map((f) => {
    const a = matter(read(path.join(annexDir, f)));
    return { ...a.data, num: f.match(/A(\d+)/)[1], html: renderMarkdown(asModel(a.content)).html, template: schema ? a.content : undefined };
  });
  // Empreinte du texte : corps du document, annexes et variables, sans le front-matter
  // (le passage de 0.9 à 1.0 ou la date d'approbation ne la modifient pas).
  const empreinte = textHash(base);
  const en = loadEn(base, fm, empreinte, annexes, societe);
  const historique = (fm.historique || []).map((h) => ({ ...h, date: iso(h.date), version: String(h.version) })).sort((a, b) => { const v = (x) => String(x.version).split(".").map(Number); const [a1, a2] = v(a), [b1, b2] = v(b); return (b1 - a1) || ((b2 || 0) - (a2 || 0)) || (a.date < b.date ? 1 : -1); });
  // Lectures toujours valables : celles faites sur le texte actuel, ou sur un texte antérieur
  // dont il ne diffère que par des corrections mineures (nature: mineure dans l'historique).
  const lectureOK = [empreinte];
  for (let i = 0; i < historique.length - 1 && historique[i].nature === "mineure"; i++) if (historique[i + 1].empreinte) lectureOK.push(historique[i + 1].empreinte);
  const revue = iso(fm.prochaine_revue);
  const ap = (APPROB[fm.id] || {})[empreinte] || {};
  return {
    ...fm,
    version: String(fm.version),
    date_approbation: iso(fm.date_approbation) || ((ap._decision || ap.adoption || ap.approbation || {}).date || ""),
    date_effet: iso(fm.date_effet),
    prochaine_revue_label: /^\d{4}-\d{2}-\d{2}$/.test(revue) ? frDate(revue) : revue || "—",
    historique, html, toc, annexes, empreinte, lectureOK,
    nature_revision: historique[0] && historique[0].nature === "mineure" ? "mineure" : "revision",
    circuit: circuitOf(fm),
    modele: schema ? { schema, template: content } : null,
    en,
    pdf: { file: `${fm.id}_v${fm.version}.pdf`, size: 0 },
    // Texte source (Markdown), publié à part dans dist/source/ pour l'édition en ligne ; retiré des données de la page
    _source: { id: fm.id, version: String(fm.version), statut: fm.statut, empreinte, titre: fm.titre, resume: fm.resume || "", body: content },
  };
}
// Traduction anglaise (courtoisie) : content/documents/<ID>/en/ — même structure que le texte français.
// « source » (en-tête) = empreinte du texte français traduit : si elle diffère, la traduction est signalée comme en retard.
function loadEn(base, fm, empreinte, annexesFr, societe) {
  const dir = path.join(base, "en");
  if (!fs.existsSync(path.join(dir, "document.md"))) return null;
  const { data: e, content } = matter(read(path.join(dir, "document.md")));
  const sf = path.join(dir, "variables.yaml");
  const schema = fs.existsSync(sf) ? yaml.load(read(sf)) : null;
  const asModel = (md) => Engine.render(md, schema || { sections: [] }, {}, "modele", { societe: { ...societe, ...(cfgEn && cfgEn.societe ? cfgEn.societe : {}) }, lang: "en" });
  const { html: h0, toc } = renderMarkdown(asModel(content));
  const html = h0.replace(/src="images\/([^"]+)"/g, (m, f) => `src="img/${fm.id}/${f}"`);
  const annexes = annexesFr.map((a) => {
    const f = path.join(dir, "annexes", "A" + a.num + ".md");
    if (!fs.existsSync(f)) return { titre: a.titre, nature: a.nature, renseigne_par: a.renseigne_par, conserve_par: a.conserve_par, frequence: a.frequence, html: a.html, manque: true };
    const x = matter(read(f));
    return { ...x.data, id: a.id, html: renderMarkdown(asModel(x.content)).html, template: schema ? x.content : undefined };
  });
  const hist = (e.historique || []);
  // Dictionnaire propre au document : ses textes courts apparaissent aussi dans les listes (registre, tableau de bord…)
  const dict = {};
  const add = (fr, en) => { if (fr && en && typeof fr === "string" && typeof en === "string" && fr !== en) dict[fr.replace(/\s+/g, " ").trim()] = en; };
  add(fm.titre, e.titre); add(fm.resume, e.resume); add(fm.diffusion, e.diffusion);
  (fm.references || []).forEach((r, i) => add(r.articles, ((e.references || [])[i] || {}).articles));
  (fm.historique || []).forEach((h, i) => { add(h.objet, (hist[i] || {}).objet); add(h.par, (hist[i] || {}).par); });
  (fm.notes_redaction || []).forEach((n, i) => add(n, (e.notes_redaction || [])[i]));
  annexesFr.forEach((a, i) => { const b = annexes[i]; for (const k of ["titre", "nature", "renseigne_par", "conserve_par", "frequence"]) add(a[k], b[k]); });
  return {
    titre: e.titre, resume: e.resume || "", diffusion: e.diffusion || fm.diffusion, html, toc, annexes,
    references: e.references || [], historique: hist.map((h) => ({ objet: h.objet, par: h.par })), notes_redaction: e.notes_redaction || [],
    a_jour: e.source === empreinte, source: e.source || null,
    modele: schema ? { schema, template: content } : null, dict,
  };
}
export function textHash(base) {
  const { content } = matter(read(path.join(base, "document.md")));
  const hash = createHash("sha256").update(content);
  const annexDir = path.join(base, "annexes");
  if (fs.existsSync(annexDir)) fs.readdirSync(annexDir).filter((f) => f.endsWith(".md")).sort().forEach((f) => hash.update("\n@@" + f + "\n" + matter(read(path.join(annexDir, f))).content));
  const schemaFile = path.join(base, "variables.yaml");
  if (fs.existsSync(schemaFile)) hash.update("\n@@variables\n" + read(schemaFile));
  return hash.digest("hex").slice(0, 16);
}
const docs = fs.readdirSync(DOC_DIR).filter((d) => fs.existsSync(path.join(DOC_DIR, d, "document.md"))).sort().map((dir) => {
  const root = path.join(DOC_DIR, dir), vig = path.join(root, "vigueur");
  if (fs.existsSync(path.join(vig, "document.md"))) {
    const d = loadVariant(vig);
    d.projet = loadVariant(root);
    d.projet.estProjet = true;
    return d;
  }
  return loadVariant(root);
});
const ONLY = process.env.ONLY;
const variants0 = docs.flatMap((d) => (d.projet ? [d, d.projet] : [d]));
const variants = ONLY ? variants0.filter((d) => d.id === ONLY) : variants0;
for (const d of variants0) {
  d.pdfCorps = { file: `${d.id}_v${d.version}_sans-annexes.pdf`, size: 0 };
  d.word = { file: `${d.id}_v${d.version}.docx`, size: 0 };
  for (const a of d.annexes) { a.pdf = { file: `${a.id}_v${d.version}.pdf`, size: 0 }; a.word = { file: `${a.id}_v${d.version}.docx`, size: 0 }; }
  if (d.en) {
    d.en.pdf = { file: `${d.id}_v${d.version}_EN.pdf`, size: 0 }; d.en.pdfCorps = { file: `${d.id}_v${d.version}_sans-annexes_EN.pdf`, size: 0 }; d.en.word = { file: `${d.id}_v${d.version}_EN.docx`, size: 0 };
    d.en.annexes.forEach((x, i) => { const a = d.annexes[i]; x.pdf = { file: `${a.id}_v${d.version}_EN.pdf`, size: 0 }; x.word = { file: `${a.id}_v${d.version}_EN.docx`, size: 0 }; });
  }
}
// Vue anglaise d'un document, pour produire ses PDF et Word anglais avec les mêmes gabarits
const UI_EN = () => (globalThis.__uiEn ||= i18nDict().dict);
const L = (d, s) => (d && d.lang === "en" ? (UI_EN()[s] !== undefined ? UI_EN()[s] : s) : s);
function vueEn(d) {
  const e = d.en;
  return {
    ...d, lang: "en", titre: e.titre, resume: e.resume, diffusion: e.diffusion, html: e.html, toc: e.toc,
    historique: d.historique.map((h, i) => ({ ...h, objet: (e.historique[i] || {}).objet || h.objet, par: (e.historique[i] || {}).par || h.par })),
    references: (d.references || []).map((r, i) => ({ ...r, articles: (e.references[i] || {}).articles || r.articles })),
    annexes: d.annexes.map((a, i) => ({ ...a, ...e.annexes[i], id: a.id, num: a.num, orientation: a.orientation, pdf: e.annexes[i].pdf, word: e.annexes[i].word })),
    pdf: e.pdf, pdfCorps: e.pdfCorps, word: e.word,
  };
}

// ---------- Word ----------
async function buildWord() {
  if (!ONLY) fs.rmSync(P("dist/word"), { recursive: true, force: true });
  fs.mkdirSync(P("dist/word"), { recursive: true });
  for (const d of variants.flatMap((v) => (v.en ? [v, vueEn(v)] : [v]))) {
    langue(d.lang || "fr", UI_EN());
    // Le service de publication ne sert pas les .docx : chaque Word est publié encodé en base64
    // dans un .txt, et la page le décode avant de le proposer au téléchargement.
    // Données de la fiche de maîtrise : visas électroniques et textes de référence
    const fiche = { images: IMAGES, approb: (APPROB[d.id] || {})[d.empreinte] || {}, refs: (d.references || []).map((r) => ({ titre: refTitle(r.ref, d), articles: r.articles })) };
    fs.writeFileSync(P("dist/word", d.word.file + ".txt"), (await docxFixe(await docxCorps(d, fiche), d)).toString("base64"));
    for (const a of d.annexes) fs.writeFileSync(P("dist/word", a.word.file + ".txt"), (await docxFixe(await docxAnnexe(d, a), d)).toString("base64"));
  }
  langue("fr");
  // Modèle Word vierge pour rédiger un nouveau document hors ligne, puis l'importer
  fs.writeFileSync(P("dist/word", "MODELE-VIERGE.docx.txt"), (await docxModeleVierge()).toString("base64"));
  console.log("WORD", fs.readdirSync(P("dist/word")).length, "fichiers");
}
const liveIds = new Set(docs.map((d) => d.id));
const prevus = (cfg.prevus || []).filter((p) => !liveIds.has(p.id));

// ---------- PDF ----------
const fontFace = [
  ["Inter", 400, "inter/files/inter-latin-400-normal.woff2"],
  ["Inter", 500, "inter/files/inter-latin-500-normal.woff2"],
  ["Inter", 600, "inter/files/inter-latin-600-normal.woff2"],
  ["Playfair Display", 600, "playfair-display/files/playfair-display-latin-600-normal.woff2"],
  ["Playfair Display", 700, "playfair-display/files/playfair-display-latin-700-normal.woff2"],
].map(([f, w, file]) => `@font-face{font-family:"${f}";font-weight:${w};font-style:normal;src:url("file://${P("node_modules/@fontsource", file)}") format("woff2");}`).join("\n");
const PRINT_CSS = fontFace + "\n" + read(P("templates/print.css")) + "\n" + read(P("templates/content.css"));
const page = (body, cls = "", extra = "", lang = "fr") => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${PRINT_CSS}${extra}</style></head><body class="${cls}">${body}</body></html>`;

const isDraft = (d) => d.statut !== "En vigueur";
const watermark = (d) => (isDraft(d) ? `<div class="watermark">${esc(L(d, d.statut).toUpperCase())}</div>` : "");
const refEn = (k) => (cfgEn && cfgEn.references && cfgEn.references[k]) || {};
const refTitle = (k, d) => (d && d.lang === "en" && refEn(k).titre) || cfg.references[k]?.titre || k;
const refCell = (k, d) => {
  const t = cfg.references[k]; if (!t) return esc(k);
  const en = d && d.lang === "en" ? refEn(k) : {};
  if (!t.lien) return esc(en.titre || t.titre);
  const host = t.lien.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  return `<a href="${esc(t.lien)}" style="color:#0E4C86;text-decoration:none">${esc(en.titre || t.titre)}</a><br><span style="color:#5B6B80;font-size:7pt">${esc(en.lien_type || L(d, t.lien_type || "Lien"))} · ${esc(host)}</span>`;
};

function coverHtml(d) {
  // Dates et visas : uniquement dans la fiche de maîtrise (pas de doublon sur la page de garde)
  const rows = [[L(d, "Propriétaire"), L(d, d.proprietaire)], [L(d, "Prochaine revue"), L(d, d.prochaine_revue_label)], [L(d, "Confidentialité"), L(d, d.confidentialite)]];
  return `<div class="cover">${watermark(d)}
  <div class="cover-band"><div class="wordmark">PURPOSE CAPITAL</div><div class="wordmark-rule"></div><div class="wordmark-sub">${L(d, "Référentiel documentaire")} · ${esc(cfg.societe.raison_sociale)}</div></div>
  <div class="cover-main">
    <div class="cover-eyebrow">${esc(L(d, d.type))} · ${esc(L(d, d.domaine))}</div>
    <div class="cover-title">${esc(d.titre)}</div>
    <div class="cover-ref">${L(d, "Référence")} <b>${esc(d.id)}</b> &nbsp;·&nbsp; Version <b>${esc(d.version)}</b><span class="cover-status">${esc(L(d, d.statut))}</span></div>
    <table class="cover-meta">${rows.map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join("")}</table>
  </div>
  <div class="cover-foot">
    <div><strong>${esc(cfg.societe.raison_sociale)}</strong></div>
    <div style="text-align:right">${d.lang === "en" ? `Controlled document: only the version published<br>in the online repository is authoritative.<br>Courtesy translation — the French version prevails.<br>Issued on ${enDate(TODAY)}` : `Document maîtrisé : seule la version publiée<br>dans le référentiel en ligne fait foi.<br>Édité le ${frDate(TODAY)}`}</div>
  </div></div>`;
}

function annexBlock(d, a, standalone) {
  return `<div${standalone ? "" : ` id="annexe-${a.num}"`} class="annex${standalone ? "" : " page-break"}${!standalone && a.orientation === "paysage" ? " annex-landscape" : ""}">
  <div class="annex-head"><div>${standalone ? '<div class="mini-mark">PURPOSE CAPITAL<i></i></div><div style="height:2mm"></div>' : ""}
    <div class="annex-eyebrow">${d.lang === "en" ? `Appendix ${a.num} to ${esc(L(d, d.type).toLowerCase())} ${esc(d.id)}` : `Annexe ${a.num} au ${esc(d.type.toLowerCase())} ${esc(d.id)}`} · ${esc(a.nature)}</div>
    <div class="annex-title">${esc(a.titre)}</div></div>
    <div class="annex-ref">${d.lang === "en" ? "Ref." : "Réf."} <b>${esc(a.id)}</b><br>Version ${esc(d.version)}<br>${esc(L(d, d.confidentialite))}</div></div>
  <div class="annex-usage"><span><b>${L(d, "Renseigné par")}</b> ${esc(a.renseigne_par)}</span><span><b>${L(d, "Fréquence")}</b> ${esc(a.frequence)}</span><span><b>${L(d, "Conservé par")}</b> ${esc(a.conserve_par)}</span></div>
  <div class="doc-body">${a.html}</div></div>`;
}

function bodyHtml(d, withAnnexes = true) {
  const ap = (APPROB[d.id] || {})[d.empreinte] || {};
  // Une ligne par étape : visa électronique (date, empreinte) et case de signature manuscrite, pour l'exemplaire papier
  const visa = (e, sans) => sans ? `<td class="visa na" colspan="2"></td>` : `<td class="visa">${e ? `${dDate(d, e.date)}<br><small>${L(d, "Visa électronique")} · ${L(d, "empreinte")} ${esc(d.empreinte)}</small>` : ""}</td><td class="visa sig-box"><small>${L(d, "Date et signature")}</small></td>`;
  const step = (k, v, e, sans) => `<tr><td>${esc(L(d, k))}</td><td>${esc(L(d, v))}</td>${visa(e, sans)}</tr>`;
  const control = `<section class="control">
  <h1>${L(d, "Fiche de maîtrise documentaire")}</h1>${d.lang === "en" ? '<p style="font-size:8pt;color:#5B6B80;margin:-2mm 0 3mm">Courtesy translation — the French version prevails.</p>' : ""}
  <table class="ctable"><tbody>
    <tr><th style="width:30%">${L(d, "Référence")}</th><td>${esc(d.id)}</td><th style="width:20%">Version</th><td>${esc(d.version)} — ${esc(L(d, d.statut))}</td></tr>
    <tr><th>${L(d, "Titre")}</th><td colspan="3">${esc(d.titre)}</td></tr>
    <tr><th>${d.lang === "en" ? "Type · domain" : "Type · domaine"}</th><td>${esc(L(d, d.type))} · ${esc(L(d, d.domaine))}</td><th>${L(d, "Confidentialité")}</th><td>${esc(L(d, d.confidentialite))}</td></tr>
    <tr><th>${L(d, "Propriétaire")}</th><td colspan="3">${esc(L(d, d.proprietaire))}</td></tr>
    <tr><th>${L(d, "Diffusion")}</th><td colspan="3">${esc(d.diffusion)}</td></tr>
    <tr><th>${L(d, "Date d'effet")}</th><td>${d.date_effet ? dDate(d, d.date_effet) : L(d, "À l'adoption")}</td><th>${L(d, "Prochaine revue")}</th><td>${esc(L(d, d.prochaine_revue_label))}</td></tr>
  </tbody></table>
  <h4>${L(d, "Circuit d'approbation")}</h4>
  <table class="ctable"><thead><tr><th style="width:17%">${L(d, "Étape")}</th><th>${L(d, "Fonction")}</th><th style="width:27%">${L(d, "Visa électronique")}</th><th style="width:24%">${L(d, "Signature manuscrite")}</th></tr></thead><tbody>
    ${step("Rédaction", d.redige_par, null, true)}${ap._circuit ? ap._circuit.map((c) => step(c.label, c.fonction, ap[c.etape])).join("") : step("Vérification", d.verifie_par, ap.verification) + step("Approbation", d.approuve_par, ap.adoption || ap.approbation)}
  </tbody></table>
  <h4>${L(d, "Historique des révisions")}</h4>
  <table class="ctable"><thead><tr><th style="width:12%">Version</th><th style="width:22%">Date</th><th>${L(d, "Objet")}</th><th style="width:18%">${L(d, "Par")}</th></tr></thead><tbody>
    ${d.historique.map((h) => `<tr><td>${esc(h.version)}</td><td>${dDate(d, h.date)}</td><td>${esc(h.objet)}</td><td>${esc(L(d, h.par))}</td></tr>`).join("")}
  </tbody></table>
  <h4>${L(d, "Textes de référence")}</h4>
  <table class="ctable"><tbody>${(d.references || []).map((r) => `<tr><td style="width:52%">${refCell(r.ref, d)}</td><td>${esc(r.articles)}</td></tr>`).join("")}</tbody></table>
</section>`;
  // Sommaire sur une page dédiée, cliquable (titres et articles) ; chaque titre commence une nouvelle page
  const toc = `<section class="toc-page"><h1>${L(d, "Sommaire")}</h1><ol class="toc2">${d.toc.map((t) => `<li><a href="#${t.id}">${esc(t.label)}</a>${t.articles.length ? `<ol>${t.articles.map((a) => `<li><a href="#${a.id}">${esc(a.label)}</a></li>`).join("")}</ol>` : ""}</li>`).join("")}${withAnnexes && d.annexes.length ? `<li class="annexes">${L(d, "Annexes")}<ol>${d.annexes.map((a) => `<li><a href="#annexe-${a.num}">${d.lang === "en" ? "Appendix" : "Annexe"} ${a.num} — ${esc(a.titre)}</a></li>`).join("")}</ol></li>` : ""}${!withAnnexes && d.annexes.length ? `<li class="annexes">${d.lang === "en" ? "Appendices published separately" : "Annexes publiées séparément"}</li>` : ""}</ol></section>`;
  // Un titre ou un article n'est jamais laissé seul en bas de page : il reste avec le paragraphe qui le suit
  const body = d.html.replace(/src="img\/([^"]+)"/g, (m, k) => IMAGES[k] ? `src="data:image/${path.extname(k).slice(1).replace("jpg", "jpeg")};base64,${fs.readFileSync(IMAGES[k]).toString("base64")}"` : m).replace(/((?:<h[234][^>]*>[\s\S]*?<\/h[234]>\s*)+)(<p[\s>][\s\S]*?<\/p>)?/g, (m, hs, p) => `<div class="keep${/<h2/.test(hs) ? " t1" : ""}">${hs}${p || ""}</div>`);
  return `${watermark(d)}${control}${toc}<div class="doc-body">${body}</div>${withAnnexes ? d.annexes.map((a) => annexBlock(d, a, false)).join("") : ""}`;
}

const hf = (d, label) => ({
  headerTemplate: `<div style="width:100%;margin:0 18mm 0 20mm;padding-bottom:5px;border-bottom:0.5px solid #D5DEE9;font-family:Helvetica,Arial,sans-serif;font-size:6.8pt;color:#5B6B80;display:flex;justify-content:space-between;-webkit-print-color-adjust:exact"><span><span style="color:#0B2E52;font-weight:bold;letter-spacing:1.4px">PURPOSE CAPITAL</span>&nbsp;&nbsp;·&nbsp;&nbsp;${esc(label)}</span><span>Version ${esc(d.version)} · ${esc(L(d, d.statut))}</span></div>`,
  footerTemplate: `<div style="width:100%;margin:0 18mm 0 20mm;font-family:Helvetica,Arial,sans-serif;font-size:6.5pt;color:#5B6B80;display:flex;justify-content:space-between"><span>${d.lang === "en" ? "Uncontrolled printed copy — only the online version is authoritative" : "Version imprimée non maîtrisée — seule la version en ligne fait foi"} · ${esc(L(d, d.confidentialite))}</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
const MARGIN = { top: "22mm", bottom: "18mm", left: "20mm", right: "18mm" };
const ANNEX_MARGIN = { top: "17mm", bottom: "14mm", left: "18mm", right: "16mm" };

// Métadonnées fixes : un document inchangé produit un fichier identique d'une génération à l'autre
const fixe = (pdf, d) => {
  const dt = new Date((d.historique[0] && d.historique[0].date ? d.historique[0].date : "2026-01-01") + "T00:00:00Z");
  pdf.setCreationDate(dt); pdf.setModificationDate(dt); pdf.setProducer("Référentiel Purpose Capital"); pdf.setCreator("build.mjs");
};
async function buildPdfs() {
  fs.mkdirSync(P("dist/pdf"), { recursive: true });
  fs.mkdirSync(P("build"), { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const render = async (html, name, opts) => {
    const f = P("build", name + ".html");
    fs.writeFileSync(f, html);
    await pg.goto("file://" + f, { waitUntil: "load" });
    await pg.evaluate(() => document.fonts.ready);
    return pg.pdf({ format: "A4", printBackground: true, ...opts });
  };
  for (const d of variants.flatMap((v) => (v.en ? [v, vueEn(v)] : [v]))) {
    const cover = await render(page(coverHtml(d), "", "@page{margin:0}", d.lang || "fr"), d.id + "-cover", { margin: { top: 0, bottom: 0, left: 0, right: 0 } });
    const body = await render(page(bodyHtml(d), "", "", d.lang || "fr"), d.id + (d.lang ? "-en" : "") + "-body", { displayHeaderFooter: true, margin: MARGIN, outline: true, tagged: true, ...hf(d, `${d.id} — ${d.titre}`) });
    // La couverture est insérée dans le PDF du corps : liens du sommaire et signets restent valables
    const coverDoc = await PDFDocument.load(cover);
    const out = await PDFDocument.load(body);
    out.insertPage(0, (await out.copyPages(coverDoc, [0]))[0]);
    out.setTitle(`${d.id} — ${d.titre} (v${d.version})`); out.setAuthor(cfg.societe.raison_sociale); out.setSubject(`${L(d, d.type)} · ${L(d, d.statut)}`); if (d.lang === "en") out.setLanguage("en-GB"); fixe(out, d);
    const bytes = await out.save();
    fs.writeFileSync(P("dist/pdf", d.pdf.file), bytes);
    console.log("PDF", d.pdf.file, (bytes.length / 1024).toFixed(0) + " Ko");
    // Version sans annexes : couverture, fiche de maîtrise et corps seuls, numérotation propre
    const bodyOnly = await render(page(bodyHtml(d, false), "", "", d.lang || "fr"), d.id + (d.lang ? "-en" : "") + "-corps", { displayHeaderFooter: true, margin: MARGIN, outline: true, tagged: true, ...hf(d, `${d.id} — ${d.titre}`) });
    const out2 = await PDFDocument.load(bodyOnly);
    out2.insertPage(0, (await out2.copyPages(coverDoc, [0]))[0]);
    out2.setTitle(`${d.id} — ${d.titre} (v${d.version}, ${d.lang === "en" ? "without appendices" : "sans annexes"})`); out2.setAuthor(cfg.societe.raison_sociale); fixe(out2, d);
    fs.writeFileSync(P("dist/pdf", d.pdfCorps.file), await out2.save());
    for (const a of d.annexes) {
      const land = a.orientation === "paysage";
      const buf = await render(page(watermark(d) + annexBlock(d, a, true), land ? "landscape" : "", "", d.lang || "fr"), a.id + (d.lang ? "-en" : ""), {
        displayHeaderFooter: true, landscape: land, margin: ANNEX_MARGIN, ...hf(d, d.lang === "en" ? `${a.id} — Appendix ${a.num} to ${d.id}` : `${a.id} — Annexe ${a.num} au ${d.id}`),
      });
      const doc = await PDFDocument.load(buf);
      doc.setTitle(`${a.id} — ${a.titre}`); doc.setAuthor(cfg.societe.raison_sociale); fixe(doc, d);
      const ab = await doc.save();
      fs.writeFileSync(P("dist/pdf", a.pdf.file), ab);
      console.log("PDF", a.pdf.file, (ab.length / 1024).toFixed(0) + " Ko");
    }
  }
  if (!ONLY) for (const lang of ["fr", "en"]) await buildManuel(render, lang);
  await browser.close();
}

// ---------- Manuel des procédures : assemblage des documents en vigueur (ou en projet), dans l'ordre de la cartographie ----------
// Il n'est pas rédigé à part : il est reconstruit à chaque publication à partir des mêmes sources.
export const MANUEL_ORDRE = ["PC-COD-004", "PC-PRO-GOV-001", "PC-PRO-KYC-001", "PC-PRO-ORD-001", "PC-PRO-PMR-001", "PC-PRO-SEG-001", "PC-PRO-REC-001", "PC-PRO-OPP-001", "PC-PRO-COM-001", "PC-PRO-CPT-001", "PC-PRO-REP-001", "PC-PRO-ARC-001", "PC-PRO-INC-001"];
export const MANUEL = { fr: { file: "Manuel-des-procedures.pdf", size: 0 }, en: { file: "Procedures-manual_EN.pdf", size: 0 } };
function manuelDocs() {
  const ids = MANUEL_ORDRE.concat(docs.map((d) => d.id).filter((id) => /^PC-PRO-/.test(id) && !MANUEL_ORDRE.includes(id)));
  return ids.map((id) => docs.find((d) => d.id === id)).filter(Boolean);
}
async function buildManuel(render, lang) {
  const list = manuelDocs().map((d) => (lang === "en" ? (d.en ? vueEn(d) : null) : d)).filter(Boolean);
  if (!list.length) return;
  const v = { lang: lang === "en" ? "en" : undefined, statut: "En vigueur", version: "", confidentialite: "Interne" };
  const pdfs = [];
  for (const d of list) { const f = P("dist/pdf", d.pdf.file); if (fs.existsSync(f)) pdfs.push({ d, doc: await PDFDocument.load(fs.readFileSync(f)) }); }
  let page = 3; const rows = pdfs.map((x, i) => { const r = { n: i + 1, d: x.d, page }; page += x.doc.getPageCount(); return r; });
  const EN = lang === "en";
  const html = `<div class="cover"><div class="cover-band"><div class="wordmark">PURPOSE CAPITAL</div><div class="wordmark-rule"></div><div class="wordmark-sub">${L(v, "Référentiel documentaire")} · ${esc(cfg.societe.raison_sociale)}</div></div>
  <div class="cover-main"><div class="cover-eyebrow">${EN ? "Compilation" : "Recueil"}</div><div class="cover-title">${EN ? "Procedures manual" : "Manuel des procédures"}</div>
  <div class="cover-ref">${EN ? "Assembled on" : "Assemblé le"} <b>${EN ? enDate(TODAY) : frDate(TODAY)}</b> · ${pdfs.length} ${EN ? "documents" : "documents"}</div>
  <p style="max-width:120mm;color:#B9C8DA;font-size:9.5pt;line-height:1.5;margin-top:10mm">${EN ? "This manual is assembled automatically from the documents published in the online repository: organisation and delegations, then each procedure in the order of the process map. Each document keeps its own version, status and control sheet. Courtesy translation — the French version prevails." : "Ce manuel est assemblé automatiquement à partir des documents publiés dans le référentiel en ligne : organisation et délégations, puis chaque procédure dans l'ordre de la cartographie des processus. Chaque document garde sa version, son statut et sa fiche de maîtrise."}</p></div>
  <div class="cover-foot"><div><strong>${esc(cfg.societe.raison_sociale)}</strong></div><div style="text-align:right">${EN ? "Uncontrolled copy: only the online version is authoritative." : "Copie non maîtrisée : seule la version en ligne fait foi."}</div></div></div>`;
  const cover = await render(page(html, "", "@page{margin:0}", lang), "manuel-cover-" + lang, { margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  const somm = `<section class="toc-page" style="break-after:auto"><h1>${EN ? "Contents" : "Sommaire"}</h1><table class="ctable"><thead><tr><th style="width:8%">N°</th><th style="width:22%">${EN ? "Reference" : "Référence"}</th><th>${EN ? "Document" : "Document"}</th><th style="width:16%">Version</th><th style="width:9%">Page</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.n}</td><td>${esc(r.d.id)}</td><td>${esc(r.d.titre)}</td><td>${esc(r.d.version)} · ${esc(L(r.d, r.d.statut))}</td><td>${r.page}</td></tr>`).join("")}</tbody></table></section>`;
  const sp = await render(page(somm, "", "", lang), "manuel-sommaire-" + lang, { margin: MARGIN });
  const out = await PDFDocument.create();
  for (const src of [await PDFDocument.load(cover), await PDFDocument.load(sp), ...pdfs.map((x) => x.doc)]) (await out.copyPages(src, src.getPageIndices())).forEach((pg) => out.addPage(pg));
  out.setTitle(EN ? "Purpose Capital — Procedures manual" : "Purpose Capital — Manuel des procédures"); out.setAuthor(cfg.societe.raison_sociale);
  const dt = new Date(TODAY + "T00:00:00Z"); out.setCreationDate(dt); out.setModificationDate(dt); out.setProducer("Référentiel Purpose Capital");
  const bytes = await out.save();
  fs.writeFileSync(P("dist/pdf", MANUEL[lang].file), bytes);
  console.log("PDF", MANUEL[lang].file, (bytes.length / 1024).toFixed(0) + " Ko", pdfs.length, "documents");
}

// ---------- Site ----------
function buildSite() {
  const size = (f) => (fs.existsSync(P("dist/pdf", f)) ? fs.statSync(P("dist/pdf", f)).size : 0);
  const wsize = (f) => (fs.existsSync(P("dist/word", f + ".txt")) ? Math.round(fs.statSync(P("dist/word", f + ".txt")).size * 3 / 4) : 0);
  for (const d of variants0) for (const v of d.en ? [d, d.en] : [d]) { v.pdf.size = size(v.pdf.file); v.pdfCorps.size = size(v.pdfCorps.file); v.word.size = wsize(v.word.file); for (const a of v.annexes) { a.pdf.size = size(a.pdf.file); a.word.size = wsize(a.word.file); } }
  // Textes sources pour l'édition en ligne : texte de travail (<ID>.json) et version en vigueur pendant une révision (<ID>.vigueur.json)
  fs.rmSync(P("dist/img"), { recursive: true, force: true });
  for (const [k, f] of Object.entries(IMAGES)) { fs.mkdirSync(path.dirname(P("dist/img", k)), { recursive: true }); fs.copyFileSync(f, P("dist/img", k)); }
  fs.rmSync(P("dist/source"), { recursive: true, force: true });
  fs.mkdirSync(P("dist/source"), { recursive: true });
  for (const d of docs) {
    if (d.projet) { fs.writeFileSync(P("dist/source", d.id + ".json"), JSON.stringify(d.projet._source)); fs.writeFileSync(P("dist/source", d.id + ".vigueur.json"), JSON.stringify(d._source)); }
    else fs.writeFileSync(P("dist/source", d.id + ".json"), JSON.stringify(d._source));
  }
  const strip = (d) => { const { _source, ...rest } = d; return d.projet ? { ...rest, projet: strip(d.projet) } : rest; };
  const manuel = { docs: manuelDocs().map((d) => d.id), fr: { ...MANUEL.fr, size: size(MANUEL.fr.file) }, en: { ...MANUEL.en, size: size(MANUEL.en.file) } };
  const data = { societe: cfg.societe, niveaux: cfg.niveaux, references: cfg.references, glossaire: cfg.glossaire, docs: docs.map(strip), prevus, generated: TODAY, manuel };
  const html = read(P("templates/index.tpl.html"))
    .replace("{{I18N_JS}}", () => i18nJs())
    .replace("{{SITE_CSS}}", () => read(P("templates/site.css")))
    .replace("{{CONTENT_CSS}}", () => read(P("templates/content.css")))
    .replaceAll("{{SOCIETE}}", esc(cfg.societe.raison_sociale))
    .replaceAll("{{AGREMENT}}", esc(cfg.societe.agrement))
    .replaceAll("{{SIEGE}}", esc(cfg.societe.siege))
    .replaceAll("{{GENERATED}}", frDate(TODAY))
    .replace("{{DATA}}", () => JSON.stringify(data).replace(/</g, "\\u003c"))
    .replace("{{ENGINE_JS}}", () => read(P("templates/engine.cjs")))
    .replace("{{SITE_JS}}", () => read(P("templates/site.js")).replace("/*GENERATOR*/", () => read(P("templates/generator.js"))).replace("/*VISAS*/", () => read(P("templates/visas.js"))).replace("/*SELECTION*/", () => read(P("templates/selection.js"))).replace("/*EDITEUR*/", () => read(P("templates/editeur.js"))).replace("/*TABLEAU*/", () => read(P("templates/tableau.js"))).replace("/*GUIDE*/", () => read(P("templates/guide.js"))));
  fs.writeFileSync(P("dist/index.html"), html);
  fs.writeFileSync(P("dist/i18n.js"), i18nJs());
  fs.mkdirSync(P("dist/fonts"), { recursive: true });
  for (const f of fs.readdirSync(P("templates/fonts"))) fs.copyFileSync(P("templates/fonts", f), P("dist/fonts", f));
  console.log("HTML dist/index.html", (html.length / 1024).toFixed(0) + " Ko");
}

if (process.argv[1] && process.argv[1].endsWith("build.mjs")) {
if (!NO_PDF) await buildPdfs();
await buildWord();
buildSite();
}

// Interface anglaise : moteur + dictionnaire (templates/i18n-en.json : chaînes de l'interface et motifs)
export function i18nDict() {
  // templates/i18n/*.tsv : « français<TAB>anglais » ; motifs.tsv : « expression<TAB>traduction » (lignes # ignorées)
  const dir = P("templates/i18n"), dict = {}, patterns = [];
  const lignes = (f) => fs.readFileSync(path.join(dir, f), "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => l.split("\t"));
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".tsv") && f !== "motifs.tsv").sort()) {
    for (const [fr, en] of lignes(f)) {
      if (en === undefined) { console.warn("i18n : ligne sans traduction dans " + f + " : " + fr); continue; }
      const k = fr.replace(/\s+/g, " ").trim();
      if (dict[k] !== undefined && dict[k] !== en.trim()) console.warn("i18n : traductions différentes pour « " + k + " »");
      dict[k] = en.trim();
    }
  }
  // Données communes traduites (glossaire, textes de référence, documents prévus, niveaux) : complètent le dictionnaire sans le remplacer
  if (cfgEn) {
    const add = (fr, en) => { if (typeof fr === "string" && typeof en === "string" && fr !== en) { const k = fr.replace(/\s+/g, " ").trim(); if (dict[k] === undefined) dict[k] = en; } };
    (cfg.glossaire || []).forEach((g, i) => { const e = (cfgEn.glossaire || [])[i] || {}; add(g.terme, e.terme); add(g.definition, e.definition); });
    for (const [k, r] of Object.entries(cfg.references || {})) { const e = (cfgEn.references || {})[k] || {}; add(r.titre, e.titre); add(r.objet, e.objet); add(r.emetteur, e.emetteur); add(r.lien_type, e.lien_type); }
    (cfg.prevus || []).forEach((p, i) => { const e = (cfgEn.prevus || [])[i] || {}; add(p.titre, e.titre); add(p.type, e.type); add(p.domaine, e.domaine); });
    (cfg.niveaux || []).forEach((n, i) => { const e = (cfgEn.niveaux || [])[i] || {}; for (const k of Object.keys(n)) add(n[k], e[k]); });
    if (cfgEn.societe) for (const k of Object.keys(cfgEn.societe)) add(cfg.societe[k], cfgEn.societe[k]);
  }
  if (fs.existsSync(path.join(dir, "motifs.tsv"))) for (const [re, en] of lignes("motifs.tsv")) { try { new RegExp(re); patterns.push([re, (en || "").trim()]); } catch (e) { console.warn("i18n : motif invalide " + re); } }
  return { dict, patterns };
}
function i18nJs() {
  const d = i18nDict();
  const js = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
  return fs.readFileSync(P("templates/i18n.js"), "utf8").replace("/*I18N_DICT*/{}", () => js(d.dict)).replace("/*I18N_PATTERNS*/[]", () => js(d.patterns));
}
