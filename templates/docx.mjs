// Conversion du HTML rendu d'un document du référentiel en fichier Word (.docx).
// Utilisé par build.mjs : un .docx pour le corps de chaque document, un par annexe.
import fs from "node:fs";
import * as D from "docx";
import { parse } from "node-html-parser";

const NAVY = "0B2E52", GREY = "5B6B80", GOLD = "8A6413", RULE = "B4C2D3", SHADE = "EEF3F9", PH = "FBF1DC";
const PAGE_W = 11906, PAGE_H = 16838; // A4 en DXA
const MARG = { top: 1250, bottom: 1080, left: 1134, right: 1020 };
const contentWidth = (land) => (land ? PAGE_H : PAGE_W) - MARG.left - MARG.right;

const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const border = (c = RULE, sz = 4) => ({ style: D.BorderStyle.SINGLE, size: sz, color: c });
const NOB = { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allBorders = (b) => ({ top: b, bottom: b, left: b, right: b });

// ---------- Texte en ligne ----------
function runs(node, st = {}) {
  const out = [];
  for (const n of node.childNodes) {
    if (n.nodeType === 3) {
      const t = decode(n.rawText).replace(/\s+/g, " ");
      if (t) out.push(new D.TextRun({ text: t, bold: st.b || undefined, italics: st.i || undefined, color: st.color, shading: st.ph ? { type: D.ShadingType.CLEAR, color: "auto", fill: PH } : undefined, font: st.code ? "Consolas" : undefined, size: st.size }));
      continue;
    }
    if (n.nodeType !== 1) continue;
    const tag = n.tagName.toLowerCase(), cls = n.getAttribute("class") || "";
    if (tag === "br") { out.push(new D.TextRun({ break: 1 })); continue; }
    const s = { ...st };
    if (tag === "strong" || tag === "b" || tag === "th") s.b = true;
    if (tag === "em" || tag === "i") s.i = true;
    if (tag === "code") s.code = true;
    if (tag === "small") s.size = 16;
    if (/\bph\b/.test(cls)) s.ph = true;
    if (/\bline\b/.test(cls)) { out.push(new D.TextRun({ text: " ".repeat(40), underline: { type: D.UnderlineType.SINGLE, color: GREY } })); continue; }
    if (tag === "a") { out.push(new D.ExternalHyperlink({ link: n.getAttribute("href") || "", children: [new D.TextRun({ text: decode(n.text), style: "Hyperlink" })] })); continue; }
    if (tag === "label") { out.push(new D.TextRun({ text: decode(n.text).toUpperCase(), size: 15, color: GREY, bold: true })); continue; }
    out.push(...runs(n, s));
  }
  return out;
}
const para = (children, o = {}) => new D.Paragraph({ children, spacing: { after: 100, line: 276 }, ...o });

// ---------- Tableaux ----------
function htmlTable(t, width) {
  const rows = t.querySelectorAll("tr");
  if (!rows.length) return [];
  const n = Math.max(...rows.map((r) => r.childNodes.filter((c) => c.nodeType === 1).length));
  // largeurs : style width:% des cellules de la première ligne qui en déclarent, sinon partage selon la longueur du texte
  const first = rows[0].childNodes.filter((c) => c.nodeType === 1);
  const declared = first.map((c) => { const m = (c.getAttribute("style") || "").match(/width:\s*([\d.]+)%/); return m ? +m[1] : null; });
  const lens = Array.from({ length: n }, (_, i) => {
    const ls = rows.map((r) => { const c = r.childNodes.filter((x) => x.nodeType === 1)[i]; return c ? Math.min(80, c.text.trim().length) : 0; });
    const mean = ls.reduce((a, b) => a + b, 0) / (ls.length || 1), max = Math.max(...ls);
    return Math.max(8, Math.sqrt(mean * max));
  });
  const freeShare = 100 - declared.filter(Boolean).reduce((a, b) => a + b, 0);
  const freeLen = lens.reduce((a, l, i) => a + (declared[i] ? 0 : l), 0) || 1;
  const pct = lens.map((l, i) => declared[i] || Math.max(4, (freeShare * l) / freeLen));
  const sum = pct.reduce((a, b) => a + b, 0);
  const cols = pct.map((p) => Math.round((width * p) / sum));
  const isForm = /form-table/.test(t.getAttribute("class") || "");
  const tall = /tall/.test(t.getAttribute("class") || "");
  return [new D.Table({
    width: { size: width, type: D.WidthType.DXA }, columnWidths: cols, layout: D.TableLayoutType.FIXED,
    rows: rows.map((r) => {
      const cells = r.childNodes.filter((c) => c.nodeType === 1);
      const head = r.parentNode && r.parentNode.tagName && r.parentNode.tagName.toLowerCase() === "thead";
      let ci = 0;
      return new D.TableRow({
        tableHeader: head, cantSplit: true,
        height: tall && !head ? { value: 520, rule: D.HeightRule.ATLEAST } : isForm && !head ? { value: 380, rule: D.HeightRule.ATLEAST } : undefined,
        children: cells.map((c) => {
          const span = +(c.getAttribute("colspan") || 1);
          const w = cols.slice(ci, ci + span).reduce((a, b) => a + b, 0); ci += span;
          const th = c.tagName.toLowerCase() === "th";
          const inner = blocks(c, w - 160, { inCell: true, head: head || th });
          return new D.TableCell({
            width: { size: w, type: D.WidthType.DXA }, columnSpan: span > 1 ? span : undefined,
            shading: head ? { type: D.ShadingType.CLEAR, color: "auto", fill: SHADE } : th ? { type: D.ShadingType.CLEAR, color: "auto", fill: "F6F8FB" } : undefined,
            margins: { top: 60, bottom: 60, left: 80, right: 80 }, borders: allBorders(border()),
            children: inner.length ? inner : [para([], { spacing: { after: 0 } })],
          });
        }),
      });
    }),
  }), para([], { spacing: { after: 120 } })];
}

// Grille de champs d'un formulaire : libellé au-dessus, ligne à remplir dessous
function formGrid(g, width) {
  const fields = g.querySelectorAll(":scope > .field");
  const per = /cols-3/.test(g.getAttribute("class") || "") ? 3 : 2;
  const colW = Math.floor(width / per), out = [];
  for (let i = 0; i < fields.length; i += per) {
    const slice = fields.slice(i, i + per);
    out.push(new D.TableRow({
      cantSplit: true,
      children: Array.from({ length: per }, (_, k) => {
        const f = slice[k];
        return new D.TableCell({
          width: { size: colW, type: D.WidthType.DXA }, margins: { top: 40, bottom: 40, left: 0, right: 160 },
          borders: { top: NOB, left: NOB, right: NOB, bottom: f ? border(GREY, 4) : NOB },
          children: [para(f ? [new D.TextRun({ text: decode(f.querySelector("label")?.text || "").toUpperCase(), size: 15, color: GREY, bold: true })] : [], { spacing: { after: 280 } })],
        });
      }),
    }));
  }
  return [new D.Table({ width: { size: colW * per, type: D.WidthType.DXA }, columnWidths: Array(per).fill(colW), layout: D.TableLayoutType.FIXED, borders: { top: NOB, bottom: NOB, left: NOB, right: NOB, insideHorizontal: NOB, insideVertical: NOB }, rows: out }), para([], { spacing: { after: 120 } })];
}

// Encadré (usage interne, variante de modèle) : tableau d'une cellule, fond clair
function boxed(node, width, label) {
  const inner = blocks(node, width - 300, { inCell: true });
  return [new D.Table({
    width: { size: width, type: D.WidthType.DXA }, columnWidths: [width], layout: D.TableLayoutType.FIXED,
    rows: [new D.TableRow({ children: [new D.TableCell({
      width: { size: width, type: D.WidthType.DXA }, shading: { type: D.ShadingType.CLEAR, color: "auto", fill: SHADE },
      borders: { top: border(RULE), bottom: border(RULE), right: border(RULE), left: border(NAVY, 12) }, margins: { top: 100, bottom: 100, left: 160, right: 140 },
      children: (label ? [para([new D.TextRun({ text: label, bold: true, color: GOLD, size: 16 })])] : []).concat(inner.length ? inner : [para([])]),
    })] })],
  }), para([], { spacing: { after: 120 } })];
}

function signatures(node, width) {
  const out = [];
  node.childNodes.filter((c) => c.nodeType === 1 && c.tagName.toLowerCase() === "p").forEach((p) => out.push(para(runs(p), { spacing: { before: 240, after: 200 } })));
  node.querySelectorAll(".sig-row").forEach((row) => {
    const sigs = row.querySelectorAll(".sig");
    const w = Math.floor(width / Math.max(2, sigs.length));
    out.push(new D.Table({
      width: { size: w * Math.max(2, sigs.length), type: D.WidthType.DXA }, columnWidths: Array(Math.max(2, sigs.length)).fill(w), layout: D.TableLayoutType.FIXED,
      borders: { top: NOB, bottom: NOB, left: NOB, right: NOB, insideHorizontal: NOB, insideVertical: NOB },
      rows: [new D.TableRow({ cantSplit: true, children: Array.from({ length: Math.max(2, sigs.length) }, (_, k) => new D.TableCell({
        width: { size: w, type: D.WidthType.DXA }, margins: { left: 0, right: 300, top: 0, bottom: 0 }, borders: { top: NOB, left: NOB, right: NOB, bottom: NOB },
        children: sigs[k] ? [para(runs(sigs[k], { b: true, color: NAVY }), { spacing: { after: 1100 } }), para([new D.TextRun({ text: "Signature", size: 15, color: GREY })], { border: { top: border(GREY, 4) } })] : [para([])],
      })) })],
    }));
  });
  out.push(para([]));
  return out;
}

// ---------- Blocs ----------
let OL = 0, IMG = {};
// Dimensions d'une image PNG, JPEG ou GIF, pour l'insérer à la bonne taille
function dims(buf) {
  if (buf[0] === 0x89) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: "png" };
  if (buf[0] === 0x47) return { w: buf.readUInt16LE(6), h: buf.readUInt16LE(8), type: "gif" };
  let i = 2; while (i < buf.length) { if (buf[i] !== 0xff) break; const m = buf[i + 1], len = buf.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc3) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5), type: "jpg" }; i += 2 + len; }
  return { w: 600, h: 400, type: "png" };
}
function image(n, width) {
  const k = (n.getAttribute("src") || "").replace(/^img\//, ""), f = IMG[k];
  if (!f) return [];
  const data = fs.readFileSync(f), d = dims(data), maxW = Math.round(width / 15); // DXA → pixels (96 dpi)
  const w = Math.min(d.w, maxW), h = Math.round(d.h * w / d.w);
  return [new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.ImageRun({ data, type: d.type, transformation: { width: w, height: h }, altText: { name: n.getAttribute("alt") || "image", description: n.getAttribute("alt") || "", title: n.getAttribute("alt") || "" } })], spacing: { after: 120 } })];
}
function blocks(node, width, ctx = {}) {
  const out = [];
  let inline = [];
  const flush = () => { if (inline.length) { out.push(para(inline)); inline = []; } };
  for (const n of node.childNodes) {
    if (n.nodeType === 3) { const t = decode(n.rawText); if (t.trim()) inline.push(new D.TextRun({ text: t.replace(/\s+/g, " "), bold: ctx.head || undefined })); continue; }
    if (n.nodeType !== 1) continue;
    const tag = n.tagName.toLowerCase(), cls = n.getAttribute("class") || "";
    if (["strong", "em", "span", "a", "code", "b", "i", "small", "label", "br"].includes(tag)) { inline.push(...runs({ childNodes: [n] }, { b: ctx.head })); continue; }
    flush();
    if (tag === "img") { out.push(...image(n, width)); continue; }
    if (tag === "h1" || tag === "h2") {
      // « Titre I — … » : numérotation automatique de Word (supprimer ou ajouter un titre renumérote les autres)
      const t = decode(n.text).match(/^(?:Titre|Title)\s+[IVXLC]+\s+—\s+(.+)$/);
      out.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: t ? [new D.TextRun(t[1])] : runs(n), keepNext: true, ...(t ? { numbering: { reference: "titres", level: 0 } } : {}) }));
    } else if (tag === "h3") {
      const a = decode(n.text).match(/^Article\s+\d+\s+—\s+(.+)$/);
      out.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, children: a ? [new D.TextRun(a[1])] : runs(n), keepNext: true, ...(a ? { numbering: { reference: "articles", level: 0 } } : {}) }));
    }
    else if (tag === "h4") out.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_3, children: runs(n), keepNext: true }));
    else if (tag === "p" && n.querySelector("img")) { n.querySelectorAll("img").forEach((im) => out.push(...image(im, width))); const t = n.text.trim(); if (t) out.push(para([new D.TextRun({ text: decode(t), italics: true, size: 17, color: GREY })], { alignment: D.AlignmentType.CENTER })); }
    else if (tag === "p") {
      if (/office-title|opt-label/.test(cls)) out.push(para(runs(n, { b: true, color: GOLD })));
      else if (/party-role/.test(cls)) out.push(para(runs(n), { alignment: D.AlignmentType.RIGHT }));
      else out.push(para(runs(n, { b: ctx.head }), ctx.inCell ? { spacing: { after: 40 } } : {}));
    } else if (tag === "ul" || tag === "ol") {
      const inst = tag === "ol" ? ++OL : 0;
      n.childNodes.filter((c) => c.nodeType === 1 && c.tagName.toLowerCase() === "li").forEach((li) => {
        const sub = li.childNodes.filter((c) => c.nodeType === 1 && ["ul", "ol", "p"].includes(c.tagName.toLowerCase()));
        const textNode = sub.length ? { childNodes: li.childNodes.filter((c) => !(c.nodeType === 1 && ["ul", "ol"].includes(c.tagName.toLowerCase()))) } : li;
        out.push(new D.Paragraph({ children: runs(textNode), numbering: { reference: tag === "ol" ? "num" : "puce", level: ctx.level || 0, instance: inst }, spacing: { after: 60, line: 276 } }));
        li.childNodes.filter((c) => c.nodeType === 1 && ["ul", "ol"].includes(c.tagName.toLowerCase())).forEach((s) => out.push(...blocks({ childNodes: [s] }, width, { ...ctx, level: 1 })));
      });
    } else if (tag === "table") out.push(...htmlTable(n, width));
    else if (tag === "blockquote") out.push(...boxed(n, width));
    else if (tag === "hr") out.push(para([], { border: { bottom: border(RULE, 6) } }));
    else if (tag === "div") {
      if (/form-grid/.test(cls)) out.push(...formGrid(n, width));
      else if (/office-use/.test(cls)) out.push(...boxed(n, width));
      else if (/\bopt\b/.test(cls)) out.push(...boxed(n, width));
      else if (/signatures/.test(cls)) out.push(...signatures(n, width));
      else if (/sig-row/.test(cls)) out.push(...signatures({ childNodes: [], querySelectorAll: () => [n] }, width));
      else out.push(...blocks(n, width, ctx));
    } else out.push(...blocks(n, width, ctx));
  }
  flush();
  return out;
}

