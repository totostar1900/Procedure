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
import { docxCorps, docxAnnexe } from "./templates/docx.mjs";
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
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const iso = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v) : "");
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const frDate = (s) => { if (!s) return ""; const [y, m, d] = s.split("-").map(Number); return `${d === 1 ? "1er" : d} ${MOIS[m - 1]} ${y}`; };
const TODAY = new Date().toISOString().slice(0, 10);

// ---------- Markdown → HTML avec sommaire ----------
function renderMarkdown(md) {
  const toc = [];
  const m = new Marked({
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        let id = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (depth === 2) {
          const t = text.match(/^Titre\s+([IVXLC]+)\s+—\s+(.+)$/);
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
// Un document = la version en vigueur. Si une révision est en cours, la version en vigueur
// est figée dans vigueur/ et le texte de travail (racine du dossier) devient d.projet.
function loadVariant(base, fallbackHist) {
  const { data: fm, content } = matter(read(path.join(base, "document.md")));
  const schemaFile = path.join(base, "variables.yaml");
  const schema = fs.existsSync(schemaFile) ? yaml.load(read(schemaFile)) : null;
  const societe = cfg.societe;
  const asModel = (md) => Engine.render(md, schema || { sections: [] }, {}, "modele", { societe });
  const { html, toc } = renderMarkdown(asModel(content));
  const annexDir = path.join(base, "annexes");
  const annexFiles = fs.existsSync(annexDir) ? fs.readdirSync(annexDir).filter((f) => f.endsWith(".md")).sort() : [];
  const annexes = annexFiles.map((f) => {
    const a = matter(read(path.join(annexDir, f)));
    return { ...a.data, num: f.match(/A(\d+)/)[1], html: renderMarkdown(asModel(a.content)).html, template: schema ? a.content : undefined };
  });
  // Empreinte du texte : corps du document, annexes et variables, sans le front-matter
  // (le passage de 0.9 à 1.0 ou la date d'approbation ne la modifient pas).
  const empreinte = textHash(base);
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
    pdf: { file: `${fm.id}_v${fm.version}.pdf`, size: 0 },
    // Texte source (Markdown), publié à part dans dist/source/ pour l'édition en ligne ; retiré des données de la page
    _source: { id: fm.id, version: String(fm.version), statut: fm.statut, empreinte, titre: fm.titre, resume: fm.resume || "", body: content },
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
}

// ---------- Word ----------
async function buildWord() {
  if (!ONLY) fs.rmSync(P("dist/word"), { recursive: true, force: true });
  fs.mkdirSync(P("dist/word"), { recursive: true });
  for (const d of variants) {
    // Le service de publication ne sert pas les .docx : chaque Word est publié encodé en base64
    // dans un .txt, et la page le décode avant de le proposer au téléchargement.
    fs.writeFileSync(P("dist/word", d.word.file + ".txt"), (await docxFixe(await docxCorps(d), d)).toString("base64"));
    for (const a of d.annexes) fs.writeFileSync(P("dist/word", a.word.file + ".txt"), (await docxFixe(await docxAnnexe(d, a), d)).toString("base64"));
  }
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
const page = (body, cls = "", extra = "") => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${PRINT_CSS}${extra}</style></head><body class="${cls}">${body}</body></html>`;

const isDraft = (d) => d.statut !== "En vigueur";
const watermark = (d) => (isDraft(d) ? `<div class="watermark">${esc(d.statut.toUpperCase())}</div>` : "");
const refTitle = (k) => cfg.references[k]?.titre || k;
const refCell = (k) => {
  const t = cfg.references[k]; if (!t) return esc(k);
  if (!t.lien) return esc(t.titre);
  const host = t.lien.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  return `<a href="${esc(t.lien)}" style="color:#0E4C86;text-decoration:underline">${esc(t.titre)}</a><br><span style="color:#5B6B80;font-size:7pt">${esc(t.lien_type || "Lien")} · ${esc(host)}</span>`;
};

function coverHtml(d) {
  const rows = [
    ["Propriétaire", d.proprietaire], ["Approuvé par", d.approuve_par],
    ["Date d'approbation", d.date_approbation ? frDate(d.date_approbation) : "À compléter à l'adoption"],
    ["Date d'effet", d.date_effet ? frDate(d.date_effet) : "À compléter à l'adoption"],
    ["Prochaine revue", d.prochaine_revue_label], ["Confidentialité", d.confidentialite],
  ];
  return `<div class="cover">${watermark(d)}
  <div class="cover-band"><div class="wordmark">PURPOSE CAPITAL</div><div class="wordmark-rule"></div><div class="wordmark-sub">Référentiel documentaire · ${esc(cfg.societe.raison_sociale)}</div></div>
  <div class="cover-main">
    <div class="cover-eyebrow">${esc(d.type)} · ${esc(d.domaine)}</div>
    <div class="cover-title">${esc(d.titre)}</div>
    <div class="cover-ref">Référence <b>${esc(d.id)}</b> &nbsp;·&nbsp; Version <b>${esc(d.version)}</b><span class="cover-status">${esc(d.statut)}</span></div>
    <table class="cover-meta">${rows.map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join("")}</table>
  </div>
  <div class="cover-foot">
    <div><strong>${esc(cfg.societe.raison_sociale)}</strong><br>Société de bourse agréée par la COSUMAF n° ${esc(cfg.societe.agrement)}<br>Capital de ${esc(cfg.societe.capital)} · ${esc(cfg.societe.siege)}</div>
    <div style="text-align:right">Document maîtrisé : seule la version publiée<br>dans le référentiel en ligne fait foi.<br>Édité le ${frDate(TODAY)}</div>
  </div></div>`;
}

function annexBlock(d, a, standalone) {
  return `<div class="annex${standalone ? "" : " page-break"}${!standalone && a.orientation === "paysage" ? " annex-landscape" : ""}">
  <div class="annex-head"><div>${standalone ? '<div class="mini-mark">PURPOSE CAPITAL<i></i></div><div style="height:2mm"></div>' : ""}
    <div class="annex-eyebrow">Annexe ${a.num} au ${esc(d.type.toLowerCase())} ${esc(d.id)} · ${esc(a.nature)}</div>
    <div class="annex-title">${esc(a.titre)}</div></div>
    <div class="annex-ref">Réf. <b>${esc(a.id)}</b><br>Version ${esc(d.version)}<br>${esc(d.confidentialite)}</div></div>
  <div class="annex-usage"><span><b>Renseigné par</b> ${esc(a.renseigne_par)}</span><span><b>Fréquence</b> ${esc(a.frequence)}</span><span><b>Conservé par</b> ${esc(a.conserve_par)}</span></div>
  <div class="doc-body">${a.html}</div></div>`;
}

function bodyHtml(d, withAnnexes = true) {
  const ap = (APPROB[d.id] || {})[d.empreinte] || {};
  const visa = (e) => (e ? `<td class="visa">${frDate(e.date)}</td><td class="visa">Visa électronique<br><small>empreinte ${esc(d.empreinte)}</small></td>` : `<td class="visa"></td><td class="visa"></td>`);
  const step = (k, v, e) => `<tr><td>${k}</td><td>${esc(v)}</td>${visa(e)}</tr>`;
  const control = `<section class="control">
  <h1>Fiche de maîtrise documentaire</h1>
  <table class="ctable"><tbody>
    <tr><th style="width:30%">Référence</th><td>${esc(d.id)}</td><th style="width:20%">Version</th><td>${esc(d.version)} — ${esc(d.statut)}</td></tr>
    <tr><th>Titre</th><td colspan="3">${esc(d.titre)}</td></tr>
    <tr><th>Type · domaine</th><td>${esc(d.type)} · ${esc(d.domaine)}</td><th>Confidentialité</th><td>${esc(d.confidentialite)}</td></tr>
    <tr><th>Propriétaire</th><td colspan="3">${esc(d.proprietaire)}</td></tr>
    <tr><th>Diffusion</th><td colspan="3">${esc(d.diffusion)}</td></tr>
    <tr><th>Prochaine revue</th><td colspan="3">${esc(d.prochaine_revue_label)}</td></tr>
  </tbody></table>
  <h4>Circuit d'approbation</h4>
  <table class="ctable"><thead><tr><th style="width:18%">Étape</th><th>Fonction</th><th style="width:20%">Date</th><th style="width:22%">Visa</th></tr></thead><tbody>
    ${step("Rédaction", d.redige_par)}${ap._circuit ? ap._circuit.map((c) => step(c.label, c.fonction, ap[c.etape])).join("") : step("Vérification", d.verifie_par, ap.verification) + step("Approbation", d.approuve_par, ap.adoption || ap.approbation)}
  </tbody></table>
  <h4>Historique des révisions</h4>
  <table class="ctable"><thead><tr><th style="width:12%">Version</th><th style="width:22%">Date</th><th>Objet</th><th style="width:18%">Par</th></tr></thead><tbody>
    ${d.historique.map((h) => `<tr><td>${esc(h.version)}</td><td>${frDate(h.date)}</td><td>${esc(h.objet)}</td><td>${esc(h.par)}</td></tr>`).join("")}
  </tbody></table>
  <h4>Textes de référence</h4>
  <table class="ctable"><tbody>${(d.references || []).map((r) => `<tr><td style="width:52%">${refCell(r.ref)}</td><td>${esc(r.articles)}</td></tr>`).join("")}</tbody></table>
</section>`;
  return `${watermark(d)}${control}<section class="control toc-block" style="margin-top:7mm">  <h4>Sommaire</h4>
  <div class="toc">
    ${d.toc.map((t) => `<div><span>${esc(t.label)}</span><span>${t.articles.length ? `Art. ${t.articles[0].n}–${t.articles.at(-1).n}` : ""}</span></div>`).join("")}
    ${withAnnexes ? d.annexes.map((a) => `<div><span>Annexe ${a.num} — ${esc(a.titre)}</span><span>${esc(a.id)}</span></div>`).join("") : '<div><span>Annexes publiées séparément</span><span></span></div>'}
  </div></section><div class="doc-body">${d.html}</div>${withAnnexes ? d.annexes.map((a) => annexBlock(d, a, false)).join("") : ""}`;
}

const hf = (d, label) => ({
  headerTemplate: `<div style="width:100%;margin:0 18mm 0 20mm;padding-bottom:5px;border-bottom:0.5px solid #D5DEE9;font-family:Helvetica,Arial,sans-serif;font-size:6.8pt;color:#5B6B80;display:flex;justify-content:space-between;-webkit-print-color-adjust:exact"><span><span style="color:#0B2E52;font-weight:bold;letter-spacing:1.4px">PURPOSE CAPITAL</span>&nbsp;&nbsp;·&nbsp;&nbsp;${esc(label)}</span><span>Version ${esc(d.version)} · ${esc(d.statut)}</span></div>`,
  footerTemplate: `<div style="width:100%;margin:0 18mm 0 20mm;font-family:Helvetica,Arial,sans-serif;font-size:6.5pt;color:#5B6B80;display:flex;justify-content:space-between"><span>Version imprimée non maîtrisée — seule la version en ligne fait foi · ${esc(d.confidentialite)}</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
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
  for (const d of variants) {
    const cover = await render(page(coverHtml(d), "", "@page{margin:0}"), d.id + "-cover", { margin: { top: 0, bottom: 0, left: 0, right: 0 } });
    const body = await render(page(bodyHtml(d)), d.id + "-body", { displayHeaderFooter: true, margin: MARGIN, ...hf(d, `${d.id} — ${d.titre}`) });
    const out = await PDFDocument.create();
    for (const src of [cover, body]) {
      const s = await PDFDocument.load(src);
      (await out.copyPages(s, s.getPageIndices())).forEach((p) => out.addPage(p));
    }
    out.setTitle(`${d.id} — ${d.titre} (v${d.version})`); out.setAuthor(cfg.societe.raison_sociale); out.setSubject(`${d.type} · ${d.statut}`); fixe(out, d);
    const bytes = await out.save();
    fs.writeFileSync(P("dist/pdf", d.pdf.file), bytes);
    console.log("PDF", d.pdf.file, (bytes.length / 1024).toFixed(0) + " Ko");
    // Version sans annexes : couverture, fiche de maîtrise et corps seuls, numérotation propre
    const bodyOnly = await render(page(bodyHtml(d, false)), d.id + "-corps", { displayHeaderFooter: true, margin: MARGIN, ...hf(d, `${d.id} — ${d.titre}`) });
    const out2 = await PDFDocument.create();
    for (const src of [cover, bodyOnly]) { const s = await PDFDocument.load(src); (await out2.copyPages(s, s.getPageIndices())).forEach((p) => out2.addPage(p)); }
    out2.setTitle(`${d.id} — ${d.titre} (v${d.version}, sans annexes)`); out2.setAuthor(cfg.societe.raison_sociale); fixe(out2, d);
    fs.writeFileSync(P("dist/pdf", d.pdfCorps.file), await out2.save());
    for (const a of d.annexes) {
      const land = a.orientation === "paysage";
      const buf = await render(page(watermark(d) + annexBlock(d, a, true), land ? "landscape" : ""), a.id, {
        displayHeaderFooter: true, landscape: land, margin: ANNEX_MARGIN, ...hf(d, `${a.id} — Annexe ${a.num} au ${d.id}`),
      });
      const doc = await PDFDocument.load(buf);
      doc.setTitle(`${a.id} — ${a.titre}`); doc.setAuthor(cfg.societe.raison_sociale); fixe(doc, d);
      const ab = await doc.save();
      fs.writeFileSync(P("dist/pdf", a.pdf.file), ab);
      console.log("PDF", a.pdf.file, (ab.length / 1024).toFixed(0) + " Ko");
    }
  }
  await browser.close();
}

// ---------- Site ----------
function buildSite() {
  const size = (f) => (fs.existsSync(P("dist/pdf", f)) ? fs.statSync(P("dist/pdf", f)).size : 0);
  const wsize = (f) => (fs.existsSync(P("dist/word", f + ".txt")) ? Math.round(fs.statSync(P("dist/word", f + ".txt")).size * 3 / 4) : 0);
  for (const d of variants0) { d.pdf.size = size(d.pdf.file); d.pdfCorps.size = size(d.pdfCorps.file); d.word.size = wsize(d.word.file); for (const a of d.annexes) { a.pdf.size = size(a.pdf.file); a.word.size = wsize(a.word.file); } }
  // Textes sources pour l'édition en ligne : texte de travail (<ID>.json) et version en vigueur pendant une révision (<ID>.vigueur.json)
  fs.rmSync(P("dist/source"), { recursive: true, force: true });
  fs.mkdirSync(P("dist/source"), { recursive: true });
  for (const d of docs) {
    if (d.projet) { fs.writeFileSync(P("dist/source", d.id + ".json"), JSON.stringify(d.projet._source)); fs.writeFileSync(P("dist/source", d.id + ".vigueur.json"), JSON.stringify(d._source)); }
    else fs.writeFileSync(P("dist/source", d.id + ".json"), JSON.stringify(d._source));
  }
  const strip = (d) => { const { _source, ...rest } = d; return d.projet ? { ...rest, projet: strip(d.projet) } : rest; };
  const data = { societe: cfg.societe, niveaux: cfg.niveaux, references: cfg.references, glossaire: cfg.glossaire, docs: docs.map(strip), prevus, generated: TODAY };
  const html = read(P("templates/index.tpl.html"))
    .replace("{{SITE_CSS}}", () => read(P("templates/site.css")))
    .replace("{{CONTENT_CSS}}", () => read(P("templates/content.css")))
    .replaceAll("{{SOCIETE}}", esc(cfg.societe.raison_sociale))
    .replaceAll("{{AGREMENT}}", esc(cfg.societe.agrement))
    .replaceAll("{{SIEGE}}", esc(cfg.societe.siege))
    .replaceAll("{{GENERATED}}", frDate(TODAY))
    .replace("{{DATA}}", () => JSON.stringify(data).replace(/</g, "\\u003c"))
    .replace("{{ENGINE_JS}}", () => read(P("templates/engine.cjs")))
    .replace("{{SITE_JS}}", () => read(P("templates/site.js")).replace("/*GENERATOR*/", () => read(P("templates/generator.js"))).replace("/*VISAS*/", () => read(P("templates/visas.js"))).replace("/*SELECTION*/", () => read(P("templates/selection.js"))).replace("/*EDITEUR*/", () => read(P("templates/editeur.js"))));
  fs.writeFileSync(P("dist/index.html"), html);
  fs.mkdirSync(P("dist/fonts"), { recursive: true });
  for (const f of fs.readdirSync(P("templates/fonts"))) fs.copyFileSync(P("templates/fonts", f), P("dist/fonts", f));
  console.log("HTML dist/index.html", (html.length / 1024).toFixed(0) + " Ko");
}

if (process.argv[1] && process.argv[1].endsWith("build.mjs")) {
if (!NO_PDF) await buildPdfs();
await buildWord();
buildSite();
}
