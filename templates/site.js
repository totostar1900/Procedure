(function () {
  "use strict";
  var DATA = JSON.parse(document.getElementById("ref-data").textContent);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var ICON_DL = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 2v8m0 0L4.8 6.8M8 10l3.2-3.2M2.5 13.5h11"/></svg>';
  var STATUT = { "Projet": "projet", "En vigueur": "vigueur", "Abrogé": "abroge", "À rédiger": "prevu" };
  var pill = function (s) { return '<span class="pill ' + (STATUT[s] || "prevu") + '">' + esc(s) + "</span>"; };
  var kb = function (n) { return n > 1048576 ? (n / 1048576).toFixed(1) + " Mo" : Math.max(1, Math.round(n / 1024)) + " Ko"; };
  var fmtDate = function (iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  // ---------- Téléchargements (capacité "downloads") ----------
  var downloadsP = (window.claude && typeof window.claude.use === "function")
    ? window.claude.use("downloads").catch(function () { return null; })
    : Promise.resolve(null);
  var toastTimer;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3800);
  }
  // Les Word sont publiés en base64 (.docx.txt) : décodage avant téléchargement
  async function fetchWord(name) {
    var r = await fetch("word/" + name + ".txt"); if (!r.ok) throw { code: "missing" };
    var b = atob((await r.text()).trim()), u = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return new Blob([u], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }
  async function download(file) {
    var d = await downloadsP;
    if (!d) { toast("Le téléchargement n'est pas disponible dans cette vue. Rechargez la page."); return; }
    try {
      var blob = /^word\//.test(file) ? await fetchWord(file.replace(/^word\//, "")) : await (async function () { var r = await fetch("pdf/" + file); if (!r.ok) throw { code: "missing" }; return r.blob(); })();
      var fname = file.replace(/^word\//, "");
      await d.save({ filename: fname, data: blob });
      toast((/\.docx$/.test(fname) ? "Word" : "PDF") + " enregistré : " + fname);
    } catch (e) {
      if (e && e.code === "declined") return;
      if (e && e.code === "rate_limited") { toast("Une confirmation est déjà ouverte. Réessayez dans un instant."); return; }
      if (e && e.code === "missing") { toast("Fichier introuvable dans cette version du référentiel."); return; }
      toast("Le téléchargement a échoué. Réessayez.");
    }
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-dl]");
    if (b) { ev.preventDefault(); ev.stopPropagation(); download(b.getAttribute("data-dl")); return; }
    if (ev.target.closest("[data-dup],[data-del],[data-new],[data-gen],[data-focus],[data-tab],[data-vact],[data-vrole],[data-vlect],[data-vcsv],[data-vgo],[data-sel],[data-selact],.selchk")) return;
    var o = ev.target.closest("[data-open]");
    if (o) { ev.preventDefault(); go(o.getAttribute("data-open")); return; }
    var j = ev.target.closest("[data-jump]");
    if (j) { var el = document.getElementById(j.getAttribute("data-jump")); if (el) el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); }
  });
  var refLink = function (t, strong) {
    var name = strong ? "<b>" + esc(t.titre) + "</b>" : esc(t.titre);
    if (!t.lien) return name;
    var host = t.lien.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    return '<a class="ref-link" href="' + esc(t.lien) + '" target="_blank" rel="noopener noreferrer">' + name + '</a><div class="cite-src">' + esc(t.lien_type || "Lien") + " · " + esc(host) + "</div>";
  };
  var dlBtn = function (file, label, primary) {
    return '<button type="button" class="btn' + (primary ? " primary" : "") + '" data-dl="' + esc(file) + '">' + ICON_DL + esc(label) + "</button>";
  };

  // ---------- Registre ----------
  var docs = DATA.docs;
  var rows = docs.map(function (d) { return Object.assign({ live: true }, d); })
    .concat(DATA.prevus.map(function (p) { return Object.assign({ live: false, statut: "À rédiger" }, p); }));
  var uniq = function (k) { return rows.map(function (r) { return r[k]; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort(); };

  function fillSelect(id, values, all) {
    $(id).innerHTML = '<option value="">' + all + "</option>" + values.map(function (v) { return '<option>' + esc(v) + "</option>"; }).join("");
  }
  fillSelect("#f-type", uniq("type"), "Tous les types");
  fillSelect("#f-dom", uniq("domaine"), "Tous les domaines");
  fillSelect("#f-stat", ["En vigueur", "Projet", "À rédiger", "Abrogé"], "Tous les statuts");

  var typeOrder = { "Code": 1, "Politique": 2, "Procédure": 3, "Modèle de contrat": 4, "Mode opératoire": 5, "Formulaire": 6 };
  var REG_SHOWN = [];
  function renderRegistre() {
    var q = $("#f-q").value.trim().toLowerCase();
    var t = $("#f-type").value, dm = $("#f-dom").value, st = $("#f-stat").value;
    var list = rows.filter(function (r) {
      if (t && r.type !== t) return false;
      if (dm && r.domaine !== dm) return false;
      if (st && r.statut !== st) return false;
      if (q && (r.id + " " + r.titre + " " + (r.resume || "") + " " + r.domaine).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) {
      if (a.live !== b.live) return a.live ? -1 : 1;
      if (!a.live && a.priorite !== b.priorite) return a.priorite - b.priorite;
      return (typeOrder[a.type] - typeOrder[b.type]) || a.id.localeCompare(b.id);
    });
    $("#reg-body").innerHTML = list.length ? list.map(function (r) {
      if (r.live) {
        return '<tr class="live" data-open="' + esc(r.id) + '">' +
          '<td class="selc"><input type="checkbox" data-sel="doc|' + esc(r.id) + '" aria-label="Sélectionner ' + esc(r.id) + '"></td>' +
          '<td class="ref">' + esc(r.id) + "</td>" +
          '<td><div class="doc-title">' + esc(r.titre) + '</div><div class="doc-sum">' + esc(r.resume) + "</div></td>" +
          "<td>" + esc(r.type) + "</td><td>" + esc(r.domaine) + "</td>" +
          '<td class="num">v' + esc(r.version) + "</td><td>" + pill(r.statut) + (r.projet ? '<div class="cite-src">révision v' + esc(r.projet.version) + " en cours</div>" : "") + "</td>" +
          '<td class="num">' + esc(r.prochaine_revue_label) + "</td>" +
          '<td><div class="row-actions"><button type="button" class="btn" data-open="' + esc(r.id) + '">Consulter</button>' + dlBtn(r.pdf.file, "PDF") + "</div></td></tr>";
      }
      return '<tr class="planned"><td class="selc"></td><td class="ref">' + esc(r.id) + '</td><td><div class="doc-title">' + esc(r.titre) + "</div></td>" +
        "<td>" + esc(r.type) + "</td><td>" + esc(r.domaine) + '</td><td class="num">—</td><td>' + pill(r.statut) + "</td>" +
        '<td><span class="prio p' + r.priorite + '"><i></i>Priorité ' + r.priorite + "</span></td><td></td></tr>";
    }).join("") : '<tr><td colspan="9" class="empty">Aucun document ne correspond à ces critères.</td></tr>';
    REG_SHOWN = list.filter(function (r) { return r.live; }).map(function (r) { return r.id; }); selSync();
    $("#reg-shown").textContent = list.length + " document" + (list.length > 1 ? "s" : "") + " affiché" + (list.length > 1 ? "s" : "");
  }
  ["#f-q", "#f-type", "#f-dom", "#f-stat"].forEach(function (s) { $(s).addEventListener("input", renderRegistre); });

  var n = function (s) { return rows.filter(function (r) { return r.statut === s; }).length; };
  $("#counts").innerHTML =
    '<div class="count"><b>' + n("En vigueur") + "</b>en vigueur</div>" +
    '<div class="count"><b>' + n("Projet") + "</b>en projet</div>" +
    '<div class="count"><b>' + n("À rédiger") + "</b>à rédiger</div>" +
    '<div class="count"><b>' + DATA.prevus.filter(function (p) { return p.priorite === 1; }).length + "</b>prioritaires à rédiger</div>";

  // ---------- Page document ----------
  var spy;
  function renderDoc(d) {
    var v = $("#v-doc");
    var meta = [
      ["Référence", d.id], ["Version", "v" + d.version], ["Statut", d.statut], ["Confidentialité", d.confidentialite],
      ["Propriétaire", d.proprietaire], ["Rédigé par", d.redige_par], ["Vérifié par", d.verifie_par], ["Approuvé par", d.approuve_par],
      ["Date d'approbation", d.date_approbation ? fmtDate(d.date_approbation) : ""], ["Date d'effet", d.date_effet ? fmtDate(d.date_effet) : ""],
      ["Prochaine revue", d.prochaine_revue_label], ["Diffusion", d.diffusion]
    ];
    var tocHtml = d.toc.map(function (t) {
      var range = t.articles.length ? "Art. " + t.articles[0].n + (t.articles.length > 1 ? " à " + t.articles[t.articles.length - 1].n : "") : "";
      return '<li><button type="button" data-jump="' + t.id + '">' + esc(t.label) + "<small>" + range + "</small></button></li>";
    }).join("");
    var annexToc = d.annexes.map(function (a) {
      return '<li><button type="button" data-jump="annexe-' + a.num + '">Annexe ' + a.num + "<small>" + esc(a.titre) + "</small></button></li>";
    }).join("");
    v.innerHTML =
      '<button type="button" class="crumb" data-open="registre">← Registre des documents</button>' +
      '<div class="doc-layout">' +
      '<aside class="side" aria-label="Sommaire"><p class="side-title t-titres">Sommaire</p><ol class="titres">' + tocHtml + "</ol>" +
      '<p class="side-title">Annexes</p><ol>' + annexToc + '<li><button type="button" data-jump="maitrise">Maîtrise du document<small>Historique et références</small></button></li></ol></aside>' +
      '<article style="min-width:0">' +
      '<div class="doc-head"><div><div class="eyebrow">' + esc(d.type) + " · " + esc(d.id) + '</div><h1 class="title">' + esc(d.titre) + "</h1>" +
      '<div>' + pill(d.statut) + ' <span class="cite-src">Version ' + esc(d.version) + " · mise à jour le " + fmtDate(d.historique[0].date) + "</span></div></div>" +
      '<div class="doc-actions">' + (d.modele ? '<button type="button" class="btn primary" data-new="' + esc(d.id) + '">Préparer une convention</button>' + dlBtn(d.pdf.file, "Modèle PDF · " + kb(d.pdf.size)) : dlBtn(d.pdf.file, "PDF complet · " + kb(d.pdf.size), true)) +
        dlBtn("word/" + d.word.file, "Word · " + kb(d.word.size)) +
        '<label class="selchk"><input type="checkbox" data-sel="doc|' + esc(d.id) + '"> Ajouter à la sélection</label>' + "</div></div>" +
      (d.modele ? '<p class="model-note">Ce modèle se remplit par formulaire : chaque donnée est saisie une seule fois, les variantes sont choisies et le Word ou le PDF ne sont produits que lorsque la convention est complète et cohérente. <button type="button" class="doclink" data-open="dossiers">Voir les dossiers en cours</button></p>' : "") +
      (d.projet ? '<div class="rev-banner"><b>Révision en cours.</b> Un projet de version ' + esc(d.projet.version) + " (" + (d.projet.nature_revision === "mineure" ? "correction mineure" : "révision") + ') est en cours de visa. Cette version ' + esc(d.version) + ' reste celle qui fait foi jusqu\'à son adoption. <button type="button" class="doclink" data-open="' + esc(d.id) + '~projet">Voir le projet de révision</button></div>' : "") +
      (d.estProjet ? '<div class="rev-banner proj"><b>Projet de révision, version ' + esc(d.version) + ".</b> " + (d.nature_revision === "mineure" ? "Correction mineure : les lectures déjà faites restent valables." : "Révision : une nouvelle lecture sera demandée aux personnes concernées après l'adoption.") + ' La version en vigueur reste la ' + esc(docs.filter(function (x) { return x.projet === d; })[0].version) + '. <button type="button" class="doclink" data-open="' + esc(d.id) + '">Voir la version en vigueur</button></div>' : "") +
      (d.notes_redaction && d.notes_redaction.length ? '<div class="notice"><b>Points à valider avant adoption</b><ul>' + d.notes_redaction.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" : "") +
      '<dl class="meta">' + meta.map(function (m) { return "<div><dt>" + m[0] + "</dt><dd" + (m[1] ? "" : ' class="unset"') + ">" + esc(m[1] || "À compléter à l'adoption") + "</dd></div>"; }).join("") + "</dl>" +
      '<div id="doc-visas" class="visas-box" aria-live="polite"></div>' +
      '<div class="doc-body">' + d.html + "</div>" +
      '<h2 class="section-h" id="annexes">Annexes</h2>' +
      '<p class="lead" style="margin-bottom:18px">Chaque annexe se télécharge séparément, au format A4, prête à imprimer et à signer.</p>' +
      d.annexes.map(function (a) {
        return '<section class="annex" id="annexe-' + a.num + '"><div class="annex-top"><div>' +
          '<div class="eyebrow">Annexe ' + a.num + " · " + esc(a.id) + "</div><h3>" + esc(a.titre) + "</h3>" +
          '<div class="annex-usage"><span><b>Renseigné par</b> ' + esc(a.renseigne_par) + "</span><span><b>Fréquence</b> " + esc(a.frequence) + "</span><span><b>Conservé par</b> " + esc(a.conserve_par) + "</span></div></div>" +
          '<div class="annex-dl">' + dlBtn(a.pdf.file, "Annexe " + a.num + " · PDF") + dlBtn("word/" + a.word.file, "Word") + '<label class="selchk"><input type="checkbox" data-sel="ann|' + esc(d.id) + "|" + a.num + '"> Sélectionner</label></div></div>' +
          '<details><summary>Aperçu du formulaire</summary><div class="preview"><div class="doc-body">' + a.html + "</div></div></details></section>";
      }).join("") +
      '<h2 class="section-h" id="maitrise">Maîtrise du document</h2>' +
      '<p class="side-title">Historique des révisions</p><div class="table-scroll" style="border:0"><table class="plain"><thead><tr><th>Version</th><th>Date</th><th>Objet</th><th>Par</th></tr></thead><tbody>' +
      d.historique.map(function (h) { return '<tr><td class="num">' + esc(h.version) + '</td><td class="num">' + fmtDate(h.date) + "</td><td>" + esc(h.objet) + "</td><td>" + esc(h.par) + "</td></tr>"; }).join("") +
      '</tbody></table></div><p class="side-title panel-gap">Textes de référence</p><div class="table-scroll" style="border:0"><table class="plain"><thead><tr><th>Texte</th><th>Dispositions concernées</th></tr></thead><tbody>' +
      d.references.map(function (r) { var t = DATA.references[r.ref] || {}; return "<tr><td>" + (t.titre ? refLink(t) : esc(r.ref)) + '<div class="cite-src">' + esc(t.emetteur || "") + "</div></td><td>" + esc(r.articles) + "</td></tr>"; }).join("") +
      "</tbody></table></div></article></div>";

    if (spy) spy.disconnect();
    var btns = v.querySelectorAll(".side ol.titres button");
    if ("IntersectionObserver" in window) {
      spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) btns.forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-jump") === e.target.id); });
        });
      }, { rootMargin: "-90px 0px -70% 0px" });
      v.querySelectorAll(".doc-body > h2").forEach(function (h) { spy.observe(h); });
    }
  }

  // ---------- Glossaire, correspondance, circuit ----------
  $("#gloss").innerHTML = DATA.glossaire.map(function (g) { return "<div><dt>" + esc(g.terme) + "</dt><dd>" + esc(g.definition) + "</dd></div>"; }).join("");

  var corr = Object.keys(DATA.references).map(function (k) {
    var t = DATA.references[k];
    var uses = docs.filter(function (d) { return d.references.some(function (r) { return r.ref === k; }); }).map(function (d) {
      var r = d.references.filter(function (x) { return x.ref === k; })[0];
      return '<div><button type="button" class="doclink" data-open="' + esc(d.id) + '">' + esc(d.id) + " · " + esc(d.titre) + '</button><div class="cite-src">' + esc(r.articles) + "</div></div>";
    }).join("");
    return "<tr><td>" + refLink(t, true) + '<div class="cite-src">' + esc(t.objet) + "</div></td><td>" + esc(t.emetteur) + "</td><td>" + (uses || '<span class="cite-src">Aucun document à ce jour</span>') + "</td></tr>";
  }).join("");
  $("#corr-body").innerHTML = corr;

  $("#niv-body").innerHTML = DATA.niveaux.map(function (l) {
    return "<tr><td><b>" + esc(l.type) + '</b><div class="cite-src">PC-' + esc(l.prefixe) + "-…</div></td><td>" + esc(l.redaction) + "</td><td>" + esc(l.verification) + "</td><td>" + esc(l.approbation) + "</td><td>" + esc(l.revue) + "</td></tr>";
  }).join("");

  // ---------- Navigation ----------
  var VIEWS = ["registre", "doc", "glossaire", "correspondance", "circuit", "dossiers", "dossier", "visas"];
  function go(target) {
    if (target === "registre") target = "";
    if (location.hash.slice(1) === target) route(); else location.hash = target;
  }
  function route() {
    var h = decodeURIComponent(location.hash.slice(1));
    var hid = h.replace(/~projet$/, "");
    var doc = docs.filter(function (d) { return d.id === hid; })[0];
    if (doc && /~projet$/.test(h) && doc.projet) doc = doc.projet;
    var dz = /^d-[A-Za-z0-9_-]+$/.test(h);
    var view = doc ? "doc" : dz ? "dossier" : (VIEWS.indexOf(h) > 0 && h !== "dossier" ? h : "registre");
    if (view !== "dossier" && cur) { if (cur.dirty) saveNow(); cur = null; }
    VIEWS.forEach(function (v) { $("#v-" + v).hidden = v !== view; });
    document.querySelectorAll(".nav button").forEach(function (b) {
      var on = b.getAttribute("data-open") === view || (view === "doc" && b.getAttribute("data-open") === "registre") || (view === "dossier" && b.getAttribute("data-open") === "dossiers");
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    if (doc) { renderDoc(doc); renderDocVisas(doc); }
    selSync();
    if (view === "dossiers") renderDossiers();
    if (view === "visas") renderVisas();
    if (view === "dossier") openDossier(h.slice(2));
    window.scrollTo(0, 0);
  }
/*GENERATOR*/
/*VISAS*/
/*SELECTION*/
  window.addEventListener("hashchange", route);
  renderRegistre();
  route();
})();