const header = (label, d) => new D.Header({ children: [new D.Paragraph({
  tabStops: [{ type: D.TabStopType.RIGHT, position: D.TabStopPosition.MAX }], border: { bottom: border("D5DEE9", 4) },
  children: [new D.TextRun({ text: "PURPOSE CAPITAL", bold: true, color: NAVY, size: 15, characterSpacing: 30 }), new D.TextRun({ text: "   ·   " + label, color: GREY, size: 15 }), new D.TextRun({ text: `\tVersion ${d.version} · ${LG(d.statut)}`, color: GREY, size: 15 })],
})] });
const footer = (d) => new D.Footer({ children: [new D.Paragraph({
  tabStops: [{ type: D.TabStopType.RIGHT, position: D.TabStopPosition.MAX }],
  children: [new D.TextRun({ text: EN ? `Uncontrolled copy — only the online version is authoritative · fingerprint ${d.empreinte} · ${LG(d.confidentialite)}` : `Copie non maîtrisée — seule la version en ligne fait foi · empreinte ${d.empreinte} · ${d.confidentialite}`, color: GREY, size: 14 }), new D.TextRun({ children: ["\tPage ", D.PageNumber.CURRENT, " / ", D.PageNumber.TOTAL_PAGES], color: GREY, size: 14 })],
})] });

