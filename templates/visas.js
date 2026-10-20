  // ---------- Visas, approbations et prises de connaissance ----------
  // Données (base partagée de la page) :
  //   roles/<id>              fonctions d'une personne — écrit par le propriétaire seul (administrateur)
  //   lectures/<docId>        personnes qui doivent lire le document — propriétaire seul
  //   annuaire/<id>           « cette personne a ouvert le référentiel » — chacun pour soi
  //   sig/<id>/items/<clé>    visas d'une personne — chacun écrit les siens, personne d'autre
  // Un visa ne compte que si la personne détient, dans roles/, la fonction qu'exige l'étape,
  // et il ne vaut que pour l'empreinte du texte qu'il porte.
  var HOSTED = !!window.__REF_CFG;
  var FONCTIONS = [
    ["pca", "Président du Conseil d'Administration"], ["dg", "Directeur Général"], ["rcci", "RCCI"],
    ["dcom", "Directeur Commercial"], ["dmc", "Directeur des Marchés de Capitaux"], ["collab", "Collaborateur"]
  ];
  var VARIANTS = function () { var out = []; docs.forEach(function (d) { out.push(d); if (d.projet) out.push(d.projet); }); return out; };
  var variantByKey = function (k) { return VARIANTS().filter(function (x) { return x.id + "@" + x.empreinte === k; })[0]; };
  var FLABEL = {}; FONCTIONS.forEach(function (f) { FLABEL[f[0]] = f[1]; });
  var V = { db: null, user: null, me: null, owner: false, canWrite: false, ready: false, roles: {}, lectures: {}, annuaire: {}, sigs: {}, names: {}, emails: {}, subs: {}, pending: null, search: [] };

  Promise.all([dbP, userP]).then(async function (r) {
    V.db = r[0]; V.user = r[1];
    if (V.user) {
      try { V.me = await V.user.id(); V.owner = await V.user.isOwner(); var w = await V.user.can("data.write"); V.canWrite = w !== false; } catch (e) { /* lecture seule */ }
    }
    if (!V.db) { V.ready = true; vRefresh(); return; }
    var err = function () { /* hors ligne : on garde le dernier état */ };
    V.db.collection("roles").onSnapshot(function (s) { V.roles = {}; s.docs.forEach(function (d) { V.roles[d.id] = d.data(); }); vWatchSigs(); vNames(); vRefresh(); }, err);
    V.db.collection("lectures").onSnapshot(function (s) { V.lectures = {}; s.docs.forEach(function (d) { V.lectures[d.id] = d.data(); }); vWatchSigs(); vNames(); vRefresh(); }, err);
    V.db.collection("annuaire").onSnapshot(function (s) { V.annuaire = {}; s.docs.forEach(function (d) { V.annuaire[d.id] = d.data(); }); vWatchSigs(); vNames(); V.ready = true; vRefresh(); }, err);
    if (V.me && V.canWrite) {
      try { var a = await V.db.doc("annuaire/" + V.me).get(); var last = a.exists ? a.data().vu : ""; if (!last || last.slice(0, 10) !== new Date().toISOString().slice(0, 10)) await V.db.doc("annuaire/" + V.me).set({ vu: new Date().toISOString() }); } catch (e) { /* lecture seule */ }
    }
  });

  function vPeople() {
    var ids = Object.keys(V.roles).concat(Object.keys(V.annuaire));
    Object.keys(V.lectures).forEach(function (k) { (V.lectures[k].ids || []).forEach(function (i) { ids.push(i); }); });
    if (V.me) ids.push(V.me);
    return ids.filter(function (x, i, a) { return x && a.indexOf(x) === i; });
  }
  function vWatchSigs() {
    if (!V.db) return;
    vPeople().forEach(function (id) {
      if (V.subs[id]) return;
      V.subs[id] = V.db.collection("sig/" + id + "/items").onSnapshot(function (s) {
        V.sigs[id] = s.docs.map(function (d) { return Object.assign({ key: d.id, by: id }, d.data()); }); vRefresh();
      }, function () { /* invisible ou hors ligne */ });
    });
  }
  async function vNames() {
    if (!V.user) return;
    var ids = vPeople(); if (!ids.length) return;
    try { var ps = await V.user.profiles(ids); Object.keys(ps).forEach(function (k) { V.names[k] = ps[k].name || ""; V.emails[k] = ps[k].email || ""; }); vRefresh(); } catch (e) { /* noms indisponibles */ }
  }
  var vName = function (id) { return (V.names[id] || V.emails[id] || "Personne non identifiée") + (id === V.me ? " (vous)" : ""); };
  var hasRole = function (id, role) { var r = V.roles[id]; return !!(r && r.actif !== false && (r.fonctions || []).indexOf(role) >= 0); };
  var myRoles = function () { return V.me && V.roles[V.me] && V.roles[V.me].actif !== false ? V.roles[V.me].fonctions || [] : []; };
  var fmtDT = function (s) { if (!s) return ""; var d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); };

  // Tous les visas d'un document, pour toutes les personnes
  function sigsOf(docId, etape) {
    var out = [];
    Object.keys(V.sigs).forEach(function (id) { (V.sigs[id] || []).forEach(function (s) { if (s.doc === docId && (!etape || s.etape === etape)) out.push(s); }); });
    return out.sort(function (a, b) { return (a.at || "") < (b.at || "") ? 1 : -1; });
  }
  // Visa valide d'une étape : bonne fonction, texte identique à la version en ligne
  function validSig(d, step) {
    var all = sigsOf(d.id, step.etape).filter(function (s) { return hasRole(s.by, step.role); });
    var cur = all.filter(function (s) { return s.empreinte === d.empreinte; })[0];
    return { cur: cur || null, old: cur ? null : all[0] || null };
  }
  function readersOf(d) {
    var L = V.lectures[d.id]; if (!L) return [];
    var ids = (L.ids || []).slice();
    if (L.tous) Object.keys(V.roles).forEach(function (id) { if (V.roles[id].actif !== false && ids.indexOf(id) < 0) ids.push(id); });
    return ids;
  }
  function docState(d) {
    var steps = d.circuit.map(function (st) { return Object.assign({ st: st }, validSig(d, st)); });
    var approved = steps.length > 0 && steps.every(function (x) { return x.cur; });
    var readers = readersOf(d);
    var ok = d.lectureOK || [d.empreinte];
    var read = readers.filter(function (id) { return sigsOf(d.id, "lecture").some(function (s) { return s.by === id && ok.indexOf(s.empreinte) >= 0; }); });
    return { steps: steps, approved: approved, readers: readers, read: read };
  }
  // Ce que la personne connectée peut faire maintenant sur ce document
  function myActions(d) {
    if (!V.me || !V.canWrite) return [];
    var st = docState(d), acts = [];
    for (var i = 0; i < st.steps.length; i++) {
      var x = st.steps[i];
      if (x.cur) continue;
      if (hasRole(V.me, x.st.role)) acts.push({ etape: x.st.etape, label: x.st.label, role: x.st.role });
      break; // une étape à la fois, dans l'ordre
    }
    if (!d.estProjet && st.approved && st.readers.indexOf(V.me) >= 0 && st.read.indexOf(V.me) < 0) acts.push({ etape: "lecture", label: "Prise de connaissance", role: "lecture" });
    return acts;
  }

  // ---------- Encadré sur la page d'un document ----------
  function renderDocVisas(d) {
    var box = $("#doc-visas"); if (!box) return;
    if (!V.db) { box.innerHTML = V.ready ? '<p class="visa-note">Les visas électroniques ne sont pas disponibles dans cette vue. Reconnectez-vous au référentiel.</p>' : ""; return; }
    var st = docState(d);
    var rows = st.steps.map(function (x) {
      var s = x.cur, o = x.old;
      var status = s ? '<span class="pill vigueur">Visé</span> ' + esc(vName(s.by)) + " · " + esc(fmtDT(s.at)) + (s.seance ? " · séance du " + esc(fmtDate(s.seance)) + (s.pv ? ", PV " + esc(s.pv) : "") : "")
        : o ? '<span class="pill projet">À viser de nouveau</span> visé le ' + esc(fmtDT(o.at)) + " sur une version antérieure du texte"
        : '<span class="pill prevu">En attente</span>';
      return "<tr><td>" + esc(x.st.label) + '<div class="cite-src">' + esc(x.st.fonction) + "</div></td><td>" + status + "</td></tr>";
    }).join("");
    var lect = st.readers.length
      ? (st.approved ? st.read.length + " sur " + st.readers.length + " personne" + (st.readers.length > 1 ? "s" : "") + " concernée" + (st.readers.length > 1 ? "s" : "") : "Ouverte après l'approbation · " + st.readers.length + " personne" + (st.readers.length > 1 ? "s" : "") + " désignée" + (st.readers.length > 1 ? "s" : ""))
      : "Aucune personne désignée";
    if (d.estProjet) lect = d.nature_revision === "mineure" ? "Correction mineure : les lectures de la version en vigueur restent valables" : "Demandée aux personnes concernées après l'adoption";
    rows += "<tr><td>Prise de connaissance</td><td>" + esc(lect) + "</td></tr>";
    var acts = myActions(d);
    var actHtml = acts.map(function (a) {
      var p = V.pending && V.pending.doc === d.id + "@" + d.empreinte && V.pending.etape === a.etape;
      if (!p) return '<button type="button" class="btn primary" data-vact="' + esc(d.id + "@" + d.empreinte) + "|" + a.etape + '">' + (a.etape === "lecture" ? "J'ai lu et compris ce document" : a.etape === "adoption" ? "Enregistrer l'adoption par le Conseil" : a.etape === "verification" ? "Viser (vérification)" : "Approuver") + "</button>";
      var role = a.etape === "lecture" ? "" : " en qualité de " + (FLABEL[a.role] || a.role);
      var phrase = a.etape === "lecture" ? "Je déclare avoir lu et compris" : a.etape === "verification" ? "Je vise, après vérification," : a.etape === "adoption" ? "J'atteste que le Conseil d'Administration a adopté" : "J'approuve";
      return '<div class="visa-confirm"><p><b>' + esc(vName(V.me).replace(" (vous)", "")) + "</b>" + esc(role) + " : " + phrase + " le document " + esc(d.id) + ", version " + esc(d.version) + ', empreinte <code>' + esc(d.empreinte) + "</code>.</p>" +
        (a.etape === "adoption" ? '<div class="form-grid" style="margin:8px 0"><label class="vf">Date de la séance<input type="date" id="v-seance" required></label><label class="vf">Référence du procès-verbal<input type="text" id="v-pv" placeholder="PV n°…"></label></div>' : "") +
        '<label class="vf">Commentaire (facultatif)<input type="text" id="v-com" maxlength="300"></label>' +
        '<div class="visa-btns"><button type="button" class="btn primary" data-vact="' + esc(d.id + "@" + d.empreinte) + "|" + a.etape + '|ok">Confirmer</button><button type="button" class="btn" data-vact="cancel">Annuler</button></div></div>';
    }).join("");
    var mine = myRoles();
    var who = V.me ? (mine.length ? "Vos fonctions : " + mine.map(function (f) { return FLABEL[f] || f; }).join(", ") : V.owner ? "Vous êtes administrateur : attribuez les fonctions dans l'onglet Visas." : "Aucune fonction ne vous est attribuée : vous consultez le document.") : "Connectez-vous à claude.ai pour viser.";
    box.innerHTML = '<div class="visas-head"><h3>Visas et approbations</h3><span class="cite-src">Empreinte du texte en ligne : <code>' + esc(d.empreinte) + "</code></span></div>" +
      '<table class="visa-table"><tbody>' + rows + "</tbody></table>" +
      (actHtml ? '<div class="visa-actions">' + actHtml + "</div>" : "") +
      '<p class="visa-note">' + esc(who) + ' <button type="button" class="doclink" data-vgo="visas">Tableau des visas</button></p>';
  }

  async function vSign(key, etape) {
    var d = variantByKey(key); if (!d || !V.db || !V.me) return;
    var a = myActions(d).filter(function (x) { return x.etape === etape; })[0];
    if (!a) { toast("Cette action n'est plus possible : la page a été mise à jour."); V.pending = null; renderDocVisas(d); return; }
    var body = { doc: d.id, version: d.version, empreinte: d.empreinte, etape: etape, role: a.role, at: new Date().toISOString() };
    var com = $("#v-com"); if (com && com.value.trim()) body.commentaire = com.value.trim().slice(0, 300);
    if (etape === "adoption") {
      var se = $("#v-seance"), pv = $("#v-pv");
      if (!se || !se.value) { toast("Indiquez la date de la séance du Conseil."); return; }
      if (se.value > new Date().toISOString().slice(0, 10)) { toast("La date de séance ne peut pas être dans le futur."); return; }
      body.seance = se.value; if (pv && pv.value.trim()) body.pv = pv.value.trim().slice(0, 80);
    }
    try {
      await V.db.doc("sig/" + V.me + "/items/" + d.id + "~" + etape + "~" + d.empreinte).set(body);
      V.pending = null; toast(etape === "lecture" ? "Prise de connaissance enregistrée." : "Visa enregistré."); renderDocVisas(d);
    } catch (e) {
      toast(e && e.code === "invalid_argument" ? "" + (HOSTED ? "Votre accès ne permet pas d'enregistrer ce visa. Adressez-vous à l'administrateur." : "Votre niveau de partage ne permet pas d'enregistrer un visa. Demandez à l'administrateur de vous donner accès en tant que contributeur.") : "L'enregistrement a échoué. Réessayez.");
    }
  }

  // ---------- Onglet Visas ----------
  function renderVisas() {
    var v = $("#v-visas"); if (!v) return;
    if (!V.db) { v.innerHTML = '<div class="eyebrow">Visas</div><h1 class="title">Visas et approbations</h1><p class="lead">' + (V.ready ? "Les visas électroniques ne sont pas disponibles dans cette vue. Reconnectez-vous au référentiel." : "Chargement…") + "</p>"; return; }
    var mineHtml = "";
    if (V.me) {
      var todo = [];
      VARIANTS().forEach(function (d) { myActions(d).forEach(function (a) { todo.push({ d: d, a: a }); }); });
      mineHtml = '<h2 class="section-h" style="margin-top:28px">Mes actions</h2>' + (todo.length
        ? '<ul class="todo">' + todo.map(function (t) { return '<li><button type="button" class="doclink" data-vgo="' + esc(t.d.id + (t.d.estProjet ? "~projet" : "")) + '">' + esc(t.d.id) + " — " + esc(t.d.titre) + (t.d.estProjet ? " (projet de révision v" + esc(t.d.version) + ")" : "") + "</button> <span class=\"cite-src\">" + esc(t.a.label) + "</span></li>"; }).join("") + "</ul>"
        : '<p class="lead">Rien en attente de votre part.</p>');
    }
    var table = '<h2 class="section-h">État des documents</h2><div class="table-scroll"><table class="reg"><thead><tr><th>Document</th><th>Vérification</th><th>Approbation ou adoption</th><th>Prise de connaissance</th></tr></thead><tbody>' +
      VARIANTS().map(function (d) {
        var st = docState(d);
        var cell = function (x) { if (!x) return "—"; return x.cur ? '<span class="pill vigueur">Visé</span> <span class="cite-src">' + esc(fmtDT(x.cur.at).split(" à ")[0]) + "</span>" : x.old ? '<span class="pill projet">À reviser</span>' : '<span class="pill prevu">En attente</span>'; };
        var ver = st.steps.filter(function (x) { return x.st.etape === "verification"; })[0];
        var app = st.steps.filter(function (x) { return x.st.etape !== "verification"; })[0];
        return '<tr class="live" data-open="' + esc(d.id + (d.estProjet ? "~projet" : "")) + '"><td><div class="doc-title">' + esc(d.id) + (d.estProjet ? ' <span class="pill projet">révision v' + esc(d.version) + "</span>" : ' <span class="cite-src">v' + esc(d.version) + "</span>") + '</div><div class="doc-sum">' + esc(d.titre) + "</div></td><td>" + cell(ver) + "</td><td>" + cell(app) + "</td><td>" + (d.estProjet ? "après adoption" : st.readers.length ? st.read.length + " / " + st.readers.length : "—") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
    var admin = V.owner ? vAdminHtml() : "";
    v.innerHTML = '<div class="eyebrow">Visas</div><h1 class="title">Visas et approbations</h1>' +
      '<p class="lead">Chaque visa est enregistré par la personne elle-même, depuis son compte, avec la date, l\'heure et l\'empreinte du texte visé. Si le texte change, le visa doit être donné de nouveau.</p>' +
      mineHtml + table + admin;
  }

  function vAdminHtml() {
    var people = vPeople().filter(function (id) { return id !== V.me || hasRole(id, "pca") || true; });
    var roleRows = people.map(function (id) {
      var r = V.roles[id] || {}; var f = r.fonctions || [];
      return "<tr><td>" + esc(vName(id)) + (V.emails[id] ? '<div class="cite-src">' + esc(V.emails[id]) + "</div>" : "") + "</td>" +
        FONCTIONS.map(function (fn) { return '<td class="c"><input type="checkbox" aria-label="' + esc(FLABEL[fn[0]]) + '" data-vrole="' + esc(id) + "|" + fn[0] + '"' + (f.indexOf(fn[0]) >= 0 ? " checked" : "") + "></td>"; }).join("") +
        '<td class="c"><input type="checkbox" aria-label="Actif" data-vrole="' + esc(id) + '|__actif"' + (V.roles[id] && r.actif !== false ? " checked" : "") + (V.roles[id] ? "" : " disabled") + "></td></tr>";
    }).join("");
    var collabs = Object.keys(V.roles).filter(function (id) { return V.roles[id].actif !== false; });
    var lectRows = docs.map(function (d) {
      var L = V.lectures[d.id] || {};
      return "<tr><td><div class=\"doc-title\">" + esc(d.id) + "</div><div class=\"doc-sum\">" + esc(d.titre) + "</div></td>" +
        '<td class="c"><input type="checkbox" aria-label="Tous" data-vlect="' + esc(d.id) + '|__tous"' + (L.tous ? " checked" : "") + "></td>" +
        collabs.map(function (id) { return '<td class="c"><input type="checkbox" aria-label="' + esc(vName(id)) + '" data-vlect="' + esc(d.id) + "|" + esc(id) + '"' + ((L.ids || []).indexOf(id) >= 0 || L.tous ? " checked" : "") + (L.tous ? " disabled" : "") + "></td>"; }).join("") + "</tr>";
    }).join("");
    return '<h2 class="section-h">Administration</h2>' +
      '<p class="lead">' + (HOSTED ? "Réservé à l'administrateur. Pour donner l'accès à une personne, tapez son adresse Microsoft 365 complète dans la recherche, puis « Ajouter ». Décochez « Actif » pour retirer l'accès : la personne ne peut plus ouvrir le référentiel. Les visas déjà donnés restent au registre." : "Réservé à l'administrateur du référentiel. Une personne apparaît ici dès qu'elle a ouvert le référentiel avec son compte, ou par la recherche. Pour pouvoir viser, elle doit avoir reçu l'accès à la page avec un niveau qui permet d'écrire.") + '</p>' +
      '<h3 class="sub-h">Fonctions</h3>' + (HOSTED ? '<p class="lead"><a href="/membres">Ouvrir la page Membres</a> pour ouvrir, modifier ou couper les accès, et consulter le journal des connexions.</p>' : '') + '<div class="vsearch"><input type="search" id="v-q" placeholder="' + (HOSTED ? "Adresse Microsoft 365 ou nom" : "Rechercher une personne par nom ou adresse") + '" aria-label="Rechercher une personne">' +
      '<div id="v-hits">' + V.search.filter(function (h) { return vPeople().indexOf(h.id) < 0; }).map(function (h) { return '<button type="button" class="btn" data-vrole="' + esc(h.id) + '|__add">Ajouter ' + esc(h.name || h.email || "") + "</button>"; }).join("") + "</div></div>" +
      '<div class="table-scroll"><table class="reg vadm"><thead><tr><th>Personne</th>' + FONCTIONS.map(function (f) { return '<th class="c">' + esc(f[1]) + "</th>"; }).join("") + '<th class="c">Actif</th></tr></thead><tbody>' + (roleRows || '<tr><td colspan="8">Personne pour l\'instant.</td></tr>') + "</tbody></table></div>" +
      '<h3 class="sub-h">Lectures obligatoires</h3><p class="lead">Cochez les personnes qui doivent lire et attester chaque document. « Tous » vise toutes les personnes ayant une fonction active.</p>' +
      (collabs.length ? '<div class="table-scroll"><table class="reg vadm"><thead><tr><th>Document</th><th class="c">Tous</th>' + collabs.map(function (id) { return '<th class="c">' + esc(vName(id)) + "</th>"; }).join("") + "</tr></thead><tbody>" + lectRows + "</tbody></table></div>" : '<p class="lead">Attribuez d\'abord des fonctions.</p>') +
      '<h3 class="sub-h">Registre des visas</h3><p class="lead">Export de tous les visas enregistrés, pour le dossier de conformité ou une inspection.</p><button type="button" class="btn" data-vcsv="1">Exporter le registre (CSV)</button>';
  }

  async function vSetRole(id, key, on) {
    var r = V.roles[id] ? JSON.parse(JSON.stringify(V.roles[id])) : { fonctions: [], actif: true };
    if (key === "__add") { if (V.roles[id]) return; r = { fonctions: ["collab"], actif: true, depuis: new Date().toISOString().slice(0, 10) }; }
    else if (key === "__actif") r.actif = on;
    else { r.fonctions = (r.fonctions || []).filter(function (f) { return f !== key; }); if (on) r.fonctions.push(key); if (!r.depuis) r.depuis = new Date().toISOString().slice(0, 10); }
    r.maj = new Date().toISOString();
    try { await V.db.doc("roles/" + id).set(r); } catch (e) { toast("Modification refusée : seul le propriétaire de la page peut attribuer les fonctions."); renderVisas(); }
  }
  async function vSetLect(docId, key, on) {
    var L = V.lectures[docId] ? JSON.parse(JSON.stringify(V.lectures[docId])) : { ids: [], tous: false };
    if (key === "__tous") L.tous = on;
    else { L.ids = (L.ids || []).filter(function (x) { return x !== key; }); if (on) L.ids.push(key); }
    L.maj = new Date().toISOString();
    try { await V.db.doc("lectures/" + docId).set(L); } catch (e) { toast("Modification refusée : seul le propriétaire de la page peut désigner les lecteurs."); renderVisas(); }
  }
  async function vCsv() {
    var lines = [["Document", "Version", "Empreinte visée", "Empreinte en ligne", "Étape", "Fonction", "Personne", "Adresse", "Date et heure (UTC)", "Séance", "PV", "Fonction détenue", "Commentaire"].join(";")];
    Object.keys(V.sigs).forEach(function (id) {
      (V.sigs[id] || []).forEach(function (s) {
        var d = docs.filter(function (x) { return x.id === s.doc; })[0];
        lines.push([s.doc, s.version, s.empreinte, d ? d.empreinte : "", s.etape, FLABEL[s.role] || s.role, V.names[id] || "", V.emails[id] || "", s.at, s.seance || "", s.pv || "", s.role === "lecture" || hasRole(id, s.role) ? "oui" : "non", (s.commentaire || "").replace(/[;\n]/g, " ")].map(function (x) { return String(x == null ? "" : x); }).join(";"));
      });
    });
    var dl = await downloadsP;
    var data = "﻿" + lines.join("\r\n");
    if (!dl) { toast("Le téléchargement n'est pas disponible dans cette vue."); return; }
    try { await dl.save({ filename: "registre-des-visas_" + new Date().toISOString().slice(0, 10) + ".csv", data: data }); } catch (e) { if (!(e && e.code === "declined")) toast("Le téléchargement a échoué."); }
  }

  var vSearchTimer = null;
  document.addEventListener("input", function (ev) {
    if (ev.target.id !== "v-q" || !V.user) return;
    var q = ev.target.value;
    clearTimeout(vSearchTimer);
    vSearchTimer = setTimeout(async function () {
      try { V.search = await V.user.search(q); } catch (e) { V.search = []; }
      var box = $("#v-hits"); if (!box) return;
      box.innerHTML = V.search.filter(function (h) { return vPeople().indexOf(h.id) < 0; }).slice(0, 8).map(function (h) { return '<button type="button" class="btn" data-vrole="' + esc(h.id) + '|__add">Ajouter ' + esc(h.name || h.email || "cette personne") + "</button>"; }).join("");
    }, 250);
  });
  document.addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.matches("[data-vrole]")) { var p = t.getAttribute("data-vrole").split("|"); vSetRole(p[0], p[1], t.checked); }
    if (t.matches("[data-vlect]")) { var q = t.getAttribute("data-vlect").split("|"); vSetLect(q[0], q[1], t.checked); }
  });
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-vact],[data-vcsv],[data-vgo],button[data-vrole]"); if (!b) return;
    ev.preventDefault();
    if (b.hasAttribute("data-vgo")) { go(b.getAttribute("data-vgo")); return; }
    if (b.hasAttribute("data-vcsv")) { vCsv(); return; }
    if (b.hasAttribute("data-vrole")) { var r = b.getAttribute("data-vrole").split("|"); vSetRole(r[0], r[1], true); var q = $("#v-q"); if (q) q.value = ""; V.search = []; return; }
    var a = b.getAttribute("data-vact");
    if (a === "cancel") { var dc = V.pending && variantByKey(V.pending.doc); V.pending = null; if (dc) renderDocVisas(dc); return; }
    var p = a.split("|");
    if (p[2] === "ok") { vSign(p[0], p[1]); return; }
    V.pending = { doc: p[0], etape: p[1] };
    var d = variantByKey(p[0]); if (d) renderDocVisas(d);
  });

  function currentVariant(h) {
    var pj = /~projet$/.test(h), id = h.replace(/~projet$/, "");
    var d = docs.filter(function (x) { return x.id === id; })[0];
    return d ? (pj ? d.projet || d : d) : null;
  }
  // Rafraîchit la vue ouverte sans toucher un champ en cours de saisie
  function vRefresh() {
    var h = decodeURIComponent(location.hash.slice(1));
    var act = document.activeElement;
    if (act && (act.id === "v-q" || act.id === "v-seance" || act.id === "v-pv" || act.id === "v-com")) return;
    if (h === "visas") renderVisas();
    var d = currentVariant(h);
    if (d && !V.pending) renderDocVisas(d);
  }
