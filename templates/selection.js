  // ---------- Sélection et téléchargement groupé (ZIP ou recueil PDF) ----------
  LIBS.jszip = { url: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", global: "JSZip" };
  LIBS.pdflib = { url: "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js", global: "PDFLib" };
  LIBS.fontkit = { url: "https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js", global: "fontkit" };
  var SEL = { docs: {}, ann: {} };              // ann : { "PC-XXX|2": true }
  var OPT = { pdf: true, word: false, annexes: "toutes", busy: false };
  try { var saved = JSON.parse(localStorage.getItem("pc-ref-selopt") || "null"); if (saved) { OPT.pdf = saved.pdf !== false; OPT.word = !!saved.word; OPT.annexes = saved.annexes || "toutes"; } } catch (e) { /* préférences indisponibles */ }
  var saveOpt = function () { try { localStorage.setItem("pc-ref-selopt", JSON.stringify({ pdf: OPT.pdf, word: OPT.word, annexes: OPT.annexes })); } catch (e) { /* sans mémoire */ } };
  var docById = function (id) { return docs.filter(function (d) { return d.id === id; })[0]; };
  var nSel = function () { return Object.keys(SEL.docs).length; };
  var nAnn = function () { return Object.keys(SEL.ann).length; };

  // Ce qui sera fourni, document par document : corps et annexes retenues
  function plan() {
    var out = [];
    docs.forEach(function (d) {
      var chosen = d.annexes.filter(function (a) { return SEL.ann[d.id + "|" + a.num]; });
      if (SEL.docs[d.id]) {
        var ann = OPT.annexes === "toutes" ? d.annexes : OPT.annexes === "aucune" ? [] : chosen;
        out.push({ d: d, corps: true, annexes: ann });
      } else if (chosen.length) out.push({ d: d, corps: false, annexes: chosen });
    });
    return out;
  }
  function selSync() {
    document.querySelectorAll("[data-sel]").forEach(function (c) {
      var p = c.getAttribute("data-sel").split("|");
      c.checked = p[0] === "doc" ? !!SEL.docs[p[1]] : !!SEL.ann[p[1] + "|" + p[2]];
    });
    var all = $("#sel-all");
    if (all) {
      var on = REG_SHOWN.filter(function (id) { return SEL.docs[id]; }).length;
      all.checked = REG_SHOWN.length > 0 && on === REG_SHOWN.length; all.indeterminate = on > 0 && on < REG_SHOWN.length;
    }
    renderBar();
  }
  function renderBar() {
    var bar = $("#selbar"); if (!bar) return;
    var nd = nSel(), na = nAnn();
    if (!nd && !na) { bar.hidden = true; document.body.classList.remove("has-selbar"); return; }
    bar.hidden = false; document.body.classList.add("has-selbar");
    var what = (nd ? nd + " document" + (nd > 1 ? "s" : "") : "") + (nd && na ? " et " : "") + (na ? na + " annexe" + (na > 1 ? "s" : "") + " cochée" + (na > 1 ? "s" : "") : "");
    bar.innerHTML = '<div class="wrap selbar-in">' +
      '<div class="selbar-what"><b>' + esc(what) + '</b><button type="button" class="doclink" data-selact="clear">Tout désélectionner</button></div>' +
      '<div class="selbar-opts">' +
      '<span class="selgrp" role="group" aria-label="Formats"><label><input type="checkbox" data-selact="pdf"' + (OPT.pdf ? " checked" : "") + "> PDF</label>" +
      '<label><input type="checkbox" data-selact="word"' + (OPT.word ? " checked" : "") + "> Word</label></span>" +
      '<label class="selgrp">Annexes <select data-selact="annexes" aria-label="Annexes">' +
      [["toutes", "toutes"], ["aucune", "aucune"], ["cochees", "seulement celles cochées"]].map(function (o) { return '<option value="' + o[0] + '"' + (OPT.annexes === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
      "</div>" +
      '<div class="selbar-go"><button type="button" class="btn" data-selact="zip"' + (OPT.busy ? " disabled" : "") + ">" + ICON_DL + "ZIP</button>" +
      '<button type="button" class="btn primary" data-selact="recueil"' + (OPT.busy ? " disabled" : "") + ">" + ICON_DL + "Recueil PDF</button></div></div>";
  }

  var fetchBin = async function (path) { var r = await fetch(path); if (!r.ok) throw { code: "missing", path: path }; return new Uint8Array(await r.arrayBuffer()); };
  var stamp = function () { return new Date().toISOString().slice(0, 10); };
  var safe = function (s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").replace(/[^A-Za-z0-9 ._-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 70); };

  async function saveBlob(filename, data) {
    var dl = await downloadsP;
    if (!dl) { toast("Le téléchargement n'est pas disponible dans cette vue. Ouvrez le référentiel dans claude.ai."); return; }
    try { await dl.save({ filename: filename, data: data }); toast("Fichier prêt : " + filename); }
    catch (e) { if (e && e.code === "declined") return; toast(e && e.code === "rate_limited" ? "Une confirmation est déjà ouverte. Réessayez dans un instant." : "Le téléchargement a échoué. Réessayez."); }
  }
  function selBusy(on, msg) { OPT.busy = on; renderBar(); if (msg) toast(msg); }

  async function makeZip() {
    var p = plan(); if (!p.length) { toast("Rien à télécharger : cochez des documents ou des annexes."); return; }
    if (!OPT.pdf && !OPT.word) { toast("Choisissez au moins un format : PDF ou Word."); return; }
    selBusy(true, "Préparation du ZIP…");
    try {
      var Z = await loadLib("jszip"), zip = new Z();
      var lignes = ["Référentiel documentaire Purpose Capital S.A. — extrait du " + stamp(), "Copies non maîtrisées : seule la version en ligne fait foi.", ""];
      for (var i = 0; i < p.length; i++) {
        var it = p[i], d = it.d, dir = zip.folder(safe(d.id + " — " + d.titre));
        lignes.push(d.id + " — " + d.titre + " (version " + d.version + ", " + d.statut + ", empreinte " + d.empreinte + ")");
        if (it.corps) {
          if (OPT.pdf) dir.file(d.id + "_v" + d.version + ".pdf", await fetchBin("pdf/" + d.pdfCorps.file));
          if (OPT.word) dir.file(d.word.file, await fetchWord(d.word.file));
        }
        if (it.annexes.length) {
          var ad = dir.folder("Annexes");
          for (var k = 0; k < it.annexes.length; k++) {
            var a = it.annexes[k];
            if (OPT.pdf) ad.file(a.pdf.file, await fetchBin("pdf/" + a.pdf.file));
            if (OPT.word) ad.file(a.word.file, await fetchWord(a.word.file));
            lignes.push("   Annexe " + a.num + " — " + a.titre);
          }
        }
      }
      zip.file("LISEZ-MOI.txt", lignes.join("\r\n"));
      var blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      selBusy(false);
      await saveBlob("Purpose-Capital_referentiel_" + stamp() + ".zip", blob);
    } catch (e) { selBusy(false); toast(e && e.code === "missing" ? "Un fichier est introuvable dans cette version du référentiel." : "La préparation du ZIP a échoué. Réessayez."); }
  }

  async function makeRecueil() {
    var p = plan(); if (!p.length) { toast("Rien à réunir : cochez des documents ou des annexes."); return; }
    selBusy(true, "Préparation du recueil…");
    try {
      var L = await loadLib("pdflib"), fk = await loadLib("fontkit");
      var out = await L.PDFDocument.create(); out.registerFontkit(fk);
      var fReg = await out.embedFont(await fetchBin("fonts/Inter-Regular.ttf"), { subset: true });
      var fSemi = await out.embedFont(await fetchBin("fonts/Inter-SemiBold.ttf"), { subset: true });
      var fDisp = await out.embedFont(await fetchBin("fonts/Playfair-SemiBold.ttf"), { subset: true });
      var NAVY = L.rgb(0.043, 0.18, 0.322), GOLD = L.rgb(0.91, 0.627, 0.125), GREY = L.rgb(0.357, 0.42, 0.502), INK = L.rgb(0.04, 0.145, 0.25);
      // Pages de garde et de sommaire, remplies une fois les pages comptées
      var cover = out.addPage([595.28, 841.89]);
      var parts = [];
      for (var i = 0; i < p.length; i++) {
        var it = p[i], d = it.d, files = [];
        if (it.corps) files.push(it.annexes.length === d.annexes.length && d.annexes.length ? { f: "pdf/" + d.pdf.file, t: d.id + " — " + d.titre, sub: "avec ses annexes" } : { f: "pdf/" + d.pdfCorps.file, t: d.id + " — " + d.titre, sub: "" });
        if (!(it.corps && it.annexes.length === d.annexes.length)) it.annexes.forEach(function (a) { files.push({ f: "pdf/" + a.pdf.file, t: a.id + " — " + a.titre, sub: "annexe " + a.num + " au " + d.id, ann: true }); });
        parts = parts.concat(files);
      }
      var tocLines = parts.length, perPage = 30, tocPages = Math.max(1, Math.ceil(tocLines / perPage));
      var tocP = []; for (var t = 0; t < tocPages; t++) tocP.push(out.addPage([595.28, 841.89]));
      var start = 1 + tocPages;
      for (var j = 0; j < parts.length; j++) {
        var src = await L.PDFDocument.load(await fetchBin(parts[j].f), { ignoreEncryption: true });
        var pages = await out.copyPages(src, src.getPageIndices());
        parts[j].page = start + 1; start += pages.length;
        pages.forEach(function (pg) { out.addPage(pg); });
      }
      // Couverture
      cover.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: NAVY });
      cover.drawRectangle({ x: 56, y: 600, width: 34, height: 2.5, color: GOLD });
      cover.drawText("PURPOSE CAPITAL", { x: 56, y: 620, size: 11, font: fSemi, color: L.rgb(1, 1, 1) });
      cover.drawText("Recueil de documents", { x: 56, y: 540, size: 30, font: fDisp, color: L.rgb(1, 1, 1) });
      cover.drawText("Codes, politiques, procédures et modèles", { x: 56, y: 512, size: 13, font: fReg, color: L.rgb(0.73, 0.78, 0.85) });
      cover.drawText(parts.length + " pièce" + (parts.length > 1 ? "s" : "") + " · " + (out.getPageCount()) + " pages · extrait le " + new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), { x: 56, y: 470, size: 10.5, font: fReg, color: L.rgb(0.73, 0.78, 0.85) });
      cover.drawText("Copie non maîtrisée : seule la version en ligne du référentiel fait foi.", { x: 56, y: 70, size: 9, font: fReg, color: L.rgb(0.73, 0.78, 0.85) });
      cover.drawText(DATA.societe.raison_sociale + " · Agrément " + DATA.societe.agrement, { x: 56, y: 54, size: 9, font: fReg, color: L.rgb(0.73, 0.78, 0.85) });
      // Sommaire
      var fit = function (s, font, size, w) { if (font.widthOfTextAtSize(s, size) <= w) return s; while (s.length > 3 && font.widthOfTextAtSize(s + "…", size) > w) s = s.slice(0, -1); return s.replace(/\s+$/, "") + "…"; };
      tocP.forEach(function (pg, n) {
        pg.drawText(n ? "Sommaire (suite)" : "Sommaire", { x: 56, y: 770, size: 20, font: fDisp, color: NAVY });
        pg.drawRectangle({ x: 56, y: 756, width: 26, height: 2, color: GOLD });
        parts.slice(n * perPage, (n + 1) * perPage).forEach(function (x, k) {
          var y = 724 - k * 22, indent = x.ann ? 14 : 0;
          var subW = x.sub && !x.ann ? fReg.widthOfTextAtSize(x.sub, 8.5) + 10 : 0;
          var title = fit(x.t, x.ann ? fReg : fSemi, x.ann ? 9.5 : 10.5, 455 - indent - subW);
          pg.drawText(title, { x: 56 + indent, y: y, size: x.ann ? 9.5 : 10.5, font: x.ann ? fReg : fSemi, color: INK });
          if (subW) pg.drawText(x.sub, { x: 515 - subW, y: y, size: 8.5, font: fReg, color: GREY });
          var num = String(x.page); pg.drawText(num, { x: 539 - fReg.widthOfTextAtSize(num, 10), y: y, size: 10, font: fReg, color: INK });
          pg.drawLine({ start: { x: 56, y: y - 7 }, end: { x: 539, y: y - 7 }, thickness: 0.4, color: L.rgb(0.86, 0.89, 0.93) });
        });
      });
      out.setTitle("Recueil — Référentiel documentaire Purpose Capital S.A."); out.setAuthor(DATA.societe.raison_sociale);
      var bytes = await out.save();
      selBusy(false);
      await saveBlob("Purpose-Capital_recueil_" + stamp() + ".pdf", new Blob([bytes], { type: "application/pdf" }));
    } catch (e) { selBusy(false); toast(e && e.code === "missing" ? "Un fichier est introuvable dans cette version du référentiel." : "La préparation du recueil a échoué. Réessayez."); }
  }

  document.addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.matches("[data-sel]")) {
      var p = t.getAttribute("data-sel").split("|");
      if (p[0] === "doc") { if (t.checked) SEL.docs[p[1]] = true; else delete SEL.docs[p[1]]; }
      else { var k = p[1] + "|" + p[2]; if (t.checked) { SEL.ann[k] = true; if (SEL.docs[p[1]] && OPT.annexes === "toutes") { OPT.annexes = "cochees"; saveOpt(); toast("Annexes : seulement celles cochées."); } } else delete SEL.ann[k]; }
      selSync(); return;
    }
    if (t.id === "sel-all") { REG_SHOWN.forEach(function (id) { if (t.checked) SEL.docs[id] = true; else delete SEL.docs[id]; }); selSync(); return; }
    var a = t.getAttribute && t.getAttribute("data-selact");
    if (a === "pdf" || a === "word") { OPT[a] = t.checked; saveOpt(); }
    if (a === "annexes") { OPT.annexes = t.value; saveOpt(); }
  });
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-selact]"); if (!b) return;
    ev.preventDefault();
    var a = b.getAttribute("data-selact");
    if (a === "clear") { SEL = { docs: {}, ann: {} }; selSync(); }
    if (a === "zip" && !OPT.busy) makeZip();
    if (a === "recueil" && !OPT.busy) makeRecueil();
  });