const styles = {
  default: { document: { run: { font: "Calibri", size: 21, color: "0A2540" } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Cambria", size: 30, bold: true, color: NAVY }, paragraph: { spacing: { before: 0, after: 200 }, keepNext: true, pageBreakBefore: true } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri", size: 22, bold: true, color: NAVY }, paragraph: { spacing: { before: 220, after: 80 }, keepNext: true, keepLines: true } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri", size: 20, bold: true, color: GREY, allCaps: true }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true } },
    { id: "TOC1", name: "toc 1", basedOn: "Normal", next: "Normal", run: { bold: true, color: NAVY, size: 21 }, paragraph: { spacing: { before: 120, after: 40 } } },
    { id: "TOC2", name: "toc 2", basedOn: "Normal", next: "Normal", run: { size: 19 }, paragraph: { spacing: { after: 20 }, indent: { left: 360 } } },
    { id: "Title", name: "Title", basedOn: "Normal", run: { font: "Cambria", size: 40, bold: true, color: NAVY }, paragraph: { spacing: { after: 120 } } },
  ],
};
const numerotation = () => ({ config: [
  { reference: "titres", levels: [{ level: 0, format: D.LevelFormat.UPPER_ROMAN, text: EN ? "Title %1 —" : "Titre %1 —", alignment: D.AlignmentType.LEFT, suffix: D.LevelSuffix.SPACE }] },
  { reference: "articles", levels: [{ level: 0, format: D.LevelFormat.DECIMAL, text: "Article %1 —", alignment: D.AlignmentType.LEFT, suffix: D.LevelSuffix.SPACE }] },
  { reference: "puce", levels: [0, 1].map((l) => ({ level: l, format: D.LevelFormat.BULLET, text: l ? "–" : "•", alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 360 * (l + 1), hanging: 260 } } } })) },
  { reference: "num", levels: [0, 1].map((l) => ({ level: l, format: l ? D.LevelFormat.LOWER_LETTER : D.LevelFormat.DECIMAL, text: l ? "%2)" : "%1.", alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 360 * (l + 1), hanging: 300 } } } })) },
] });

