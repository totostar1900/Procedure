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
    return d.toLocaleDateString((window.PCI18N ? PCI18N.locale : "fr-FR"), { day: "numeric", month: "long", year: "numeric" });
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
  // ---------- Double validation ----------
  // Toute action qui engage un document, le référentiel ou son organisation passe par cette fenêtre :
  // récapitulatif de ce qui va se passer, puis la personne écrit elle-même l'action à réaliser pour l'activer.
  var normTxt = function (t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’'`]/g, "'").replace(/\s+/g, " ").trim(); };
  function confirmer(o) {
    return new Promise(function (resolve) {
      var prev = document.activeElement;
      var el = document.createElement("div"); el.className = "cfm-scrim";
      var tabs = o.onglets && o.onglets.length ? '<div class="cfm-tabs" role="tablist">' + o.onglets.map(function (t, i) { return '<button type="button" role="tab" data-cfmtab="' + i + '" aria-selected="' + (i === 0) + '">' + esc(t.titre) + "</button>"; }).join("") + "</div>" +
        o.onglets.map(function (t, i) { return '<div class="cfm-pane" data-cfmpane="' + i + '"' + (i ? " hidden" : "") + ">" + t.html + "</div>"; }).join("") : "";
      el.innerHTML = '<div class="cfm' + (o.large ? " large" : "") + '" role="dialog" aria-modal="true" aria-labelledby="cfm-t">' +
        '<h2 id="cfm-t">' + esc(o.titre) + "</h2>" + (o.html || "") +
        (o.points && o.points.length ? '<ul class="cfm-pts">' + o.points.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" : "") + tabs +
        '<div class="cfm-sign"><label for="cfm-in">Pour confirmer, écrivez : <b class="cfm-phrase">' + esc(o.phrase) + '</b></label><input id="cfm-in" type="text" autocomplete="off" spellcheck="false"></div>' +
        '<div class="visa-btns"><button type="button" class="btn primary' + (o.danger ? " danger" : "") + '" id="cfm-ok" disabled>' + esc(o.bouton || "Confirmer") + '</button><button type="button" class="btn" id="cfm-no">Annuler</button></div></div>';
      document.body.appendChild(el); document.body.classList.add("has-drawer");
      var inp = el.querySelector("#cfm-in"), ok = el.querySelector("#cfm-ok");
      var fin = function (v) { el.remove(); if (!document.querySelector(".cfm-scrim") && $("#drawer").hidden) document.body.classList.remove("has-drawer"); if (prev && prev.focus) try { prev.focus(); } catch (e) { /* élément disparu */ } resolve(v); };
      inp.addEventListener("input", function () { ok.disabled = (window.PCI18N ? PCI18N.phrases(o.phrase) : [o.phrase]).map(normTxt).indexOf(normTxt(inp.value)) < 0; });
      inp.addEventListener("paste", function (e) { e.preventDefault(); toast("Écrivez la phrase vous-même : c'est ce qui confirme votre intention."); });
      el.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Escape") fin(false); if (e.key === "Enter" && !ok.disabled && e.target === inp) fin(true); });
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        var t = e.target.closest("[data-cfmtab]");
        if (t) { var i = t.getAttribute("data-cfmtab"); el.querySelectorAll("[data-cfmtab]").forEach(function (b) { b.setAttribute("aria-selected", String(b === t)); }); el.querySelectorAll("[data-cfmpane]").forEach(function (p) { p.hidden = p.getAttribute("data-cfmpane") !== i; }); return; }
        if (e.target === el || e.target.closest("#cfm-no")) fin(false);
        else if (e.target.closest("#cfm-ok") && !ok.disabled) fin(true);
      });
      setTimeout(function () { inp.focus(); }, 30);
    });
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
    var sb = ev.target.closest("[data-sort]");
    if (sb) { ev.preventDefault(); sortBy(sb.getAttribute("data-sort")); return; }
    var dz = ev.target.closest("[data-drawer-close]");
    if (dz) { ev.preventDefault(); closeDrawer(); return; }
    var b = ev.target.closest("[data-dl]");
    if (b) { ev.preventDefault(); ev.stopPropagation(); download(b.getAttribute("data-dl")); return; }
    if (ev.target.closest("[data-vlectsave],[data-ed],[data-edit-doc],[data-ediff],[data-dup],[data-del],[data-new],[data-gen],[data-focus],[data-tab],[data-vact],[data-vrole],[data-vlect],[data-vcsv],[data-vgo],[data-sel],[data-selact],.selchk")) return;
    var pk = ev.target.closest("[data-peek]");
    if (pk && !ev.target.closest("[data-open]")) { ev.preventDefault(); openDrawer(pk.getAttribute("data-peek"), pk); return; }
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
  // Accès « employé » : la page ne contient que ses documents ; le menu se réduit à « Mes documents »
  var RESTREINT = !!DATA.restreint;
  if (RESTREINT) {
    document.body.classList.add("restreint");
    document.querySelectorAll(".nav [data-open]").forEach(function (b) { b.hidden = b.getAttribute("data-open") !== "mesdocs" && b.getAttribute("data-open") !== "guide"; });
    document.querySelectorAll('.brand[data-open], .mbar-brand').forEach(function (b) { b.setAttribute("data-open", "mesdocs"); });
  }
  var rows = docs.map(function (d) { return Object.assign({ live: true }, d); })
    .concat(DATA.prevus.map(function (p) { return Object.assign({ live: false, statut: "À rédiger" }, p); }));
  var uniq = function (k) { return rows.map(function (r) { return r[k]; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort(); };

  function fillSelect(id, values, all) {
    $(id).innerHTML = '<option value="">' + all + "</option>" + values.map(function (v) { return '<option>' + esc(v) + "</option>"; }).join("");
  }
  fillSelect("#f-type", uniq("type"), "Tous les types");
  fillSelect("#f-dom", uniq("domaine"), "Tous les domaines");
  fillSelect("#f-stat", ["En vigueur", "Projet", "À rédiger", "Abrogé"], "Tous les statuts");

  var SORT = { col: null, dir: 1 };
  try { var ss = JSON.parse(localStorage.getItem("pc-ref-tri") || "null"); if (ss && ss.col) SORT = ss; } catch (e) { /* stockage indisponible */ }
  var STAT_ORDER = { "En vigueur": 1, "Projet": 2, "À rédiger": 3, "Abrogé": 4 };
  var verNum = function (v) { var p = String(v || "0").split("."); return (+p[0] || 0) * 1000 + (+p[1] || 0); };
  var sortKey = {
    id: function (r) { return r.id; }, titre: function (r) { return r.titre; }, type: function (r) { return (typeOrder[r.type] || 9) + r.type; },
    domaine: function (r) { return r.domaine || ""; }, version: function (r) { return r.live ? verNum(r.version) : -1; },
    statut: function (r) { return STAT_ORDER[r.statut] || 9; },
    revue: function (r) { var v = String(r.prochaine_revue || ""); return /^\d{4}-\d{2}-\d{2}$/.test(v) ? "0" + v : "1" + (r.prochaine_revue_label || "~"); }
  };
  function sortBy(col) {
    if (SORT.col !== col) SORT = { col: col, dir: 1 }; else if (SORT.dir === 1) SORT.dir = -1; else SORT = { col: null, dir: 1 };
    try { localStorage.setItem("pc-ref-tri", JSON.stringify(SORT)); } catch (e) { /* stockage indisponible */ }
    renderRegistre();
  }
  var typeOrder = { "Code": 1, "Politique": 2, "Procédure": 3, "Modèle de contrat": 4, "Mode opératoire": 5, "Formulaire": 6 };
  var REG_SHOWN = [];
  function renderRegistre() {
    var q = $("#f-q").value.trim().toLowerCase();
    var t = $("#f-type").value, dm = $("#f-dom").value, st = $("#f-stat").value;
    var list = rows.filter(function (r) {
      if (etatOf(r.id)) return false; // abrogés et supprimés : page Archives
      if (t && r.type !== t) return false;
      if (dm && r.domaine !== dm) return false;
      if (st && r.statut !== st) return false;
      if (q && (r.id + " " + r.titre + " " + (r.resume || "") + " " + r.domaine).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) {
      if (SORT.col) {
        var ka = sortKey[SORT.col](a), kb2 = sortKey[SORT.col](b);
        var c = typeof ka === "number" ? ka - kb2 : String(ka).localeCompare(String(kb2), "fr", { numeric: true, sensitivity: "base" });
        if (c) return c * SORT.dir;
        return a.id.localeCompare(b.id);
      }
      if (a.live !== b.live) return a.live ? -1 : 1;
      if (!a.live && a.priorite !== b.priorite) return a.priorite - b.priorite;
      return (typeOrder[a.type] - typeOrder[b.type]) || a.id.localeCompare(b.id);
    });
    $("#reg-body").innerHTML = list.length ? list.map(function (r) {
      if (r.live) {
        return '<tr class="live" data-peek="' + esc(r.id) + '" tabindex="0" aria-label="Aperçu de ' + esc(r.id) + '">' +
          '<td class="selc"><input type="checkbox" data-sel="doc|' + esc(r.id) + '" aria-label="Sélectionner ' + esc(r.id) + '"></td>' +
          '<td class="ref">' + esc(r.id) + "</td>" +
          '<td><div class="doc-title">' + esc(r.titre) + "</div></td>" +
          "<td>" + esc(r.type) + "</td><td>" + esc(r.domaine) + "</td>" +
          '<td class="num">v' + esc(r.version) + "</td><td>" + pill(r.statut) + (r.projet ? '<div class="cite-src">révision v' + esc(r.projet.version) + " en cours</div>" : "") + "</td>" +
          '<td class="num">' + esc(r.prochaine_revue_label) + "</td>" +
          '<td><div class="row-actions"><button type="button" class="btn" data-open="' + esc(r.id) + '">Ouvrir</button>' + dlBtn(r.pdf.file, "PDF") + "</div></td></tr>";
      }
      return '<tr class="planned"><td class="selc"></td><td class="ref">' + esc(r.id) + '</td><td><div class="doc-title">' + esc(r.titre) + "</div></td>" +
        "<td>" + esc(r.type) + "</td><td>" + esc(r.domaine) + '</td><td class="num">—</td><td>' + pill(r.statut) + "</td>" +
        '<td><span class="prio p' + r.priorite + '"><i></i>Priorité ' + r.priorite + "</span></td><td></td></tr>";
    }).join("") : '<tr><td colspan="9" class="empty">Aucun document ne correspond à ces critères.</td></tr>';
    document.querySelectorAll("th[data-sortcol]").forEach(function (th) {
      var on = th.getAttribute("data-sortcol") === SORT.col;
      th.setAttribute("aria-sort", on ? (SORT.dir === 1 ? "ascending" : "descending") : "none");
    });
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
      (RESTREINT ? '<button type="button" class="crumb" data-open="mesdocs">← Mes documents</button>' : '<button type="button" class="crumb" data-open="registre">← Registre des documents</button>') +
      '<div class="doc-layout">' +
      '<aside class="side" aria-label="Sommaire"><p class="side-title t-titres">Sommaire</p><ol class="titres">' + tocHtml + "</ol>" +
      '<p class="side-title">Annexes</p><ol>' + annexToc + '<li><button type="button" data-jump="maitrise">Maîtrise du document<small>Historique et références</small></button></li></ol></aside>' +
      '<article style="min-width:0"><div id="doc-revbar" class="revbar-slot" aria-live="polite"></div>' +
      '<div class="doc-head"><div><div class="eyebrow">' + esc(d.type) + " · " + esc(d.id) + '</div><h1 class="title">' + esc(d.titre) + "</h1>" +
      '<div>' + pill(d.statut) + ' <span class="cite-src">Version ' + esc(d.version) + " · mise à jour le " + fmtDate(d.historique[0].date) + "</span></div></div>" +
      '<div class="doc-actions">' + (d.modele ? '<button type="button" class="btn primary" data-new="' + esc(d.id) + '">Préparer une convention</button>' + dlBtn(d.pdf.file, "Modèle PDF · " + kb(d.pdf.size)) : dlBtn(d.pdf.file, "PDF complet · " + kb(d.pdf.size), true)) +
        dlBtn("word/" + d.word.file, "Word · " + kb(d.word.size)) +
        '<label class="selchk"><input type="checkbox" data-sel="doc|' + esc(d.id) + '"> Ajouter à la sélection</label>' + "</div></div>" +
      '<div id="doc-edit"></div><div id="doc-admin"></div>' +
      (d.modele ? '<p class="model-note">Ce modèle se remplit par formulaire : chaque donnée est saisie une seule fois, les variantes sont choisies et le Word ou le PDF ne sont produits que lorsque la convention est complète et cohérente. <button type="button" class="doclink" data-open="dossiers">Voir les dossiers en cours</button></p>' : "") +
      (d.projet ? '<div class="rev-banner"><b>Révision en cours.</b> Un projet de version ' + esc(d.projet.version) + " (" + (d.projet.nature_revision === "mineure" ? "correction mineure" : "révision") + ') est en cours de visa. Cette version ' + esc(d.version) + ' reste celle qui fait foi jusqu\'à son adoption. <button type="button" class="doclink" data-open="' + esc(d.id) + '~projet">Voir le projet de révision</button></div>' : "") +
      (d.estProjet ? '<div class="rev-banner proj"><b>Projet de révision, version ' + esc(d.version) + ".</b> " + (d.nature_revision === "mineure" ? "Correction mineure : les lectures déjà faites restent valables." : "Révision : une nouvelle lecture sera demandée aux personnes concernées après l'adoption.") + ' La version en vigueur reste la ' + esc(docs.filter(function (x) { return x.projet === d; })[0].version) + '. <button type="button" class="doclink" data-open="' + esc(d.id) + '">Voir la version en vigueur</button></div>' : "") +
      (d.notes_redaction && d.notes_redaction.length && d.statut !== "En vigueur" ? '<div class="notice"><b>Points à valider avant adoption</b><ul>' + d.notes_redaction.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" : "") +
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

  // ---------- Aperçu d'un document (panneau latéral) ----------
  var drawerFrom = null;
  function openDrawer(id, from) {
    var d = docs.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    drawerFrom = from || document.activeElement;
    var dr = $("#drawer");
    var meta = [["Type", d.type], ["Domaine", d.domaine], ["Propriétaire", d.proprietaire], ["Approuvé par", d.approuve_par],
      ["Date d'effet", d.date_effet ? fmtDate(d.date_effet) : "À l'adoption"], ["Prochaine revue", d.prochaine_revue_label], ["Confidentialité", d.confidentialite], ["Diffusion", d.diffusion]];
    dr.innerHTML =
      '<div class="dr-head"><div class="eyebrow">' + esc(d.type) + " · " + esc(d.id) + '</div>' +
      '<button type="button" class="dr-x" data-drawer-close aria-label="Fermer l\'aperçu"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg></button></div>' +
      '<div class="dr-body"><h2 id="drawer-title" class="dr-title">' + esc(d.titre) + "</h2>" +
      '<div class="dr-status">' + pill(d.statut) + ' <span class="cite-src">Version ' + esc(d.version) + " · mise à jour le " + fmtDate(d.historique[0].date) + "</span>" +
      (d.projet ? '<div class="cite-src">Révision v' + esc(d.projet.version) + " en cours de visa</div>" : "") + "</div>" +
      '<p class="dr-sum">' + esc(d.resume) + "</p>" +
      '<div class="dr-acts"><button type="button" class="btn primary" data-open="' + esc(d.id) + '">Ouvrir le document</button>' + dlBtn(d.pdf.file, "PDF · " + kb(d.pdf.size)) + dlBtn("word/" + d.word.file, "Word") +
      '<label class="selchk"><input type="checkbox" data-sel="doc|' + esc(d.id) + '"> Sélection</label></div>' +
      (typeof drawerVisasHtml === "function" ? drawerVisasHtml(d) : "") +
      '<p class="side-title">Fiche</p><dl class="dr-meta">' + meta.map(function (m) { return "<div><dt>" + esc(m[0]) + "</dt><dd>" + esc(m[1] || "—") + "</dd></div>"; }).join("") + "</dl>" +
      '<p class="side-title">Sommaire</p><ol class="dr-toc">' + d.toc.map(function (t) { return "<li>" + esc(t.label) + "</li>"; }).join("") + "</ol>" +
      (d.annexes.length ? '<p class="side-title">Annexes</p><ul class="dr-ann">' + d.annexes.map(function (a) {
        return '<li><div><b>Annexe ' + a.num + "</b> " + esc(a.titre) + '</div><div class="dr-ann-dl">' + dlBtn(a.pdf.file, "PDF") + dlBtn("word/" + a.word.file, "Word") + "</div></li>";
      }).join("") + "</ul>" : "") +
      (d.notes_redaction && d.notes_redaction.length && d.statut !== "En vigueur" ? '<div class="notice"><b>' + d.notes_redaction.length + " point" + (d.notes_redaction.length > 1 ? "s" : "") + " à valider avant adoption</b></div>" : "") +
      "</div>";
    dr.hidden = false; $("#drawer-scrim").hidden = false;
    document.body.classList.add("has-drawer");
    requestAnimationFrame(function () { dr.classList.add("open"); });
    document.querySelectorAll("tr[data-peek]").forEach(function (t) { t.classList.toggle("peeked", t.getAttribute("data-peek") === id); });
    selSync();
    var x = dr.querySelector(".dr-x"); if (x) x.focus();
  }
  function closeDrawer() {
    var dr = $("#drawer"); if (dr.hidden) return;
    dr.classList.remove("open"); $("#drawer-scrim").hidden = true; document.body.classList.remove("has-drawer");
    document.querySelectorAll("tr.peeked").forEach(function (t) { t.classList.remove("peeked"); });
    setTimeout(function () { dr.hidden = true; }, 200);
    if (drawerFrom && drawerFrom.focus && document.contains(drawerFrom)) drawerFrom.focus();
  }
  $("#drawer-scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") { if (!$("#drawer").hidden) closeDrawer(); else if (document.body.classList.contains("rail-open")) railMobile(false); return; }
    if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches && ev.target.matches("tr[data-peek]")) { ev.preventDefault(); openDrawer(ev.target.getAttribute("data-peek"), ev.target); }
  });

  // ---------- Rail de navigation ----------
  // Rail : masquer / afficher (mémorisé) ; rail masqué, le survol du bord gauche l'affiche temporairement
  function railFold(on) {
    document.body.classList.toggle("rail-folded", on); document.body.classList.remove("rail-peek");
    var b = $("#rail-fold"); b.setAttribute("aria-label", on ? "Garder le menu affiché" : "Masquer le menu"); b.title = b.getAttribute("aria-label");
    try { localStorage.setItem("pc-ref-rail", on ? "1" : "0"); } catch (e) { /* stockage indisponible */ }
  }
  function railMobile(on) { document.body.classList.toggle("rail-open", on); $("#rail-scrim").hidden = !on; }
  try { if (localStorage.getItem("pc-ref-rail") === "1") railFold(true); } catch (e) { /* stockage indisponible */ }
  var peekT = null;
  var peek = function (on) { clearTimeout(peekT); peekT = null; if (on) document.body.classList.add("rail-peek"); else peekT = setTimeout(function () { document.body.classList.remove("rail-peek"); peekT = null; }, 250); };
  $("#rail-fold").addEventListener("click", function () { railFold(!document.body.classList.contains("rail-folded") ? true : false); });
  $("#rail-show").addEventListener("click", function () { railFold(false); });
  $("#rail-edge").addEventListener("mouseenter", function () { peek(true); });
  // Le menu reste ouvert tant que la souris est dessus ; il se replie dès qu'elle s'en éloigne (suivi de la position, plus fiable que mouseleave quand le menu glisse sous le pointeur)
  document.addEventListener("mousemove", function (ev) {
    var b = document.body; if (!b.classList.contains("rail-folded") || !b.classList.contains("rail-peek")) return;
    var r = $("#rail").getBoundingClientRect();
    if (ev.clientX <= r.right + 16) { clearTimeout(peekT); peekT = null; } else if (!peekT) peek(false);
  });
  $("#rail-open").addEventListener("click", function () { railMobile(true); });
  $("#rail-scrim").addEventListener("click", function () { railMobile(false); });

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


  // ---------- Navigation ----------
  var VIEWS = ["registre", "doc", "glossaire", "correspondance", "circuit", "dossiers", "dossier", "visas", "atraiter", "archives", "edition", "mesdocs", "nouveau", "tableau", "guide"];
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
    var ed = /^edition\/[A-Za-z0-9-]+$/.test(h);
    var view = doc ? "doc" : dz ? "dossier" : ed ? "edition" : (VIEWS.indexOf(h) > 0 && h !== "dossier" && h !== "edition" ? h : "registre");
    if (RESTREINT && view !== "doc" && view !== "guide") view = "mesdocs";
    if (view !== "edition" && E) { if (E.dirty) saveDraft(); E = null; }
    if (view !== "dossier" && cur) { if (cur.dirty) saveNow(); cur = null; }
    VIEWS.forEach(function (v) { $("#v-" + v).hidden = v !== view; });
    document.querySelectorAll(".nav button").forEach(function (b) {
      var on = b.getAttribute("data-open") === view || (view === "doc" && b.getAttribute("data-open") === "registre") || (view === "dossier" && b.getAttribute("data-open") === "dossiers");
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    closeDrawer(); railMobile(false);
    if (doc) { renderDoc(doc); renderDocVisas(doc); }
    selSync();
    if (view === "dossiers") renderDossiers();
    if (view === "visas") renderVisas();
    if (view === "atraiter") renderATraiter();
    if (view === "tableau") renderTableau();
    if (view === "guide") renderGuide();
    if (view === "circuit") renderCircuit();
    if (view === "archives") renderArchives();
    if (view === "edition") openEditor(h.slice(8));
    if (view === "mesdocs") renderMesDocs();
    if (view === "nouveau") renderNouveau();
    if (view === "dossier") openDossier(h.slice(2));
    window.scrollTo(0, 0);
  }
/*GENERATOR*/
/*VISAS*/
/*SELECTION*/
/*EDITEUR*/
/*TABLEAU*/
/*GUIDE*/
  window.addEventListener("hashchange", route);
  renderRegistre();
  route();
})();
