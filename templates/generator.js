  // =====================================================================
  // Dossiers d'opération et générateur de conventions (Word + PDF)
  // Inséré dans site.js : partage DATA, docs, $, esc, toast, go, downloadsP.
  // =====================================================================
  var E = window.RefEngine;
  var MODELS = docs.filter(function (d) { return d.modele; });
  var LIBS = {
    marked: { url: "https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js", global: "marked" },
    docx: { url: "https://cdn.jsdelivr.net/npm/docx@9.0.2/build/index.umd.js", global: "docx" },
    pdfmake: { url: "https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/pdfmake.min.js", global: "pdfMake" },
    mammoth: { url: "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js", global: "mammoth" },
    turndown: { url: "https://cdn.jsdelivr.net/npm/turndown@7.2.0/dist/turndown.js", global: "TurndownService" },
    gfm: { url: "https://cdn.jsdelivr.net/npm/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js", global: "turndownPluginGfm" }
  };
  var libP = {};
  function loadLib(name) {
    var L = LIBS[name];
    if (window[L.global]) return Promise.resolve(window[L.global]);
    if (!libP[name]) libP[name] = new Promise(function (ok, ko) {
      var s = document.createElement("script"); s.src = L.url; s.async = true;
      s.onload = function () { window[L.global] ? ok(window[L.global]) : ko(new Error("Bibliothèque indisponible : " + name)); };
      s.onerror = function () { libP[name] = null; ko(new Error("Chargement impossible : " + name)); };
      document.head.appendChild(s);
    });
    return libP[name];
  }
  var useCap = function (n) { return (window.claude && typeof window.claude.use === "function") ? window.claude.use(n).catch(function () { return null; }) : Promise.resolve(null); };
  var dbP = useCap("db"), userP = useCap("user");
  var SESSION = Math.random().toString(36).slice(2, 10);
  var LS_KEY = "pc-ref-dossiers";
  var me = { id: null }, store = null, dossiers = [], dbReady = false, readOnly = false;
  var cur = null; // dossier ouvert : {id, model, data, dirty, saving, savedAt, tab}
  var names = {};

  function modelOf(id) { return MODELS.filter(function (m) { return m.id === id; })[0]; }
  function nowIso() { return new Date().toISOString(); }
  function plain(s) { return String(s || "").replace(/\\([\\`*_[\]|])/g, "$1").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim(); }
  function intitule(model, values) {
    var t = model.modele.schema.intitule || "{{emetteur_nom}}";
    var s = plain(E.render(t, model.modele.schema, values, "rempli", { societe: DATA.societe }));
    s = s.replace(/^\s*·\s*|\s*·\s*$/g, "");
    return s || "Nouvelle convention (à compléter)";
  }
  function heure(iso) { if (!iso) return ""; var d = new Date(iso); return d.toLocaleDateString((window.PCI18N ? PCI18N.locale : "fr-FR"), { day: "numeric", month: "short" }) + (window.PCI18N && PCI18N.lang === "en" ? ", " : " à ") + d.toLocaleTimeString((window.PCI18N ? PCI18N.locale : "fr-FR"), { hour: "2-digit", minute: "2-digit" }); }

  // ---------- Stockage ----------
  function lsRead() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; } }
  function lsWrite(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) { /* stockage local indisponible */ } }
  Promise.all([dbP, userP]).then(async function (r) {
    store = r[0]; var user = r[1];
    if (user) { try { me = await user.me(); var w = await user.can("data.write"); if (w === false) readOnly = true; } catch (e) { /* lecture seule par défaut */ } }
    if (store) {
      store.collection("dossiers").orderBy("maj_le", "desc").limit(300).onSnapshot(function (snap) {
        dossiers = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
        dbReady = true; resolveNames(); renderDossiers(); onRemote();
      }, function () { store = null; dossiers = lsRead(); dbReady = true; renderDossiers(); });
    } else { dossiers = lsRead(); dbReady = true; renderDossiers(); }
  });
  async function resolveNames() {
    var user = await userP; if (!user) return;
    var ids = dossiers.reduce(function (a, d) { [d.maj_par, d.cree_par].forEach(function (x) { if (x && a.indexOf(x) < 0) a.push(x); }); return a; }, []);
    if (!ids.length) return;
    try { var ps = await user.profiles(ids); Object.keys(ps).forEach(function (k) { names[k] = ps[k].name || ""; }); renderDossiers(); if (cur) renderSide(); } catch (e) { /* noms indisponibles */ }
  }
  var who = function (id) { return id && names[id] ? names[id] : ""; };

  function persist(d) {
    d.maj_le = nowIso(); d.maj_par = me.id || null; d.maj_session = SESSION;
    if (store) { var body = JSON.parse(JSON.stringify(d)); delete body.id; return store.doc("dossiers/" + d.id).set(body); }
    var list = lsRead().filter(function (x) { return x.id !== d.id; }); list.unshift(d); lsWrite(list); dossiers = list; renderDossiers();
    return Promise.resolve();
  }
  var saveTimer = null;
  function scheduleSave() {
    if (!cur || readOnly) return;
    cur.dirty = true; renderSaveState();
    clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 1200);
  }
  async function saveNow() {
    if (!cur || !cur.dirty || readOnly) return;
    if (cur.saving) { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 600); return; }
    cur.saving = true; cur.dirty = false; renderSaveState();
    var v = E.validate(cur.model.modele.schema, cur.data.valeurs);
    cur.data.titre = intitule(cur.model, cur.data.valeurs);
    cur.data.manquants = v.missing.length; cur.data.erreurs = v.errors.length;
    try { await persist(cur.data); cur.savedAt = nowIso(); cur.error = null; }
    catch (e) {
      cur.dirty = true;
      cur.error = e && e.code === "quota_exceeded" ? "Capacité de stockage atteinte : supprimez d'anciens dossiers." : e && e.code === "invalid_argument" ? "Vous n'avez pas les droits d'écriture sur ce référentiel." : "Enregistrement impossible pour l'instant. Nouvel essai automatique.";
      if (e && e.code === "invalid_argument") readOnly = true; else { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 4000); }
    }
    cur.saving = false; renderSaveState();
  }
  function onRemote() {
    if (!cur) return;
    var d = dossiers.filter(function (x) { return x.id === cur.id; })[0];
    if (!d) { if (cur.data.maj_le && store && !cur.saving) { toast("Ce dossier a été supprimé."); cur = null; go("dossiers"); } return; }
    if (d.maj_session !== SESSION && !cur.dirty && !cur.saving && d.maj_le > (cur.data.maj_le || "")) {
      cur.data = JSON.parse(JSON.stringify(d)); renderEditor(); toast("Dossier mis à jour par " + (who(d.maj_par) || "un collègue") + ".");
    }
  }

  // ---------- Création ----------
  function defaults(model) {
    var v = {};
    E.fields(model.modele.schema).forEach(function (f) {
      if (f.defaut != null) v[f.id] = f.defaut;
      if (f.source && DATA.societe && !E.isEmpty(DATA.societe[f.source])) v[f.id] = DATA.societe[f.source];
    });
    return v;
  }
  async function createDossier(modelId, fromValues) {
    if (readOnly) { toast("Vous consultez ce référentiel en lecture seule."); return; }
    var model = modelOf(modelId);
    var id = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var d = {
      id: id, modele: model.id, modele_version: model.version, valeurs: fromValues ? JSON.parse(JSON.stringify(fromValues)) : defaults(model),
      edition: "projet", cree_le: nowIso(), cree_par: me.id || null, exports: []
    };
    d.titre = intitule(model, d.valeurs);
    try { await persist(d); } catch (e) { toast("Création impossible : vérifiez vos droits d'écriture."); return; }
    if (!store) dossiers = lsRead();
    else dossiers.unshift(d);
    go("d-" + id);
  }
  document.addEventListener("click", function (ev) {
    var n = ev.target.closest("[data-new]"); if (n) { ev.preventDefault(); createDossier(n.getAttribute("data-new")); return; }
    var dup = ev.target.closest("[data-dup]"); if (dup) { var src = dossiers.filter(function (x) { return x.id === dup.getAttribute("data-dup"); })[0]; if (src) createDossier(src.modele, src.valeurs); return; }
    var del = ev.target.closest("[data-del]");
    if (del) {
      if (del.getAttribute("data-armed") !== "1") { del.setAttribute("data-armed", "1"); del.textContent = "Confirmer la suppression"; setTimeout(function () { if (del.isConnected) { del.removeAttribute("data-armed"); del.textContent = "Supprimer"; } }, 4000); return; }
      deleteDossier(del.getAttribute("data-del")); return;
    }
    var f = ev.target.closest("[data-focus]"); if (f) { showTab("form"); var el = document.getElementById("f-" + f.getAttribute("data-focus")); if (el) { el.scrollIntoView({ block: "center" }); el.focus({ preventScroll: true }); } return; }
    var t = ev.target.closest("[data-tab]"); if (t) { showTab(t.getAttribute("data-tab")); return; }
    var g = ev.target.closest("[data-gen]"); if (g) { generate(g.getAttribute("data-gen")); }
  });
  async function deleteDossier(id) {
    try {
      if (store) await store.doc("dossiers/" + id).delete();
      else { lsWrite(lsRead().filter(function (x) { return x.id !== id; })); dossiers = lsRead(); }
      dossiers = dossiers.filter(function (x) { return x.id !== id; });
      if (cur && cur.id === id) { cur = null; go("dossiers"); }
      renderDossiers(); toast("Dossier supprimé.");
    } catch (e) { toast("Suppression impossible : vérifiez vos droits."); }
  }

  // ---------- Liste des dossiers ----------
  function renderDossiers() {
    var host = $("#v-dossiers"); if (!host) return;
    var newBtns = MODELS.map(function (m) { return '<button type="button" class="btn primary" data-new="' + esc(m.id) + '">Nouvelle ' + esc(m.titre.charAt(0).toLowerCase() + m.titre.slice(1)) + "</button>"; }).join("");
    var rows = !dbReady ? '<tr><td colspan="6" class="empty">Chargement des dossiers…</td></tr>' : dossiers.length ? dossiers.map(function (d) {
      var m = modelOf(d.modele); var vals = d.valeurs || {};
      var state = d.erreurs ? '<span class="pill projet">' + d.erreurs + " erreur" + (d.erreurs > 1 ? "s" : "") + "</span>" : d.manquants ? '<span class="pill prevu">' + d.manquants + " champ" + (d.manquants > 1 ? "s" : "") + " à compléter</span>" : '<span class="pill vigueur">Prêt à générer</span>';
      var last = (d.exports || [])[d.exports && d.exports.length - 1];
      return '<tr class="live" data-open="d-' + esc(d.id) + '"><td><div class="doc-title">' + esc(d.titre || "Sans titre") + '</div><div class="doc-sum">' + esc(m ? m.id + " · " + m.titre : d.modele) + "</div></td>" +
        '<td class="num">' + (E.isEmpty(vals.montant) ? "—" : esc(E.fmtMontant(vals.montant))) + "</td><td>" + state + "</td>" +
        '<td class="num">' + esc(heure(d.maj_le)) + (who(d.maj_par) ? '<div class="cite-src">' + esc(who(d.maj_par)) + "</div>" : "") + "</td>" +
        '<td class="num">' + (last ? esc(last.format.toUpperCase() + " · " + heure(last.le)) : '<span class="cite-src">Aucun</span>') + "</td>" +
        '<td><div class="row-actions"><button type="button" class="btn" data-open="d-' + esc(d.id) + '">Ouvrir</button><button type="button" class="btn" data-dup="' + esc(d.id) + '">Dupliquer</button></div></td></tr>';
    }).join("") : '<tr><td colspan="6" class="empty">Aucun dossier pour l\'instant. Créez la première convention avec le bouton ci-dessus.</td></tr>';
    host.innerHTML = '<div class="eyebrow">Marchés de capitaux</div><h1 class="title">Dossiers d\'opération</h1>' +
      '<p class="lead">Chaque convention est préparée à partir d\'un formulaire unique. Le Word et le PDF ne sont produits que lorsque tous les champs requis sont renseignés et cohérents. Les dossiers sont conservés ici et peuvent être repris ou dupliqués.</p>' +
      (store ? "" : '<div class="notice" style="margin-top:18px"><b>Dossiers enregistrés sur cet appareil uniquement.</b> Ouvrez le référentiel dans claude.ai pour les partager avec l\'équipe.</div>') +
      (readOnly ? '<div class="notice" style="margin-top:18px"><b>Lecture seule.</b> Votre accès ne permet pas de créer ou modifier des dossiers.</div>' : "") +
      '<div class="doc-actions" style="margin:22px 0 16px">' + newBtns + "</div>" +
      '<div class="table-scroll"><table class="reg"><thead><tr><th>Dossier</th><th>Montant</th><th>État</th><th>Modifié</th><th>Dernier export</th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  }

  // ---------- Éditeur ----------
  function openDossier(id) {
    if (cur && cur.id === id) { renderEditor(); return; }
    if (cur && cur.dirty) saveNow();
    var d = dossiers.filter(function (x) { return x.id === id; })[0];
    if (!d) {
      $("#v-dossier").innerHTML = '<button type="button" class="crumb" data-open="dossiers">← Dossiers d\'opération</button><p class="lead">' + (dbReady ? "Ce dossier n'existe pas ou a été supprimé." : "Chargement du dossier…") + "</p>";
      if (!dbReady) setTimeout(function () { if (location.hash === "#d-" + id) openDossier(id); }, 700);
      return;
    }
    var model = modelOf(d.modele);
    if (!model) { $("#v-dossier").innerHTML = '<p class="lead">Modèle introuvable : ' + esc(d.modele) + "</p>"; return; }
    cur = { id: id, model: model, data: JSON.parse(JSON.stringify(d)), dirty: false, saving: false, savedAt: d.maj_le, tab: "form" };
    cur.data.valeurs = cur.data.valeurs || {};
    E.fields(model.modele.schema).forEach(function (f) { if (f.source && DATA.societe && !E.isEmpty(DATA.societe[f.source])) cur.data.valeurs[f.id] = DATA.societe[f.source]; });
    renderEditor();
  }

  function fieldHtml(f, val) {
    var id = "f-" + f.id, v = val == null ? "" : val, attrs = ' id="' + id + '" data-field="' + f.id + '"' + (readOnly ? " disabled" : "");
    var locked = f.source && DATA.societe && !E.isEmpty(DATA.societe[f.source]);
    var input;
    if (f.type === "choix" && (f.options || []).length <= 3) {
      input = '<div class="radios" role="radiogroup" aria-labelledby="l-' + f.id + '">' + f.options.map(function (o, i) {
        return '<label class="radio"><input type="radio" name="' + id + '"' + (i === 0 ? ' id="' + id + '"' : "") + ' data-field="' + f.id + '" value="' + esc(o.valeur) + '"' + (v === o.valeur ? " checked" : "") + (readOnly ? " disabled" : "") + "><span>" + esc(o.label) + "</span></label>";
      }).join("") + "</div>";
    } else if (f.type === "choix") {
      input = "<select" + attrs + '><option value="">Choisir…</option>' + f.options.map(function (o) { return '<option value="' + esc(o.valeur) + '"' + (v === o.valeur ? " selected" : "") + ">" + esc(o.label) + "</option>"; }).join("") + "</select>";
    } else if (f.type === "long") {
      input = "<textarea" + attrs + ' rows="3">' + esc(v) + "</textarea>";
    } else {
      var type = f.type === "date" ? "date" : "text", mode = f.type === "montant" || f.type === "entier" ? ' inputmode="numeric"' : f.type === "pourcentage" ? ' inputmode="decimal"' : "";
      var shown = f.type === "montant" && v !== "" ? E.fmtInt(v) : f.type === "pourcentage" && v !== "" ? String(v).replace(".", ",") : v;
      input = '<div class="inp' + (f.type === "montant" ? " suf-fcfa" : f.type === "pourcentage" ? " suf-pct" : "") + '"><input type="' + type + '"' + attrs + mode + ' value="' + esc(shown) + '"' + (locked ? " readonly" : "") + ' autocomplete="off"></div>';
    }
    return '<div class="fld" data-wrap="' + f.id + '"><label class="fld-label" id="l-' + f.id + '" for="' + id + '">' + esc(f.label) + (f.requis ? ' <abbr title="obligatoire">*</abbr>' : "") + "</label>" + input +
      (locked ? '<p class="fld-help">Repris des paramètres de la Société.</p>' : f.aide ? '<p class="fld-help">' + esc(f.aide) + "</p>" : !f.requis && f.vide ? '<p class="fld-help">Facultatif. À défaut : « ' + esc(f.vide) + " ».</p>" : "") +
      '<p class="fld-err" data-err="' + f.id + '" hidden></p></div>';
  }

  function renderEditor() {
    var m = cur.model, sch = m.modele.schema, v = cur.data.valeurs;
    var sections = sch.sections.map(function (s) {
      return '<fieldset class="sec" id="sec-' + s.id + '"><legend>' + esc(s.titre) + "</legend>" + (s.aide ? '<p class="sec-help">' + esc(s.aide) + "</p>" : "") +
        '<div class="fld-grid">' + s.champs.map(function (f) { return fieldHtml(f, v[f.id]); }).join("") + "</div></fieldset>";
    }).join("");
    var stale = cur.data.modele_version !== m.version ? '<div class="notice"><b>Modèle mis à jour.</b> Ce dossier a été créé avec la version ' + esc(cur.data.modele_version) + " ; la génération utilisera la version en vigueur " + esc(m.version) + ".</div>" : "";
    $("#v-dossier").innerHTML = '<button type="button" class="crumb" data-open="dossiers">← Dossiers d\'opération</button>' +
      '<div class="eyebrow">' + esc(m.id) + " · " + esc(m.titre) + " · modèle v" + esc(m.version) + '</div><h1 class="title" id="dz-title"></h1><p class="save-state" id="dz-save" aria-live="polite"></p>' + stale +
      '<div class="gen-layout"><div class="gen-main">' +
      '<div class="tabs" role="tablist"><button type="button" role="tab" data-tab="form">Formulaire</button><button type="button" role="tab" data-tab="apercu">Aperçu de la convention</button></div>' +
      '<form id="dz-form" novalidate autocomplete="off">' + sections + "</form>" +
      '<div id="dz-preview" class="paper" hidden></div></div>' +
      '<aside class="gen-side" id="dz-side"></aside></div>';
    var form = $("#dz-form");
    form.addEventListener("input", onField);
    form.addEventListener("change", onField);
    form.addEventListener("focusout", function (ev) {
      var el = ev.target, f = E.index(sch)[el.getAttribute("data-field")];
      if (f && f.type === "montant" && v[f.id] != null && v[f.id] !== "") el.value = E.fmtInt(v[f.id]);
    });
    form.addEventListener("submit", function (ev) { ev.preventDefault(); });
    showTab(cur.tab || "form");
    refresh();
  }
  function parse(f, el) {
    var raw = el.value;
    if (f.type === "montant") { var d = raw.replace(/[^\d]/g, ""); return d === "" ? null : Number(d); }
    if (f.type === "entier") { var t = raw.replace(/[\s  ]/g, ""); return t === "" ? null : (/^\d+$/.test(t) ? Number(t) : t); }
    if (f.type === "pourcentage") { var p = raw.replace(/[\s %]/g, "").replace(",", "."); return p === "" ? null : (isNaN(Number(p)) ? p : Number(p)); }
    return raw;
  }
  function onField(ev) {
    var el = ev.target, key = el.getAttribute("data-field"); if (!key || !cur) return;
    var f = E.index(cur.model.modele.schema)[key]; if (!f) return;
    if (el.type === "radio" && !el.checked) return;
    cur.data.valeurs[key] = parse(f, el);
    refresh(); scheduleSave();
  }
  function refresh() {
    var sch = cur.model.modele.schema, idx = E.index(sch), v = cur.data.valeurs;
    var res = E.validate(sch, v);
    E.fields(sch).forEach(function (f) { var w = document.querySelector('[data-wrap="' + f.id + '"]'); if (w) w.hidden = !E.visible(f, res.values, idx); });
    sch.sections.forEach(function (s) { var fs = $("#sec-" + s.id); if (fs) fs.hidden = !s.champs.some(function (f) { return E.visible(f, res.values, idx); }); });
    document.querySelectorAll("[data-err]").forEach(function (p) { p.hidden = true; p.textContent = ""; p.parentNode.classList.remove("has-error"); });
    res.errors.forEach(function (e) {
      e.champs.forEach(function (id) { var p = document.querySelector('[data-err="' + id + '"]'); if (p) { p.hidden = false; p.textContent = e.message; p.parentNode.classList.add("has-error"); } });
    });
    $("#dz-title").textContent = intitule(cur.model, v);
    cur.res = res;
    renderSide();
    if (cur.tab === "apercu") renderPreview();
  }
  function renderSaveState() {
    var el = $("#dz-save"); if (!el || !cur) return;
    el.className = "save-state" + (cur.error ? " err" : "");
    el.textContent = readOnly ? "Lecture seule" : cur.error ? cur.error : cur.saving ? "Enregistrement…" : cur.dirty ? "Modifications non enregistrées" : cur.savedAt ? "Enregistré " + heure(cur.savedAt) + (store ? "" : " sur cet appareil") : "";
  }
  function renderSide() {
    var r = cur.res, sch = cur.model.modele.schema, idx = E.index(sch); if (!r) return;
    var pct = r.required ? Math.round(r.filled / r.required * 100) : 100;
    var item = function (f) { return '<li><button type="button" data-focus="' + f.id + '">' + esc(f.label) + "</button></li>"; };
    var calcs = (sch.calculs || []).filter(function (c) { return r.values[c.id] != null && !/ratio/.test(c.id); }).map(function (c) {
      return "<div><dt>" + esc(c.label) + "</dt><dd>" + esc(E.formatValue(c, r.values[c.id])) + "</dd></div>";
    }).join("");
    var blocked = !r.complete;
    var hint = r.missing.length ? r.missing.length + " champ" + (r.missing.length > 1 ? "s" : "") + " à compléter" : r.errors.length ? r.errors.length + " erreur" + (r.errors.length > 1 ? "s" : "") + " à corriger" : "";
    var ex = (cur.data.exports || []).slice(-3).reverse().map(function (x) { return "<li>" + esc(x.format.toUpperCase()) + " · " + esc(x.edition === "signature" ? "signature" : "projet") + " · " + esc(heure(x.le)) + (who(x.par) ? " · " + esc(who(x.par)) : "") + "</li>"; }).join("");
    var side = $("#dz-side"); if (!side) return;
    var html =
      '<div class="side-block"><div class="prog-head"><span>Complétude</span><b>' + r.filled + " / " + r.required + '</b></div><div class="prog" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div></div>' +
      '<div class="side-block"><p class="side-title">Édition</p><div class="radios col">' +
      '<label class="radio"><input type="radio" name="dz-ed" value="projet"' + (cur.data.edition !== "signature" ? " checked" : "") + '><span>Projet pour négociation</span></label>' +
      '<label class="radio"><input type="radio" name="dz-ed" value="signature"' + (cur.data.edition === "signature" ? " checked" : "") + '><span>Version pour signature</span></label></div></div>' +
      '<div class="side-block gen-btns"><button type="button" class="btn primary" data-gen="docx"' + (blocked ? " disabled" : "") + ">" + ICON_DL + 'Word (.docx)</button><button type="button" class="btn" data-gen="pdf"' + (blocked ? " disabled" : "") + ">" + ICON_DL + "PDF</button>" +
      (blocked ? '<p class="gen-hint">Génération bloquée : ' + hint + ".</p>" : '<p class="gen-hint ok">Tous les champs requis sont renseignés et cohérents.</p>') + "</div>" +
      (r.missing.length ? '<div class="side-block"><p class="side-title">À compléter</p><ul class="todo">' + r.missing.map(item).join("") + "</ul></div>" : "") +
      (r.errors.length ? '<div class="side-block"><p class="side-title err">Erreurs</p><ul class="msgs err">' + r.errors.map(function (e) { return '<li><button type="button" data-focus="' + e.champs[0] + '">' + esc(e.message) + "</button></li>"; }).join("") + "</ul></div>" : "") +
      (r.warnings.length ? '<div class="side-block"><p class="side-title warn">Points d\'attention</p><ul class="msgs warn">' + r.warnings.map(function (e) { return '<li><button type="button" data-focus="' + e.champs[0] + '">' + esc(e.message) + "</button></li>"; }).join("") + "</ul></div>" : "") +
      (calcs ? '<div class="side-block"><p class="side-title">Calculé automatiquement</p><dl class="calc">' + calcs + "</dl></div>" : "") +
      '<div class="side-block small"><p class="side-title">Historique</p><ul class="hist">' + (ex || "<li>Aucun export</li>") + "</ul>" +
      '<p class="cite-src">Créé ' + esc(heure(cur.data.cree_le)) + (who(cur.data.cree_par) ? " par " + esc(who(cur.data.cree_par)) : "") + "</p>" +
      '<div class="row-actions" style="justify-content:flex-start;margin-top:10px"><button type="button" class="btn" data-dup="' + esc(cur.id) + '">Dupliquer</button>' + (readOnly ? "" : '<button type="button" class="btn" data-del="' + esc(cur.id) + '">Supprimer</button>') + "</div></div>";
    renderSaveState();
    if (side.__html === html) return;
    side.innerHTML = html; side.__html = html;
    document.querySelectorAll('input[name="dz-ed"]').forEach(function (el) { el.addEventListener("change", function () { cur.data.edition = el.value; scheduleSave(); }); });
  }
  function showTab(t) {
    if (!cur) return; cur.tab = t;
    document.querySelectorAll(".tabs [data-tab]").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-tab") === t ? "true" : "false"); });
    var f = $("#dz-form"), p = $("#dz-preview"); if (!f || !p) return;
    f.hidden = t !== "form"; p.hidden = t !== "apercu";
    if (t === "apercu") renderPreview();
  }
  var previewTimer;
  function renderPreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(function () {
      var p = $("#dz-preview"); if (!p || !cur) return;
      loadLib("marked").then(function (mk) {
        var m = cur.model, sch = m.modele.schema, ctx = { societe: DATA.societe };
        var md = function (src) { return mk.parse(E.render(src, sch, cur.data.valeurs, "apercu", ctx)).replace(/<p><em>ci-après/g, '<p class="party-role"><em>ci-après'); };
        p.innerHTML = '<p class="paper-note">Aperçu : les zones surlignées restent à compléter. Le document final est produit par les boutons Word et PDF.</p>' +
          '<div class="doc-body"><div class="eyebrow">Convention</div><h1 class="title" style="font-size:var(--fs-xl)">' + esc(m.titre) + "</h1>" + md(m.modele.template) +
          m.annexes.map(function (a) { return '<h2>Annexe ' + a.num + " — " + esc(a.titre) + "</h2>" + md(a.template); }).join("") + "</div>";
      }).catch(function () { p.innerHTML = '<p class="notice">L\'aperçu nécessite une connexion pour charger son moteur de mise en page.</p>'; });
    }, 150);
  }

  // ---------- Génération ----------
  function decode(s) {
    return String(s).replace(/&#(\d+);/g, function (a, n) { return String.fromCharCode(n); }).replace(/&#x([0-9a-f]+);/gi, function (a, n) { return String.fromCharCode(parseInt(n, 16)); })
      .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }
  function inl(tokens, st, out) {
    out = out || []; st = st || {};
    (tokens || []).forEach(function (t) {
      if (t.type === "strong") inl(t.tokens, Object.assign({}, st, { b: true }), out);
      else if (t.type === "em") inl(t.tokens, Object.assign({}, st, { i: true }), out);
      else if (t.type === "br") out.push({ br: true });
      else if (t.type === "html") { if (/<br\s*\/?>/i.test(t.text)) out.push({ br: true }); else { var x = t.text.replace(/<[^>]+>/g, ""); if (x) out.push(Object.assign({ text: decode(x) }, st)); } }
      else if (t.tokens && t.type !== "escape") inl(t.tokens, st, out);
      else if (t.text != null) out.push(Object.assign({ text: decode(t.text) }, st));
    });
    return out;
  }
  function toBlocks(tokens) {
    var out = [];
    tokens.forEach(function (t) {
      if (t.type === "heading") out.push({ t: "h", level: t.depth, runs: inl(t.tokens) });
      else if (t.type === "paragraph") {
        var runs = inl(t.tokens);
        var role = runs.length && runs.every(function (r) { return r.i || r.br; }) && /^ci-après/.test(runs[0].text || "");
        out.push({ t: "p", runs: runs, align: role ? "right" : null });
      } else if (t.type === "list") {
        out.push({ t: "list", ordered: t.ordered, items: t.items.map(function (it) { return inl(it.tokens.reduce(function (a, x) { return a.concat(x.type === "text" || x.type === "paragraph" ? (x.tokens || [x]) : []); }, [])); }) });
      } else if (t.type === "table") {
        out.push({ t: "table", header: t.header.map(function (c) { return inl(c.tokens); }), rows: t.rows.map(function (r) { return r.map(function (c) { return inl(c.tokens); }); }) });
      } else if (t.type === "html" && /sig-row/.test(t.text)) {
        var cells = [], re = /<div class="sig"><span>([\s\S]*?)<br><small>([\s\S]*?)<\/small><\/span><\/div>/g, m;
        while ((m = re.exec(t.text))) cells.push([decode(m[1].replace(/<[^>]+>/g, "")), decode(m[2].replace(/<[^>]+>/g, ""))]);
        out.push({ t: "sig", cells: cells });
      } else if (t.type === "hr") out.push({ t: "hr" });
    });
    return out;
  }
  function runsText(runs) { return runs.map(function (r) { return r.br ? " " : r.text; }).join(""); }
  function widths(tb) {
    var n = tb.header.length, w = [];
    for (var i = 0; i < n; i++) {
      var len = [tb.header[i]].concat(tb.rows.map(function (r) { return r[i] || []; })).reduce(function (a, c) { return Math.max(a, Math.min(60, runsText(c).length)); }, 4);
      w.push(Math.max(6, len));
    }
    var sum = w.reduce(function (a, b) { return a + b; }, 0);
    return w.map(function (x) { return x / sum; });
  }

  async function buildParts() {
    var mk = await loadLib("marked"), m = cur.model, sch = m.modele.schema, v = cur.data.valeurs, ctx = { societe: DATA.societe };
    var parts = [{ kind: "contrat", titre: m.titre, blocks: toBlocks(mk.lexer(E.render(m.modele.template, sch, v, "rempli", ctx))) }];
    m.annexes.forEach(function (a) { parts.push({ kind: "annexe", num: a.num, ref: a.id, titre: a.titre, paysage: a.orientation === "paysage", blocks: toBlocks(mk.lexer(E.render(a.template, sch, v, "rempli", ctx))) }); });
    return parts;
  }
  function meta() {
    var m = cur.model, v = cur.data.valeurs, ed = cur.data.edition === "signature" ? "signature" : "projet";
    return {
      ref: m.id, version: m.version, titre: m.titre, ed: ed,
      edLabel: ed === "signature" ? "Version pour signature" : "Projet pour négociation du " + E.fmtDate(new Date().toISOString().slice(0, 10)),
      parties: plain(E.render(m.modele.schema.partie || "{{emetteur_nom}}", m.modele.schema, v, "rempli")) + " et Purpose Capital S.A.",
      etabli: "Établi le " + E.fmtDate(new Date().toISOString().slice(0, 10)) + " à partir du modèle " + m.id + " v" + m.version,
      file: function (ext) {
        var slug = plain(E.render(m.modele.schema.partie || "{{emetteur_nom}}", m.modele.schema, v, "rempli")).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).replace(/-+$/, "") || "Partie";
        return m.id + "_" + slug + "_" + (ed === "signature" ? "signature" : "projet") + "_" + new Date().toISOString().slice(0, 10) + "." + ext;
      }
    };
  }

  async function makeDocx(parts, M) {
    var D = await loadLib("docx");
    var NAVY = "0B2E52", GREY = "5B6B80", GOLD = "8A6413", RULE = "A9B8CA";
    var inst = 0;
    var tr = function (r, base) {
      if (r.br) return new D.TextRun({ break: 1 });
      var o = Object.assign({ text: r.text }, base || {});
      if (r.b) o.bold = true;
      if (r.i) o.italics = true;
      return new D.TextRun(o);
    };
    var runs = function (rs, base) { return rs.map(function (r) { return tr(r, base); }); };
    var border = { style: D.BorderStyle.SINGLE, size: 4, color: RULE };
    var none = { style: D.BorderStyle.NONE, size: 0, color: "FFFFFF" };
    function table(b, total) {
      var w = widths(b), cols = w.map(function (x) { return Math.round(x * total); });
      var row = function (cells, head) {
        return new D.TableRow({
          tableHeader: !!head, cantSplit: true,
          children: cells.map(function (c, i) {
            return new D.TableCell({
              width: { size: cols[i], type: D.WidthType.DXA },
              shading: head ? { type: D.ShadingType.CLEAR, color: "auto", fill: "EEF3F9" } : undefined,
              margins: { top: 50, bottom: 50, left: 90, right: 90 },
              borders: { top: border, bottom: border, left: border, right: border },
              children: [new D.Paragraph({ spacing: { after: 0, line: 252 }, children: runs(c, head ? { bold: true, color: NAVY, size: 18 } : { size: 18 }) })]
            });
          })
        });
      };
      return new D.Table({ width: { size: total, type: D.WidthType.DXA }, columnWidths: cols, layout: D.TableLayoutType.FIXED, rows: [row(b.header, true)].concat(b.rows.map(function (r) { return row(r); })) });
    }
    function sig(b, total) {
      var cw = Math.floor(total / b.cells.length);
      return new D.Table({
        width: { size: total, type: D.WidthType.DXA }, columnWidths: b.cells.map(function () { return cw; }), layout: D.TableLayoutType.FIXED,
        borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
        rows: [new D.TableRow({
          cantSplit: true, children: b.cells.map(function (c) {
            return new D.TableCell({
              width: { size: cw, type: D.WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none },
              margins: { right: 300 },
              children: [new D.Paragraph({ spacing: { before: 240, after: 0 }, children: [new D.TextRun({ text: c[0], bold: true })] }),
                new D.Paragraph({ spacing: { after: 0 }, children: [new D.TextRun({ text: c[1] || " ", color: GREY, size: 18 })] }),
                new D.Paragraph({ spacing: { before: 1100, after: 0 }, border: { top: { style: D.BorderStyle.SINGLE, size: 4, color: "3E5068", space: 4 } }, children: [new D.TextRun({ text: "Signature", color: GREY, size: 16 })] })]
            });
          })
        })]
      });
    }
    function body(blocks, total) {
      var out = [];
      blocks.forEach(function (b) {
        if (b.t === "h") out.push(new D.Paragraph({ style: b.level <= 2 ? "Titre" : "Article", children: runs(b.runs) }));
        else if (b.t === "p") out.push(new D.Paragraph({ alignment: b.align === "right" ? D.AlignmentType.RIGHT : D.AlignmentType.JUSTIFIED, children: runs(b.runs) }));
        else if (b.t === "list") { var k = ++inst; b.items.forEach(function (it) { out.push(new D.Paragraph({ alignment: D.AlignmentType.JUSTIFIED, spacing: { after: 60 }, numbering: b.ordered ? { reference: "dec", level: 0, instance: k } : { reference: "puce", level: 0 }, children: runs(it) })); }); }
        else if (b.t === "table") { out.push(table(b, total)); out.push(new D.Paragraph({ spacing: { after: 120 }, children: [] })); }
        else if (b.t === "sig") out.push(sig(b, total));
      });
      return out;
    }
    var header = new D.Header({ children: [new D.Paragraph({ alignment: D.AlignmentType.LEFT, border: { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: "D5DEE9", space: 4 } }, tabStops: [{ type: D.TabStopType.RIGHT, position: 9600 }], children: [new D.TextRun({ text: "PURPOSE CAPITAL", bold: true, color: NAVY, size: 14, characterSpacing: 30 }), new D.TextRun({ text: "  ·  " + M.ref + " — " + M.titre, color: GREY, size: 14 }), new D.TextRun({ text: "\t" + M.edLabel, color: GREY, size: 14 })] })] });
    var footer = new D.Footer({ children: [new D.Paragraph({ tabStops: [{ type: D.TabStopType.RIGHT, position: 9600 }], children: [new D.TextRun({ text: M.etabli, color: GREY, size: 14 }), new D.TextRun({ children: ["\tPage ", D.PageNumber.CURRENT, " / ", D.PageNumber.TOTAL_PAGES], color: GREY, size: 14 })] })] });
    var margins = { top: 1300, bottom: 1134, left: 1134, right: 1020, header: 560, footer: 480 };
    var sections = parts.map(function (p) {
      var head = p.kind === "contrat"
        ? [new D.Paragraph({ spacing: { after: 60 }, children: [new D.TextRun({ text: "CONVENTION", color: GOLD, bold: true, size: 16, characterSpacing: 40 })] }),
          new D.Paragraph({ style: "DocTitle", children: [new D.TextRun(p.titre)] }),
          new D.Paragraph({ spacing: { after: 80 }, children: [new D.TextRun({ text: M.parties, italics: true, color: GREY })] }),
          new D.Paragraph({ spacing: { after: 360 }, border: { bottom: { style: D.BorderStyle.SINGLE, size: 12, color: "E8A020", space: 6 } }, children: [new D.TextRun({ text: M.edLabel, color: GREY, size: 18 })] })]
        : [new D.Paragraph({ spacing: { after: 40 }, children: [new D.TextRun({ text: "ANNEXE " + p.num + " · " + p.ref, color: GOLD, bold: true, size: 16, characterSpacing: 30 })] }),
          new D.Paragraph({ style: "AnnexTitle", children: [new D.TextRun(p.titre)] })];
      return {
        properties: { page: { margin: margins, size: p.paysage ? { orientation: D.PageOrientation.LANDSCAPE, width: 11906, height: 16838 } : { width: 11906, height: 16838 } } },
        headers: { default: header }, footers: { default: footer },
        children: head.concat(body(p.blocks, p.paysage ? 14684 : 9752))
      };
    });
    var doc = new D.Document({
      creator: "Purpose Capital S.A.", title: M.titre + " — " + M.parties, description: M.etabli,
      styles: {
        default: { document: { run: { font: "Calibri", size: 21, color: "0A2540" }, paragraph: { spacing: { after: 120, line: 276 } } } },
        paragraphStyles: [
          { id: "DocTitle", name: "Titre du document", basedOn: "Normal", next: "Normal", run: { font: "Cambria", size: 40, bold: true, color: NAVY }, paragraph: { spacing: { after: 120 } } },
          { id: "AnnexTitle", name: "Titre d'annexe", basedOn: "Normal", next: "Normal", run: { font: "Cambria", size: 30, bold: true, color: NAVY }, paragraph: { spacing: { after: 240 }, border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: NAVY, space: 6 } } } },
          { id: "Titre", name: "Titre de partie", basedOn: "Normal", next: "Normal", run: { font: "Cambria", size: 26, bold: true, color: NAVY }, paragraph: { spacing: { before: 360, after: 140 }, keepNext: true, keepLines: true } },
          { id: "Article", name: "Article", basedOn: "Normal", next: "Normal", run: { bold: true, color: NAVY, size: 21 }, paragraph: { spacing: { before: 220, after: 80 }, keepNext: true, keepLines: true } }
        ]
      },
      numbering: { config: [
        { reference: "dec", levels: [{ level: 0, format: D.LevelFormat.DECIMAL, text: "%1.", alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 340 } } } }] },
        { reference: "puce", levels: [{ level: 0, format: D.LevelFormat.BULLET, text: "–", alignment: D.AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 340 } } } }] }
      ] },
      sections: sections
    });
    return D.Packer.toBlob(doc);
  }

  var fontVfs = null;
  async function pdfFonts() {
    if (fontVfs) return fontVfs;
    var files = ["Inter-Regular", "Inter-SemiBold", "Inter-Italic", "Inter-SemiBoldItalic", "Playfair-SemiBold", "Playfair-Bold", "Playfair-SemiBoldItalic", "Playfair-BoldItalic"];
    var vfs = {};
    await Promise.all(files.map(async function (f) {
      var res = await fetch("fonts/" + f + ".ttf"); if (!res.ok) throw new Error("police " + f);
      var buf = new Uint8Array(await res.arrayBuffer()), bin = "";
      for (var i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      vfs[f + ".ttf"] = btoa(bin);
    }));
    fontVfs = vfs; return vfs;
  }
  async function makePdf(parts, M) {
    var pm = await loadLib("pdfmake"), vfs = await pdfFonts();
    var fonts = {
      Inter: { normal: "Inter-Regular.ttf", bold: "Inter-SemiBold.ttf", italics: "Inter-Italic.ttf", bolditalics: "Inter-SemiBoldItalic.ttf" },
      Playfair: { normal: "Playfair-SemiBold.ttf", bold: "Playfair-Bold.ttf", italics: "Playfair-SemiBoldItalic.ttf", bolditalics: "Playfair-BoldItalic.ttf" }
    };
    var txt = function (rs) { return rs.map(function (r) { return r.br ? { text: "\n" } : { text: r.text, bold: !!r.b, italics: !!r.i }; }); };
    var lay = {
      hLineWidth: function () { return 0.5; }, vLineWidth: function () { return 0.5; }, hLineColor: function () { return "#A9B8CA"; }, vLineColor: function () { return "#A9B8CA"; },
      fillColor: function (i) { return i === 0 ? "#EEF3F9" : null; }, paddingLeft: function () { return 5; }, paddingRight: function () { return 5; }, paddingTop: function () { return 3; }, paddingBottom: function () { return 3; }
    };
    function body(blocks) {
      return blocks.map(function (b) {
        if (b.t === "h") return { text: txt(b.runs), style: b.level <= 2 ? "h2" : "h3", headlineLevel: b.level <= 2 ? 1 : 2 };
        if (b.t === "p") return { text: txt(b.runs), alignment: b.align || "justify", margin: [0, 0, 0, 6], italics: b.align === "right" };
        if (b.t === "list") { var items = b.items.map(function (it) { return { text: txt(it), alignment: "justify", margin: [0, 0, 0, 3] }; }); var n = { markerColor: "#8A6413", margin: [4, 0, 0, 6] }; n[b.ordered ? "ol" : "ul"] = items; return n; }
        if (b.t === "table") {
          var w = widths(b);
          return { table: { headerRows: 1, dontBreakRows: true, widths: w.map(function (x) { return (x * 100).toFixed(1) + "%"; }), body: [b.header.map(function (c) { return { text: txt(c), bold: true, color: "#0B2E52" }; })].concat(b.rows.map(function (r) { return r.map(function (c) { return { text: txt(c) }; }); })) }, layout: lay, fontSize: 8.4, margin: [0, 4, 0, 10] };
        }
        if (b.t === "sig") return { unbreakable: true, margin: [0, 18, 0, 0], columnGap: 30, columns: b.cells.map(function (c) { return { width: "*", stack: [{ text: c[0], bold: true }, { text: c[1] || " ", color: "#5B6B80", fontSize: 8.4 }, { canvas: [{ type: "line", x1: 0, y1: 52, x2: 200, y2: 52, lineWidth: 0.5, lineColor: "#3E5068" }] }, { text: "Signature", color: "#5B6B80", fontSize: 7, margin: [0, 3, 0, 0] }] }; }) };
        return { text: "" };
      });
    }
    var content = [];
    parts.forEach(function (p, i) {
      if (p.kind === "contrat") {
        content.push({ text: "CONVENTION", color: "#8A6413", bold: true, fontSize: 7.5, characterSpacing: 1.6 });
        content.push({ text: p.titre, font: "Playfair", fontSize: 21, lineHeight: 1.08, color: "#0B2E52", margin: [0, 4, 0, 6] });
        content.push({ text: M.parties, italics: true, color: "#5B6B80" });
        content.push({ canvas: [{ type: "line", x1: 0, y1: 8, x2: 40, y2: 8, lineWidth: 1.6, lineColor: "#E8A020" }], margin: [0, 0, 0, 4] });
        content.push({ text: M.edLabel, color: "#5B6B80", fontSize: 8, margin: [0, 0, 0, 18] });
      } else {
        content.push({ pageBreak: "before", pageOrientation: p.paysage ? "landscape" : "portrait", text: "ANNEXE " + p.num + " · " + p.ref, color: "#8A6413", bold: true, fontSize: 7.5, characterSpacing: 1.4 });
        content.push({ text: p.titre, font: "Playfair", fontSize: 15, color: "#0B2E52", margin: [0, 3, 0, 4] });
        content.push({ canvas: [{ type: "line", x1: 0, y1: 2, x2: p.paysage ? 735 : 488, y2: 2, lineWidth: 1, lineColor: "#0B2E52" }], margin: [0, 0, 0, 12] });
      }
      content = content.concat(body(p.blocks));
    });
    var dd = {
      pageSize: "A4", pageMargins: [56, 62, 51, 56],
      info: { title: M.titre + " — " + M.parties, author: "Purpose Capital S.A.", subject: M.etabli },
      defaultStyle: { font: "Inter", fontSize: 9.4, lineHeight: 1.32, color: "#0A2540" },
      styles: { h2: { font: "Playfair", fontSize: 13, color: "#0B2E52", margin: [0, 14, 0, 6] }, h3: { bold: true, fontSize: 9.4, color: "#0B2E52", margin: [0, 8, 0, 2] } },
      watermark: M.ed === "projet" ? { text: "PROJET", color: "#0B2E52", opacity: 0.05, font: "Playfair", bold: true } : undefined,
      header: function () { return { margin: [56, 26, 51, 0], fontSize: 6.8, color: "#5B6B80", columns: [{ text: [{ text: "PURPOSE CAPITAL", bold: true, color: "#0B2E52", characterSpacing: 1 }, { text: "  ·  " + M.ref + " — " + M.titre }] }, { text: M.edLabel, alignment: "right", width: "auto" }] }; },
      footer: function (page, count) { return { margin: [56, 18, 51, 0], fontSize: 6.8, color: "#5B6B80", columns: [{ text: M.etabli }, { text: "Page " + page + " / " + count, alignment: "right", width: "auto" }] }; },
      pageBreakBefore: function (node, following) { return (node.headlineLevel === 1 && following.length < 4) || (node.headlineLevel === 2 && following.length < 2); },
      content: content
    };
    return new Promise(function (ok, ko) { try { pm.createPdf(dd, null, fonts, vfs).getBlob(ok); } catch (e) { ko(e); } });
  }

  var busy = false;
  async function generate(fmt) {
    if (!cur || busy) return;
    var r = E.validate(cur.model.modele.schema, cur.data.valeurs);
    if (!r.complete) { toast("Génération impossible : complétez les champs signalés."); return; }
    busy = true;
    var btn = document.querySelector('[data-gen="' + fmt + '"]'); var label = btn ? btn.innerHTML : "";
    if (btn) { btn.disabled = true; btn.textContent = "Préparation…"; }
    try {
      var parts = await buildParts(), M = meta();
      var blob = fmt === "docx" ? await makeDocx(parts, M) : await makePdf(parts, M);
      var filename = M.file(fmt);
      if (window.__REF_SAVE__) await window.__REF_SAVE__(filename, blob);
      else {
        var d = await downloadsP;
        if (!d) { toast("Le téléchargement n'est pas disponible dans cette vue. Ouvrez le référentiel dans claude.ai."); return; }
        await d.save({ filename: filename, data: blob });
      }
      cur.data.exports = (cur.data.exports || []).concat([{ format: fmt, edition: M.ed, le: nowIso(), par: me.id || null, modele_version: cur.model.version }]).slice(-20);
      cur.data.modele_version = cur.model.version;
      scheduleSave(); toast("Fichier enregistré : " + filename);
    } catch (e) {
      if (e && e.code === "declined") return;
      toast(e && e.code === "rate_limited" ? "Une confirmation est déjà ouverte." : "La génération a échoué : " + (e && e.message ? e.message : "erreur inconnue") + ".");
    } finally {
      busy = false; if (btn && btn.isConnected) { btn.innerHTML = label; btn.disabled = false; } if (cur) renderSide();
    }
  }
  window.addEventListener("pagehide", function () { if (cur && cur.dirty) saveNow(); });