// Cartouche d'en-tête : type, référence, titre, statut ; fiche de maîtrise résumée
function titleBlock(d, eyebrow, titre, extra) {
  const out = [
    para([new D.TextRun({ text: eyebrow.toUpperCase(), color: GOLD, bold: true, size: 16, characterSpacing: 20 })], { spacing: { after: 60 } }),
    new D.Paragraph({ style: "Title", children: [new D.TextRun(titre)] }),
    para([new D.TextRun({ text: `Version ${d.version} · ${LG(d.statut)} · ${LG(d.confidentialite)} · ${LG("empreinte")} ${d.empreinte}`, color: GREY, size: 17 })], { border: { bottom: border(NAVY, 12) }, spacing: { after: 240 } }),
  ];
  if (d.statut !== "En vigueur") out.splice(1, 0, para([new D.TextRun({ text: EN ? "DRAFT — document not approved" : "PROJET — document non approuvé", bold: true, color: "8A5A06", size: 18 })], { spacing: { after: 40 } }));
  return out.concat(extra || []);
}

// Langue des fichiers produits : français par défaut ; langue("en", dictionnaire) pour la version anglaise
let EN = false, LG = (t) => t;
const enD = (iso) => { if (!iso) return ""; const [y, m, j] = String(iso).slice(0, 10).split("-"); return `${+j} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][+m - 1]} ${y}`; };
export function langue(l, dict = {}) { EN = l === "en"; LG = EN ? (t) => (dict[t] !== undefined ? dict[t] : t) : (t) => t; }
const escH = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const frD0 = (iso) => { if (!iso) return ""; const [y, m, j] = String(iso).slice(0, 10).split("-"); return `${+j} ${["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"][+m - 1]} ${y}`; };

const frD = (iso) => (EN ? enD(iso) : frD0(iso));

// Fiche de maîtrise (une seule fois les dates et les visas : rien en fin de document) puis sommaire Word sur une page dédiée
export async function docxCorps(d, fiche = {}) {
  const W = contentWidth(false), ap = fiche.approb || {};
  IMG = fiche.images || {};
  const info = parse(`<table><tbody>
    <tr><th style="width:22%">${LG("Référence")}</th><td>${escH(d.id)}</td><th style="width:18%">Version</th><td>${escH(d.version)} — ${escH(LG(d.statut))}</td></tr>
    <tr><th>${LG("Propriétaire")}</th><td colspan="3">${escH(LG(d.proprietaire))}</td></tr>
    <tr><th>${LG("Diffusion")}</th><td colspan="3">${escH(d.diffusion)}</td></tr>
    <tr><th>${LG("Date d'effet")}</th><td>${d.date_effet ? frD(d.date_effet) : LG("À l'adoption")}</td><th>${LG("Prochaine revue")}</th><td>${escH(LG(d.prochaine_revue_label))}</td></tr></tbody></table>`).querySelector("table");
  const etapes = ap._circuit || [{ etape: "verification", label: LG("Vérification"), fonction: LG(d.verifie_par) }, { etape: ap.adoption ? "adoption" : "approbation", label: LG("Approbation"), fonction: LG(d.approuve_par) }];
  const circuit = parse(`<table><tbody><tr><th style="width:17%">${LG("Étape")}</th><th>${LG("Fonction")}</th><th style="width:27%">${LG("Visa électronique")}</th><th style="width:24%">${LG("Signature manuscrite")}</th></tr>
    <tr><td>${LG("Rédaction")}</td><td>${escH(LG(d.redige_par))}</td><td></td><td></td></tr>
    ${etapes.map((e) => { const v = ap[e.etape]; return `<tr><td>${escH(LG(e.label))}</td><td>${escH(LG(e.fonction))}</td><td>${v ? escH(frD(v.date)) + "<br><small>" + LG("Visa électronique") + " · " + LG("empreinte") + " " + escH(d.empreinte) + "</small>" : ""}</td><td><br><br><small>${LG("Date et signature")}</small></td></tr>`; }).join("")}</tbody></table>`).querySelector("table");
  const hist = parse(`<table><tbody><tr><th style="width:12%">Version</th><th style="width:22%">Date</th><th>${LG("Objet")}</th><th style="width:18%">${LG("Par")}</th></tr>${(d.historique || []).map((h) => `<tr><td>${escH(h.version)}</td><td>${escH(frD(h.date))}</td><td>${escH(h.objet)}</td><td>${escH(LG(h.par))}</td></tr>`).join("")}</tbody></table>`).querySelector("table");
  const refs = (fiche.refs || []).length ? parse(`<table><tbody>${fiche.refs.map((r) => `<tr><td style="width:52%">${escH(r.titre)}</td><td>${escH(r.articles)}</td></tr>`).join("")}</tbody></table>`).querySelector("table") : null;
  const sub = (t) => para([new D.TextRun({ text: t.toUpperCase(), bold: true, size: 15, color: GREY, characterSpacing: 20 })], { spacing: { before: 240, after: 80 }, keepNext: true });
  const body = parse("<div>" + d.html + "</div>").querySelector("div");
  const doc = new D.Document({
    creator: "Purpose Capital S.A.", title: `${d.id} — ${d.titre}`, description: `${LG(d.type)} · version ${d.version}`, styles, numbering: numerotation(),
    features: { updateFields: true },
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: MARG } },
      headers: { default: header(`${d.id} — ${d.titre}`, d) }, footers: { default: footer(d) },
      children: [
        ...titleBlock(d, `${LG(d.type)} · ${d.id}`, d.titre),
        sub(LG("Fiche de maîtrise documentaire")), ...htmlTable(info, W),
        sub(LG("Circuit d'approbation")), ...htmlTable(circuit, W),
        sub(LG("Historique des révisions")), ...htmlTable(hist, W),
        ...(refs ? [sub(LG("Textes de référence")), ...htmlTable(refs, W)] : []),
        new D.Paragraph({ style: "Title", pageBreakBefore: true, children: [new D.TextRun(LG("Sommaire"))] }),
        new D.TableOfContents(LG("Sommaire"), { hyperlink: true, headingStyleRange: "1-2" }),
        para([new D.TextRun({ text: EN ? "If the table of contents is empty: right-click it, then “Update Field”." : "Si le sommaire est vide : clic droit dessus, puis « Mettre à jour les champs ».", italics: true, size: 15, color: GREY })]),
        // Le texte commence sur une nouvelle page (un titre le fait de lui-même)
        ...(/^\s*<h2/.test(d.html) ? [] : [new D.Paragraph({ children: [new D.PageBreak()] })]),
        ...blocks(body, W),
      ],
    }],
  });
  return D.Packer.toBuffer(doc);
}

export async function docxAnnexe(d, a) {
  const land = a.orientation === "paysage", W = contentWidth(land);
  const body = parse("<div>" + a.html + "</div>").querySelector("div");
  const usage = para([
    new D.TextRun({ text: LG("Renseigné par") + " ", bold: true, size: 16, color: GREY }), new D.TextRun({ text: (a.renseigne_par || "") + "     ", size: 16, color: GREY }),
    new D.TextRun({ text: LG("Fréquence") + " ", bold: true, size: 16, color: GREY }), new D.TextRun({ text: (a.frequence || "") + "     ", size: 16, color: GREY }),
    new D.TextRun({ text: LG("Conservé par") + " ", bold: true, size: 16, color: GREY }), new D.TextRun({ text: a.conserve_par || "", size: 16, color: GREY }),
  ], { spacing: { after: 200 } });
  const doc = new D.Document({
    creator: "Purpose Capital S.A.", title: `${a.id} — ${a.titre}`, styles, numbering: numerotation(),
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: PAGE_H, orientation: land ? D.PageOrientation.LANDSCAPE : D.PageOrientation.PORTRAIT }, margin: MARG } },
      headers: { default: header(EN ? `${a.id} — Appendix ${a.num} to ${d.id}` : `${a.id} — Annexe ${a.num} au ${d.id}`, d) }, footers: { default: footer(d) },
      children: [...titleBlock(d, EN ? `Appendix ${a.num} to ${LG(d.type).toLowerCase()} ${d.id} · ${a.nature || ""}` : `Annexe ${a.num} au ${d.type.toLowerCase()} ${d.id} · ${a.nature || ""}`, a.titre, [usage]), ...blocks(body, W)],
    }],
  });
  return D.Packer.toBuffer(doc);
}

// Modèle vierge : mêmes styles que les documents publiés (Titre 1 = titre numéroté, Titre 2 = article numéroté)
export async function docxModeleVierge() {
  const H1 = (t) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, numbering: { reference: "titres", level: 0 }, children: [new D.TextRun(t)] });
  const H2 = (t) => new D.Paragraph({ heading: D.HeadingLevel.HEADING_2, numbering: { reference: "articles", level: 0 }, children: [new D.TextRun(t)] });
  const P = (t, o = {}) => para([new D.TextRun({ text: t, ...o })]);
  const doc = new D.Document({
    creator: "Purpose Capital S.A.", title: "Modèle de document du référentiel", styles, numbering: numerotation(),
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: MARG } },
      children: [
        new D.Paragraph({ style: "Title", children: [new D.TextRun("Modèle de document du référentiel")] }),
        P("Mode d'emploi", { bold: true, color: NAVY }),
        P("1. Gardez les styles Word : « Titre 1 » pour chaque titre (numéroté automatiquement : Titre I, II…), « Titre 2 » pour chaque article (Article 1, 2…). Ne tapez pas les numéros : Word les met à jour quand vous ajoutez, supprimez ou déplacez un titre ou un article."),
        P("2. Le texte courant, les listes, les tableaux et les images sont repris. Les commentaires et les modifications suivies ne le sont pas : acceptez-les avant d'importer."),
        P("3. Le titre du document, son résumé et son circuit se saisissent sur le site ; inutile de les écrire ici."),
        P("4. Sur le site : Registre → « + Nouveau document » → « Importer un Word », ou, pour un document existant, « Modifier le texte » → « Importer un Word »."),
        P("Rédigez le texte du document ci-dessous (cette page n'est pas reprise).", { italics: true, color: GREY }),
        H1("Dispositions générales"), H2("Objet"), P("Ce que le document organise, en une ou deux phrases."),
        H2("Champ d'application"), P("À qui et à quelles activités il s'applique."),
        H2("Définitions"), P("Les termes employés renvoient au glossaire du référentiel."),
        H1("Règles"), H2("Principe"), P("…"),
        H1("Dispositions finales"), H2("Entrée en vigueur"), P("Le présent document entre en vigueur à la date de son adoption, indiquée dans la fiche de maîtrise documentaire."),
      ],
    }],
  });
  return D.Packer.toBuffer(doc);
}
