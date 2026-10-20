  // ---------- Visas, approbations et prises de connaissance ----------
  // Données (base partagée de la page) :
  //   roles/<id>              fonctions d'une personne — administrateur seul
  //   lectures/<docId>        personnes qui doivent lire le document — administrateur seul
  //   annuaire/<id>           « cette personne a ouvert le référentiel » — chacun pour soi
  //   sig/<id>/items/<clé>    visas et renvois d'une personne — chacun écrit les siens, personne d'autre
  //   circuits/<type>         circuit d'approbation d'un type de document — administrateur seul
  //   figes/<id>~<empreinte>  circuit retenu pour une version, figé au premier visa — jamais modifié
  //   etats/<docId>           document abrogé (administrateur ou RCCI) ou supprimé (administrateur seul)
  // Un visa ne compte que si la personne détient, dans roles/, la fonction qu'exige l'étape,
  // et il ne vaut que pour l'empreinte du texte qu'il porte.
  var HOSTED = !!window.__REF_CFG;
  var FONCTIONS = [
    ["pca", "Président du Conseil d'Administration"], ["adm", "Administrateur (membre du Conseil)"], ["dg", "Directeur Général"], ["rcci", "RCCI"],
    ["dcom", "Directeur Commercial"], ["dmc", "Directeur des Marchés de Capitaux"], ["redac", "Rédacteur"], ["collab", "Collaborateur"]
  ];
  var REGLES = { un: "une personne", tous: "toutes les personnes", majorite: "la majorité" };
  var VARIANTS = function () { var out = []; docs.forEach(function (d) { out.push(d); if (d.projet) out.push(d.projet); }); return out; };
  var variantByKey = function (k) { return VARIANTS().filter(function (x) { return x.id + "@" + x.empreinte === k; })[0]; };
  var FLABEL = {}; FONCTIONS.forEach(function (f) { FLABEL[f[0]] = f[1]; });
  var V = { db: null, user: null, me: null, owner: false, canWrite: false, ready: false, roles: {}, lectures: {}, annuaire: {}, sigs: {}, names: {}, emails: {}, subs: {},
    circuits: {}, figes: {}, etats: {}, redac: {}, auteurs: {}, adoptions: {}, pending: null, done: null, edit: null, search: [], landed: false };

  Promise.all([dbP, userP]).then(async function (r) {
    V.db = r[0]; V.user = r[1];
    if (V.user) {
      try { V.me = await V.user.id(); V.owner = await V.user.isOwner(); var w = await V.user.can("data.write"); V.canWrite = w !== false; } catch (e) { /* lecture seule */ }
    }
    vRenderMe();
    if (!V.db) { V.ready = true; vRefresh(); return; }
    var err = function () { /* hors ligne ou collection non disponible : on garde le dernier état */ };
    var watch = function (coll, key, after) {
      V.db.collection(coll).onSnapshot(function (s) { V[key] = {}; s.docs.forEach(function (d) { V[key][d.id] = d.data(); }); if (after) after(); vRefresh(); }, err);
    };
    watch("roles", "roles", function () { vWatchSigs(); vNames(); });
    watch("lectures", "lectures", function () { vWatchSigs(); vNames(); });
    watch("annuaire", "annuaire", function () { vWatchSigs(); vNames(); V.ready = true; });
    watch("circuits", "circuits");
    watch("figes", "figes");
    watch("etats", "etats", function () { if (typeof renderRegistre === "function") renderRegistre(); });
    watch("redaction", "redac");
    watch("auteurs", "auteurs");
    watch("adoptions", "adoptions", vAdoptionsManquantes);
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
  var holders = function (role) { return Object.keys(V.roles).filter(function (id) { return hasRole(id, role); }); };
  var myRoles = function () { return V.me && V.roles[V.me] && V.roles[V.me].actif !== false ? V.roles[V.me].fonctions || [] : []; };
  var canArchive = function () { return !!(V.db && V.me && (V.owner || hasRole(V.me, "rcci"))); };
  var fmtDT = function (s) { if (!s) return ""; var d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); };
  var fmtD = function (s) { return fmtDT(s).split(" à ")[0]; };
  var since = function (s) { if (!s) return ""; var n = Math.floor((Date.now() - new Date(s).getTime()) / 86400000); return n <= 0 ? "aujourd'hui" : n === 1 ? "depuis hier" : "depuis " + n + " jours"; };
  var docKey = function (d) { return d.id + "@" + d.empreinte; };
  var docHash = function (d) { return d.id + (d.estProjet ? "~projet" : ""); };

  // ---------- Circuits ----------
  var typeKey = function (t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  var TYPES = docs.map(function (d) { return d.type; }).filter(function (t, i, a) { return a.indexOf(t) === i; });
  function normStep(s) {
    return { etape: s.etape, label: s.label, role: s.role, fonction: s.fonction || FLABEL[s.role] || s.role, regle: s.regle || "un", obligatoire: s.obligatoire !== false, seance: s.seance != null ? !!s.seance : s.etape === "adoption" };
  }
  // Circuit d'une version : figé au premier visa ; sinon celui du type ; sinon celui déclaré dans le document
  function circOf(d) {
    var f = V.figes[d.id + "~" + d.empreinte]; if (f && f.etapes && f.etapes.length) return f.etapes.map(normStep);
    var c = V.circuits[typeKey(d.type)]; if (c && c.etapes && c.etapes.length) return c.etapes.map(normStep);
    return d.circuit.map(normStep);
  }
  var circSource = function (d) { return V.figes[d.id + "~" + d.empreinte] ? "fige" : V.circuits[typeKey(d.type)] ? "type" : "document"; };
  function defaultTypeCircuit(t) { var d = docs.filter(function (x) { return x.type === t; })[0]; return d ? d.circuit.map(normStep) : []; }
  function circuitIssues(steps) {
    var out = [], live = V.ready && V.db;
    if (!steps.some(function (s) { return s.obligatoire; })) out.push("aucune étape obligatoire");
    steps.forEach(function (s, i) {
      if (live && !holders(s.role).length) out.push("« " + s.label + " » : aucune personne active n'a la fonction " + (FLABEL[s.role] || s.role));
      steps.forEach(function (o, j) { if (live && j > i && o.role === s.role && holders(s.role).length < 2) out.push("« " + s.label + " » et « " + o.label + " » demandent la même fonction, détenue par une seule personne : la règle des quatre yeux bloquera le circuit"); });
    });
    return out;
  }

  // ---------- État d'un document ----------
  function sigsOf(docId, etape) {
    var out = [];
    Object.keys(V.sigs).forEach(function (id) { (V.sigs[id] || []).forEach(function (s) { if (s.doc === docId && (!etape || s.etape === etape)) out.push(s); }); });
    return out.sort(function (a, b) { return (a.at || "") < (b.at || "") ? 1 : -1; });
  }
  function stepState(d, step) {
    var all = sigsOf(d.id, step.etape).filter(function (s) { return hasRole(s.by, step.role); });
    var cur = all.filter(function (s) { return s.empreinte === d.empreinte; });
    var by = cur.map(function (s) { return s.by; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var h = holders(step.role);
    var need = step.regle === "tous" ? Math.max(1, h.length) : step.regle === "majorite" ? Math.floor(h.length / 2) + 1 : 1;
    return { st: step, sigs: cur, by: by, need: need, holders: h, done: by.length >= need, cur: cur[0] || null, old: cur.length ? null : all[0] || null };
  }
  function readersOf(d) {
    var L = V.lectures[d.id]; if (!L) return [];
    var ids = (L.ids || []).slice();
    if (L.tous) Object.keys(V.roles).forEach(function (id) { if (V.roles[id].actif !== false && ids.indexOf(id) < 0) ids.push(id); });
    return ids;
  }
  function docState(d) {
    var steps = circOf(d).map(function (st) { return stepState(d, st); });
    var renvois = sigsOf(d.id, "renvoi").filter(function (s) { return s.empreinte === d.empreinte; });
    var approved = !renvois.length && steps.some(function (x) { return x.st.obligatoire; }) && steps.every(function (x) { return x.done || !x.st.obligatoire; });
    var current = null;
    if (!approved && !renvois.length) for (var i = 0; i < steps.length; i++) { if (!steps[i].done && steps[i].st.obligatoire) { current = steps[i]; break; } }
    var readers = readersOf(d);
    var ok = d.lectureOK || [d.empreinte];
    var read = readers.filter(function (id) { return sigsOf(d.id, "lecture").some(function (s) { return s.by === id && ok.indexOf(s.empreinte) >= 0; }); });
    return { steps: steps, approved: approved, current: current, renvois: renvois, readers: readers, read: read };
  }
  // Règle des quatre yeux : une même personne ne vise pas deux étapes d'une même version
  function signedOther(d, etape) {
    return sigsOf(d.id).some(function (s) { return s.by === V.me && s.empreinte === d.empreinte && s.etape !== etape && s.etape !== "lecture" && s.etape !== "renvoi"; });
  }
  // Ce que la personne connectée peut faire maintenant, dans l'ordre du circuit
  function myActions(d) {
    if (!V.me || !V.canWrite || etatOf(d.id)) return [];
    var st = docState(d), acts = [];
    if (st.renvois.length) return [];
    if (isAuthor(d)) { if (!d.estProjet && st.approved && st.readers.indexOf(V.me) >= 0 && st.read.indexOf(V.me) < 0) acts.push({ etape: "lecture", label: "Prise de connaissance", role: "lecture" }); return acts; }
    for (var i = 0; i < st.steps.length; i++) {
      var x = st.steps[i];
      if (x.done) continue;
      if (hasRole(V.me, x.st.role) && x.by.indexOf(V.me) < 0 && !signedOther(d, x.st.etape)) acts.push({ etape: x.st.etape, label: x.st.label, role: x.st.role, seance: x.st.seance });
      if (x.st.obligatoire) break; // une étape obligatoire à la fois, dans l'ordre
    }
    if (!d.estProjet && st.approved && st.readers.indexOf(V.me) >= 0 && st.read.indexOf(V.me) < 0) acts.push({ etape: "lecture", label: "Prise de connaissance", role: "lecture" });
    return acts;
  }
  // Pourquoi la personne ne peut pas agir sur l'étape en cours : on l'explique plutôt que de la laisser chercher
  function myBlock(d) {
    if (!V.me) return "";
    var x = docState(d).current;
    if (!x || !hasRole(V.me, x.st.role)) return "";
    if (isAuthor(d)) return "Vous avez rédigé cette version : une autre personne ayant la fonction « " + (FLABEL[x.st.role] || x.st.role) + " » doit la viser (règle des quatre yeux).";
    var reste = x.need - x.by.length;
    if (x.by.indexOf(V.me) >= 0) return "Vous avez déjà visé cette étape ; elle attend encore " + reste + " visa" + (reste > 1 ? "s" : "") + ".";
    if (signedOther(d, x.st.etape)) return "Vous avez déjà visé une autre étape de cette version : une autre personne ayant la fonction « " + (FLABEL[x.st.role] || x.st.role) + " » doit viser (règle des quatre yeux).";
    return "";
  }
  function stageOf(d) {
    if (etatOf(d.id)) return { k: "archive", label: "Archivé" };
    var st = docState(d);
    if (st.renvois.length) return { k: "renvoi", label: "Renvoyés pour modification" };
    if (st.current) return { k: "etape:" + st.current.st.label, label: st.current.st.label, step: st.current };
    if (st.approved && !d.estProjet && st.readers.length && st.read.length < st.readers.length) return { k: "lecture", label: "Prise de connaissance" };
    if (st.approved) return { k: "ok", label: "Approuvés" + (d.statut !== "En vigueur" || d.estProjet ? " (mise en vigueur en cours)" : "") };
    return { k: "attente", label: "Circuit à configurer" };
  }
  // Filet de sécurité : un document approuvé mais pas encore en vigueur, sans demande d'adoption, en reçoit une
  var adoptionsDemandees = false;
  function vAdoptionsManquantes() {
    if (adoptionsDemandees || !HOSTED || !canArchive() || !V.ready) return;
    var manque = VARIANTS().filter(function (d) { return (d.statut !== "En vigueur" || d.estProjet) && !etatOf(d.id) && !V.adoptions[d.id + "~" + d.empreinte] && docState(d).approved; });
    if (!manque.length) return;
    adoptionsDemandees = true;
    Promise.all(manque.map(function (d) { return V.db.doc("adoptions/" + d.id + "~" + d.empreinte).set({ statut: "demande", at: new Date().toISOString(), par: V.me }).catch(function () {}); }))
      .then(function () { try { fetch("/api/appliquer", { method: "POST" }); } catch (e) { /* publication horaire */ } });
  }
  function vTodoList() {
    var out = [];
    VARIANTS().forEach(function (d) { myActions(d).forEach(function (a) { out.push({ d: d, a: a }); }); });
    return out;
  }

  // ---------- Abrogation (administrateur ou RCCI), suppression (administrateur seul) ----------
  function etatOf(id) { var e = V.etats && V.etats[id]; return e && (e.statut === "abroge" || e.statut === "supprime") ? e : null; }
  var canRestore = function (e) { return e && (e.statut === "abroge" ? canArchive() : V.owner); };
  async function setEtat(id, statut, motif) {
    if (!canArchive() || (statut === "supprime" && !V.owner)) { toast("Opération réservée à l'administrateur" + (statut === "supprime" ? "." : " et au RCCI.")); return; }
    var d0 = docs.filter(function (x) { return x.id === id; })[0] || { titre: "" };
    var verbe = statut === "abroge" ? "abroger" : statut === "supprime" ? "supprimer" : "rétablir";
    var ok = await confirmer({
      titre: statut === "abroge" ? "Abroger et archiver un document" : statut === "supprime" ? "Supprimer un document du registre" : "Rétablir un document dans le registre",
      html: "<dl><dt>Document</dt><dd><b>" + esc(id) + "</b> — " + esc(d0.titre) + "</dd>" + (motif ? "<dt>Motif</dt><dd>" + esc(motif) + "</dd>" : "") + "</dl>",
      points: statut === "abroge" ? ["Le document cesse de s'appliquer et quitte le registre.", "Il reste consultable dans les Archives, avec ses versions et ses visas."]
        : statut === "supprime" ? ["Le document disparaît du registre et des archives visibles.", "Il reste dans l'historique du dépôt et dans le journal ; l'administrateur peut le rétablir."]
        : ["Le document revient dans le registre, avec son état d'avant."],
      phrase: verbe + " " + id, bouton: verbe.charAt(0).toUpperCase() + verbe.slice(1), danger: statut === "supprime"
    });
    if (!ok) return;
    try {
      if (statut) await V.db.doc("etats/" + id).set({ statut: statut, motif: motif || "", date: new Date().toISOString(), par: V.me });
      else await V.db.doc("etats/" + id).delete();
      toast(statut === "abroge" ? id + " abrogé : il est désormais dans les Archives." : statut === "supprime" ? id + " supprimé du registre." : id + " rétabli dans le registre.");
    } catch (e) { toast("Opération refusée par la base : droits insuffisants."); }
  }

  // ---------- Barre de revue (haut du document) ----------
  function revbarHtml(d) {
    if (!V.db || !V.me) return "";
    var todo = vTodoList();
    if (V.done && V.done.key === docKey(d)) {
      var next = todo[0];
      return '<div class="revbar ok"><div class="rb-main"><b>' + esc(V.done.msg) + "</b> " + (next ? '<span class="cite-src">Il vous reste ' + todo.length + " document" + (todo.length > 1 ? "s" : "") + " à traiter.</span>" : '<span class="cite-src">Vous avez tout traité.</span>') + "</div>" +
        '<div class="rb-btns">' + (next ? '<button type="button" class="btn primary" data-vgo="' + esc(docHash(next.d)) + '">Document suivant : ' + esc(next.d.id) + " ›</button>" : "") + '<button type="button" class="btn" data-vgo="atraiter">Retour à « À traiter »</button></div></div>';
    }
    var acts = myActions(d), st = docState(d), block = myBlock(d);
    if (!acts.length) {
      if (block) return '<div class="revbar info"><div class="rb-main">' + esc(block) + "</div></div>";
      return "";
    }
    var p = V.pending && V.pending.doc === docKey(d) ? V.pending : null;
    var pos = todo.map(function (t) { return docKey(t.d); }).indexOf(docKey(d));
    var nav = todo.length > 1 ? ' <span class="rb-pos">' + (pos + 1) + " sur " + todo.length + " à traiter</span>" : "";
    if (p) {
      var a = acts.filter(function (x) { return x.etape === p.etape; })[0] || acts[0];
      if (p.mode === "renvoi") {
        return '<div class="revbar open"><div class="rb-main"><b>Renvoyer pour modification</b> — étape « ' + esc(a.label) + " ». Le circuit s'arrête ; il reprendra sur le texte corrigé.</div>" +
          '<label class="vf">Motif du renvoi (obligatoire)<textarea id="v-com" rows="2" maxlength="600" placeholder="Ce qui doit être corrigé avant de viser"></textarea></label>' +
          '<div class="rb-btns"><button type="button" class="btn primary" data-vact="' + esc(docKey(d)) + "|renvoi|ok|" + esc(a.etape) + '">Continuer…</button><button type="button" class="btn" data-vact="cancel">Annuler</button></div></div>';
      }
      var role = a.etape === "lecture" ? "" : " en qualité de " + (FLABEL[a.role] || a.role);
      var phrase = a.etape === "lecture" ? "je déclare avoir lu et compris" : a.seance ? "j'atteste que le Conseil d'Administration a adopté" : a.etape === "verification" ? "je vise, après vérification," : "j'approuve, à l'étape « " + a.label + " »,";
      return '<div class="revbar open"><div class="rb-main"><b>' + esc(vName(V.me).replace(" (vous)", "")) + "</b>" + esc(role) + " : " + phrase + " le document " + esc(d.id) + ", version " + esc(d.version) + ' (empreinte <code>' + esc(d.empreinte) + "</code>).</div>" +
        (a.seance ? '<div class="rb-row"><label class="vf">Date de la séance<input type="date" id="v-seance" required></label><label class="vf">Référence du procès-verbal<input type="text" id="v-pv" placeholder="PV n°…"></label></div>' : "") +
        '<label class="vf">Commentaire (facultatif)<input type="text" id="v-com" maxlength="300"></label>' +
        '<div class="rb-btns"><button type="button" class="btn primary" data-vact="' + esc(docKey(d)) + "|" + a.etape + '|ok">Continuer…</button><button type="button" class="btn" data-vact="cancel">Annuler</button></div></div>';
    }
    var main = acts[0];
    var btnLabel = main.etape === "lecture" ? "J'ai lu et compris" : main.seance ? "Enregistrer l'adoption" : main.etape === "verification" ? "Viser" : "Approuver";
    var nextDoc = todo.length > 1 ? todo[(pos + 1) % todo.length].d : null;
    return '<div class="revbar"><div class="rb-main"><span class="rb-tag">À vous</span> <b>' + esc(main.label) + "</b>" + (main.etape === "lecture" ? "" : ' <span class="cite-src">en qualité de ' + esc(FLABEL[main.role] || main.role) + "</span>") + nav + "</div>" +
      '<div class="rb-btns"><button type="button" class="btn primary" data-vact="' + esc(docKey(d)) + "|" + main.etape + '">' + btnLabel + "</button>" +
      (main.etape !== "lecture" ? '<button type="button" class="btn" data-vact="' + esc(docKey(d)) + "|" + main.etape + '|renvoi">Renvoyer avec commentaire</button>' : "") +
      (nextDoc ? '<button type="button" class="btn ghost" data-vgo="' + esc(docHash(nextDoc)) + '">Passer ›</button>' : "") + "</div></div>";
  }

  // ---------- Encadré sur la page d'un document ----------
  function stepStatusHtml(x) {
    if (x.done) return '<span class="pill vigueur">Visé</span> ' + x.sigs.slice(0, 3).map(function (s) { return esc(vName(s.by)) + " · " + esc(fmtDT(s.at)) + (s.seance ? " · séance du " + esc(fmtDate(s.seance)) + (s.pv ? ", " + esc(s.pv) : "") : ""); }).join("<br>");
    var part = x.need > 1 ? ' <span class="cite-src">' + x.by.length + " / " + x.need + " visas</span>" : "";
    if (x.old) return '<span class="pill projet">À viser de nouveau</span> <span class="cite-src">visé le ' + esc(fmtD(x.old.at)) + " sur une version antérieure</span>";
    return (x.st.obligatoire ? '<span class="pill prevu">En attente</span>' : '<span class="pill prevu">Facultative</span>') + part;
  }
  function renderDocVisas(d) {
    var bar = $("#doc-revbar"); if (bar) bar.innerHTML = revbarHtml(d);
    var adm = $("#doc-admin"); if (adm) adm.innerHTML = docAdminHtml(d);
    var ed = $("#doc-edit"); if (ed && !(ed.querySelector(".diffbox"))) renderDocEdit(d);
    var box = $("#doc-visas"); if (!box) return;
    if (RESTREINT) { box.innerHTML = maLectureHtml(d); return; }
    if (!V.db) { box.innerHTML = V.ready ? '<p class="visa-note">Les visas électroniques ne sont pas disponibles dans cette vue. Reconnectez-vous au référentiel.</p>' : ""; return; }
    var st = docState(d);
    var rows = st.steps.map(function (x, i) {
      return '<tr class="' + (st.current === x ? "cur" : "") + '"><td><span class="stepn">' + (i + 1) + "</span>" + esc(x.st.label) + '<div class="cite-src">' + esc(FLABEL[x.st.role] || x.st.fonction) + (x.st.regle !== "un" ? " · " + esc(REGLES[x.st.regle]) : "") + (x.st.obligatoire ? "" : " · facultative") + "</div></td><td>" + stepStatusHtml(x) + "</td></tr>";
    }).join("");
    var lect = st.readers.length
      ? (st.approved ? st.read.length + " sur " + st.readers.length + " personne" + (st.readers.length > 1 ? "s" : "") + " concernée" + (st.readers.length > 1 ? "s" : "") : "Ouverte après l'approbation · " + st.readers.length + " personne" + (st.readers.length > 1 ? "s" : "") + " désignée" + (st.readers.length > 1 ? "s" : ""))
      : "Aucune personne désignée";
    if (d.estProjet) lect = d.nature_revision === "mineure" ? "Correction mineure : les lectures de la version en vigueur restent valables" : "Demandée aux personnes concernées après l'adoption";
    rows += '<tr><td><span class="stepn">✓</span>Prise de connaissance</td><td>' + esc(lect) + "</td></tr>";
    var renv = st.renvois.length ? '<div class="rev-banner proj"><b>Renvoyé pour modification</b> par ' + esc(vName(st.renvois[0].by)) + " le " + esc(fmtDT(st.renvois[0].at)) + " : « " + esc(st.renvois[0].commentaire || "") + " ». Le circuit reprendra sur le texte corrigé (nouvelle empreinte).</div>" : "";
    var src = circSource(d), mine = myRoles();
    var who = V.me ? (mine.length ? "Vos fonctions : " + mine.map(function (f) { return FLABEL[f] || f; }).join(", ") + "." : V.owner ? "Vous êtes administrateur : attribuez les fonctions dans la page Membres." : "Aucune fonction ne vous est attribuée : vous consultez le document.") : HOSTED ? "Session expirée : reconnectez-vous." : "Connectez-vous à claude.ai pour viser.";
    box.innerHTML = '<div class="visas-head"><h3>Circuit d\'approbation</h3><span class="cite-src">' + (src === "fige" ? "Circuit figé au premier visa de cette version" : src === "type" ? "Circuit des documents de type « " + esc(d.type) + " »" : "Circuit déclaré dans le document") + ' · empreinte <code>' + esc(d.empreinte) + "</code></span></div>" + renv +
      '<table class="visa-table"><tbody>' + rows + "</tbody></table>" +
      '<p class="visa-note">' + esc(who) + ' <button type="button" class="doclink" data-vgo="circuit">Voir tous les circuits</button></p>';
  }

  // Gestion d'un document : abroger (administrateur ou RCCI), supprimer (administrateur), rétablir
  function docAdminHtml(d) {
    if (!canArchive() || d.estProjet) return "";
    var e = etatOf(d.id);
    if (V.edit && V.edit.etat === d.id) {
      var sup = V.edit.mode === "supprime";
      return '<div class="admin-act"><b>' + (sup ? "Supprimer " : "Abroger et archiver ") + esc(d.id) + "</b>" +
        '<p class="cite-src">' + (sup ? "Le document disparaît du registre et des archives visibles. Il reste dans l'historique du dépôt et dans le journal ; l'administrateur peut le rétablir." : "Le document cesse de s'appliquer. Il reste consultable dans les Archives, avec ses versions et ses visas.") + "</p>" +
        '<label class="vf">Motif (obligatoire)<input type="text" id="v-motif" maxlength="200"></label>' +
        '<div class="visa-btns"><button type="button" class="btn primary' + (sup ? " danger" : "") + '" data-vetat="' + esc(d.id) + "|" + V.edit.mode + '|ok">' + (sup ? "Supprimer du registre…" : "Abroger…") + '</button><button type="button" class="btn" data-vetat="cancel">Annuler</button></div></div>';
    }
    if (e) return '<div class="admin-act warn"><b>' + (e.statut === "abroge" ? "Document abrogé" : "Document supprimé du registre") + "</b> le " + esc(fmtD(e.date)) + (e.motif ? " — " + esc(e.motif) : "") + (canRestore(e) ? ' <button type="button" class="btn" data-vetat="' + esc(d.id) + '|restaurer">Rétablir</button>' : "") + "</div>";
    return '<details class="admin-menu"><summary>Gérer le document</summary><div class="admin-menu-in">' +
      '<button type="button" class="btn" data-vetat="' + esc(d.id) + '|abroge">Abroger et archiver…</button>' +
      (V.owner ? '<button type="button" class="btn danger" data-vetat="' + esc(d.id) + '|supprime">Supprimer…</button>' : "") +
      '<span class="cite-src">La modification du texte arrivera avec l\'édition en ligne.</span></div></details>';
  }

  async function vSign(key, etape, etapeVisee) {
    var d = variantByKey(key); if (!d || !V.db || !V.me) return;
    var a = myActions(d).filter(function (x) { return x.etape === (etape === "renvoi" ? etapeVisee : etape); })[0];
    if (!a) { toast("Cette action n'est plus possible : la page a été mise à jour."); V.pending = null; renderDocVisas(d); return; }
    var body = { doc: d.id, version: d.version, empreinte: d.empreinte, etape: etape, role: a.role, at: new Date().toISOString() };
    var com = $("#v-com"); if (com && com.value.trim()) body.commentaire = com.value.trim().slice(0, 600);
    if (etape === "renvoi") { if (!body.commentaire) { toast("Indiquez le motif du renvoi."); return; } body.etapeVisee = etapeVisee; }
    if (a.seance && etape !== "renvoi") {
      var se = $("#v-seance"), pv = $("#v-pv");
      if (!se || !se.value) { toast("Indiquez la date de la séance du Conseil."); return; }
      if (se.value > new Date().toISOString().slice(0, 10)) { toast("La date de séance ne peut pas être dans le futur."); return; }
      body.seance = se.value; if (pv && pv.value.trim()) body.pv = pv.value.trim().slice(0, 80);
    }
    var verbe = etape === "lecture" ? "j'ai lu" : etape === "renvoi" ? "renvoyer" : a.seance ? "adopter" : etape === "verification" ? "viser" : "approuver";
    var ok = await confirmer({
      titre: etape === "lecture" ? "Attester votre lecture" : etape === "renvoi" ? "Renvoyer le document pour modification" : a.seance ? "Enregistrer l'adoption par le Conseil" : "Donner votre visa",
      html: '<dl><dt>Document</dt><dd><b>' + esc(d.id) + "</b> — " + esc(d.titre) + "</dd><dt>Version</dt><dd>" + esc(d.version) + ' · empreinte <code>' + esc(d.empreinte) + "</code></dd>" +
        (etape === "lecture" ? "" : "<dt>Étape</dt><dd>" + esc(etape === "renvoi" ? "Renvoi à l'étape « " + a.label + " »" : a.label) + "</dd><dt>En qualité de</dt><dd>" + esc(FLABEL[a.role] || a.role) + "</dd>") +
        (body.seance ? "<dt>Séance</dt><dd>" + esc(fmtDate(body.seance)) + (body.pv ? " · " + esc(body.pv) : "") + "</dd>" : "") +
        (body.commentaire ? "<dt>" + (etape === "renvoi" ? "Motif" : "Commentaire") + "</dt><dd>" + esc(body.commentaire) + "</dd>" : "") + "</dl>",
      points: etape === "lecture" ? ["Vous déclarez avoir lu et compris ce document, dans cette version.", "L'attestation est enregistrée à votre nom, avec la date et l'heure."]
        : etape === "renvoi" ? ["Le circuit s'arrête pour cette version.", "Les rédacteurs voient votre motif ; le circuit reprendra sur le texte corrigé."]
        : ["Votre visa est enregistré à votre nom, avec la date, l'heure et l'empreinte du texte.", "Il ne vaut que pour ce texte : toute modification ultérieure demandera un nouveau visa."],
      phrase: verbe + " " + d.id, bouton: etape === "lecture" ? "Attester" : etape === "renvoi" ? "Renvoyer" : a.seance ? "Enregistrer l'adoption" : verbe === "viser" ? "Viser" : "Approuver", danger: etape === "renvoi"
    });
    if (!ok) return;
    try {
      // Le circuit de cette version est figé au premier visa : un changement ultérieur du circuit du type ne s'y applique pas
      if (etape !== "lecture" && !V.figes[d.id + "~" + d.empreinte]) {
        var fig = { etapes: circOf(d), type: d.type, at: body.at, par: V.me };
        try { await V.db.doc("figes/" + d.id + "~" + d.empreinte).set(fig); V.figes[d.id + "~" + d.empreinte] = fig; } catch (e) { /* déjà figé par une autre personne */ }
      }
      await V.db.doc("sig/" + V.me + "/items/" + d.id + "~" + etape + "~" + d.empreinte).set(body);
      V.pending = null;
      V.done = { key: docKey(d), msg: etape === "renvoi" ? "Document renvoyé pour modification." : etape === "lecture" ? "Prise de connaissance enregistrée." : a.seance ? "Adoption enregistrée." : "Visa enregistré." };
      toast(V.done.msg); renderDocVisas(d); window.scrollTo(0, 0);
      // Dernière étape visée : demande d'adoption (passage en vigueur), vérifiée puis traitée par la publication automatique
      if (etape !== "lecture" && etape !== "renvoi" && docState(d).approved && HOSTED) {
        try { await V.db.doc("adoptions/" + d.id + "~" + d.empreinte).set({ statut: "demande", at: new Date().toISOString(), par: V.me }); } catch (e) { /* déjà demandée */ }
        try { fetch("/api/appliquer", { method: "POST" }); } catch (e) { /* la publication horaire prendra le relais */ }
        V.done.msg += " Le circuit est complet : le document passe en vigueur (publication en cours, quelques minutes).";
        renderDocVisas(d);
      }
    } catch (e) {
      toast(e && e.code === "invalid_argument" ? (HOSTED ? "Votre accès ne permet pas d'enregistrer ce visa. Adressez-vous à l'administrateur." : "Votre niveau de partage ne permet pas d'enregistrer un visa. Demandez à l'administrateur de vous donner accès en tant que contributeur.") : "L'enregistrement a échoué. Réessayez.");
    }
  }

  // ---------- Page « À traiter » ----------
  function renderATraiter() {
    var v = $("#v-atraiter"); if (!v) return;
    var head = '<div class="eyebrow">Mon espace</div><h1 class="title">À traiter</h1>';
    if (!V.db || !V.me) { v.innerHTML = head + '<p class="lead">' + (V.ready ? (HOSTED ? "Session expirée : reconnectez-vous." : "Connectez-vous à claude.ai pour voir ce qui vous attend.") : "Chargement…") + "</p>"; return; }
    var todo = vTodoList();
    var visas = todo.filter(function (t) { return t.a.etape !== "lecture"; }), lect = todo.filter(function (t) { return t.a.etape === "lecture"; });
    var waitSince = function (d) { var prev = docState(d).steps.filter(function (x) { return x.done && x.cur; }).map(function (x) { return x.cur.at; }).sort().pop(); return prev ? since(prev) : ""; };
    var item = function (t) {
      var s = waitSince(t.d);
      return '<li class="tt-item"><div class="tt-main"><div class="tt-ref">' + esc(t.d.id) + (t.d.estProjet ? ' <span class="pill projet">révision v' + esc(t.d.version) + "</span>" : "") + '</div><div class="tt-title">' + esc(t.d.titre) + '</div><div class="cite-src">' + esc(t.a.label) + (t.a.etape === "lecture" ? "" : " · en qualité de " + esc(FLABEL[t.a.role] || t.a.role)) + (s ? " · " + esc(s) : "") + "</div></div>" +
        '<button type="button" class="btn primary" data-vgo="' + esc(docHash(t.d)) + '">' + (t.a.etape === "lecture" ? "Lire" : "Examiner") + "</button></li>";
    };
    var html = head + '<p class="lead">Les documents qui attendent une action de votre part. Ouvrez-les un par un : la barre en haut du document propose de viser, d\'approuver ou de renvoyer avec un commentaire, puis passe au suivant.</p>';
    html += '<h2 class="section-h">À viser ou approuver <span class="count-chip">' + visas.length + "</span></h2>" + (visas.length ? '<ul class="tt-list">' + visas.map(item).join("") + "</ul>" : '<p class="tt-empty">Rien en attente de votre visa.</p>');
    html += '<h2 class="section-h">À lire <span class="count-chip">' + lect.length + "</span></h2>" + (lect.length ? '<ul class="tt-list">' + lect.map(item).join("") + "</ul>" : '<p class="tt-empty">Aucune lecture en attente.</p>');
    html += myDraftsHtml();
    if (canArchive()) {
      var ren = VARIANTS().filter(function (d) { return !etatOf(d.id) && docState(d).renvois.length; });
      var bloq = []; TYPES.forEach(function (t) { var d = docs.filter(function (x) { return x.type === t; })[0]; circuitIssues(circOf(d)).forEach(function (m) { bloq.push(t + " — " + m); }); });
      html += '<h2 class="section-h">Suivi du référentiel</h2>';
      html += ren.length ? '<p class="side-title">Renvoyés pour modification</p><ul class="tt-list">' + ren.map(function (d) { var r = docState(d).renvois[0]; return '<li class="tt-item"><div class="tt-main"><div class="tt-ref">' + esc(d.id) + '</div><div class="tt-title">' + esc(d.titre) + '</div><div class="cite-src">Par ' + esc(vName(r.by)) + " le " + esc(fmtD(r.at)) + " : « " + esc(r.commentaire || "") + " »</div></div><button type=\"button\" class=\"btn\" data-vgo=\"" + esc(docHash(d)) + '">Ouvrir</button></li>'; }).join("") + "</ul>" : "";
      html += bloq.length ? '<p class="side-title">Circuits à corriger</p><ul class="tt-warn">' + bloq.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + '</ul><p><button type="button" class="btn" data-vgo="circuit">Ouvrir les circuits</button></p>' : "";
      if (!ren.length && !bloq.length) html += '<p class="tt-empty">Aucun renvoi, aucun circuit bloqué.</p>';
    }
    v.innerHTML = html;
  }

  // ---------- Page « Suivi des visas » ----------
  function stepperHtml(d) {
    var st = docState(d);
    return '<ol class="stepper">' + st.steps.map(function (x) { return '<li class="' + (x.done ? "ok" : st.current === x ? "cur" : x.old ? "re" : "") + (x.st.obligatoire ? "" : " opt") + '" title="' + esc(x.st.label + " — " + (FLABEL[x.st.role] || x.st.role) + (x.done ? " : visé" : st.current === x ? " : en cours" : "")) + '"><i></i><span>' + esc(x.st.label) + "</span></li>"; }).join("") + "</ol>" + (st.renvois.length ? ' <span class="pill projet">Renvoyé</span>' : "");
  }
  function renderVisas() {
    var v = $("#v-visas"); if (!v) return;
    if (!V.db) { v.innerHTML = '<div class="eyebrow">Visas</div><h1 class="title">Suivi des visas</h1><p class="lead">' + (V.ready ? "Les visas électroniques ne sont pas disponibles dans cette vue. Reconnectez-vous au référentiel." : "Chargement…") + "</p>"; return; }
    var n = vTodoList().length;
    var table = '<div class="table-scroll panel-gap"><table class="reg"><thead><tr><th>Document</th><th>Avancement du circuit</th><th>Prise de connaissance</th></tr></thead><tbody>' +
      VARIANTS().filter(function (d) { return !etatOf(d.id); }).map(function (d) {
        var st = docState(d);
        return '<tr class="live" data-open="' + esc(docHash(d)) + '"><td><div class="doc-title">' + esc(d.id) + (d.estProjet ? ' <span class="pill projet">révision v' + esc(d.version) + "</span>" : ' <span class="cite-src">v' + esc(d.version) + "</span>") + '</div><div class="doc-sum">' + esc(d.titre) + "</div></td><td>" + stepperHtml(d) + "</td><td>" + (d.estProjet ? "après adoption" : st.readers.length ? st.read.length + " / " + st.readers.length : "—") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
    v.innerHTML = '<div class="eyebrow">Visas</div><h1 class="title">Suivi des visas</h1>' +
      '<p class="lead">Chaque visa est enregistré par la personne elle-même, avec la date, l\'heure et l\'empreinte du texte visé. Si le texte change, le circuit recommence.' + (n ? ' <button type="button" class="doclink" data-vgo="atraiter">Vous avez ' + n + " action" + (n > 1 ? "s" : "") + " en attente.</button>" : "") + "</p>" +
      table + (V.owner ? vAdminHtml() : "");
  }

  function vAdminHtml() {
    var collabs = Object.keys(V.roles).filter(function (id) { return V.roles[id].actif !== false; });
    var lectRows = docs.filter(function (d) { return !etatOf(d.id); }).map(function (d) {
      var L = lectOf(d.id);
      return "<tr" + (V.lectEdits[d.id] ? ' class="edited"' : "") + "><td><div class=\"doc-title\">" + esc(d.id) + "</div><div class=\"doc-sum\">" + esc(d.titre) + "</div></td>" +
        '<td class="c"><input type="checkbox" aria-label="Tous" data-vlect="' + esc(d.id) + '|__tous"' + (L.tous ? " checked" : "") + "></td>" +
        collabs.map(function (id) { return '<td class="c"><input type="checkbox" aria-label="' + esc(vName(id)) + '" data-vlect="' + esc(d.id) + "|" + esc(id) + '"' + ((L.ids || []).indexOf(id) >= 0 || L.tous ? " checked" : "") + (L.tous ? " disabled" : "") + "></td>"; }).join("") + "</tr>";
    }).join("");
    var fonctions = HOSTED ? '<p class="lead">Les accès et les fonctions se gèrent dans la page <a href="/membres">Membres</a>.</p>' : vRolesHtml();
    return '<h2 class="section-h">Administration</h2>' + fonctions +
      '<h3 class="sub-h">Lectures obligatoires</h3><p class="lead">Cochez les personnes qui doivent lire et attester chaque document. « Tous » vise toutes les personnes ayant une fonction active. Les changements s\'enregistrent ensemble, après vérification.</p>' +
      (Object.keys(V.lectEdits).length ? '<div class="pending-bar"><span>' + Object.keys(V.lectEdits).length + " document(s) modifié(s), non enregistré(s)</span><button type=\"button\" class=\"btn primary\" data-vlectsave=\"1\">Vérifier et enregistrer…</button><button type=\"button\" class=\"btn\" data-vlectsave=\"annuler\">Annuler</button></div>" : "") +
      (collabs.length ? '<div class="table-scroll"><table class="reg vadm"><thead><tr><th>Document</th><th class="c">Tous</th>' + collabs.map(function (id) { return '<th class="c">' + esc(vName(id)) + "</th>"; }).join("") + "</tr></thead><tbody>" + lectRows + "</tbody></table></div>" : '<p class="lead">Attribuez d\'abord des fonctions.</p>') +
      '<h3 class="sub-h">Registre des visas</h3><p class="lead">Export de tous les visas et renvois enregistrés, pour le dossier de conformité ou une inspection.</p><button type="button" class="btn" data-vcsv="1">Exporter le registre (CSV)</button>';
  }
  // Attribution des fonctions dans la page claude.ai (sur le site hébergé : page Membres)
  function vRolesHtml() {
    var roleRows = vPeople().map(function (id) {
      var r = V.roles[id] || {}; var f = r.fonctions || [];
      return "<tr><td>" + esc(vName(id)) + (V.emails[id] ? '<div class="cite-src">' + esc(V.emails[id]) + "</div>" : "") + "</td>" +
        FONCTIONS.map(function (fn) { return '<td class="c"><input type="checkbox" aria-label="' + esc(FLABEL[fn[0]]) + '" data-vrole="' + esc(id) + "|" + fn[0] + '"' + (f.indexOf(fn[0]) >= 0 ? " checked" : "") + "></td>"; }).join("") +
        '<td class="c"><input type="checkbox" aria-label="Actif" data-vrole="' + esc(id) + '|__actif"' + (V.roles[id] && r.actif !== false ? " checked" : "") + (V.roles[id] ? "" : " disabled") + "></td></tr>";
    }).join("");
    return '<h3 class="sub-h">Fonctions</h3><div class="vsearch"><input type="search" id="v-q" placeholder="Rechercher une personne par nom ou adresse" aria-label="Rechercher une personne">' +
      '<div id="v-hits"></div></div>' +
      '<div class="table-scroll"><table class="reg vadm"><thead><tr><th>Personne</th>' + FONCTIONS.map(function (f) { return '<th class="c">' + esc(f[1]) + "</th>"; }).join("") + '<th class="c">Actif</th></tr></thead><tbody>' + (roleRows || '<tr><td colspan="9">Personne pour l\'instant.</td></tr>') + "</tbody></table></div>";
  }

  // ---------- Accès employé : mes documents ----------
  function maLecture(d) {
    var st = docState(d), L = V.lectures[d.id] || {};
    var ids = [V.me]; var lecteur = st.readers.indexOf(V.me) >= 0;
    var consult = !lecteur && (L.consult || []).some(function (x) { return ids.indexOf(x) >= 0; });
    var ok = d.lectureOK || [d.empreinte];
    var sig = sigsOf(d.id, "lecture").filter(function (s) { return s.by === V.me && ok.indexOf(s.empreinte) >= 0; })[0];
    var etat = !lecteur ? "consult" : sig ? "lu" : st.approved ? "alire" : "attente";
    return { etat: etat, sig: sig, consult: consult };
  }
  function maLectureHtml(d) {
    if (!V.db || !V.me) return "";
    var m = maLecture(d);
    var txt = m.etat === "lu" ? '<span class="pill vigueur">Lu et attesté</span> le ' + esc(fmtDT(m.sig.at)) + " (version " + esc(m.sig.version || d.version) + ")"
      : m.etat === "alire" ? '<span class="pill projet">À lire et attester</span> Lisez le document, puis confirmez avec le bouton en haut de la page.'
      : m.etat === "attente" ? '<span class="pill prevu">En cours d\'approbation</span> Vous serez invité à le lire et à l\'attester dès son adoption.'
      : '<span class="pill prevu">Consultation</span> Ce document est mis à votre disposition ; aucune attestation n\'est demandée.';
    return '<div class="visas-head"><h3>Votre prise de connaissance</h3></div><p class="visa-note" style="margin:0">' + txt + "</p>";
  }
  function renderMesDocs() {
    var v = $("#v-mesdocs"); if (!v) return;
    var head = '<div class="eyebrow">' + esc(DATA.societe && DATA.societe.raison_sociale || "") + '</div><h1 class="title">Mes documents</h1>';
    if (!V.db || !V.me) { v.innerHTML = head + '<p class="lead">' + (V.ready ? "Session expirée : reconnectez-vous." : "Chargement…") + "</p>"; return; }
    if (!docs.length) { v.innerHTML = head + '<p class="lead">Aucun document ne vous est attribué pour le moment. L\'administrateur vous préviendra lorsqu\'un document vous concernera.</p>'; return; }
    var order = { alire: 0, attente: 1, lu: 2, consult: 3 };
    var list = docs.map(function (d) { return { d: d, m: maLecture(d) }; }).sort(function (a, b) { return order[a.m.etat] - order[b.m.etat] || a.d.id.localeCompare(b.d.id); });
    var n = list.filter(function (x) { return x.m.etat === "alire"; }).length;
    v.innerHTML = head + '<p class="lead">' + (n ? "Vous avez " + n + " document" + (n > 1 ? "s" : "") + " à lire et à attester. Ouvrez-le, lisez-le, puis confirmez votre lecture avec le bouton en haut de la page." : "Vous êtes à jour : aucune lecture en attente.") + "</p>" +
      '<ul class="md-list panel-gap">' + list.map(function (x) {
        var d = x.d, m = x.m;
        var st = m.etat === "lu" ? "Lu et attesté le " + fmtD(m.sig.at) : m.etat === "alire" ? "À lire et attester" : m.etat === "attente" ? "En cours d'approbation — lecture demandée après l'adoption" : "Consultation";
        return '<li class="md-item ' + (m.etat === "alire" ? "todo" : m.etat === "lu" ? "ok" : "") + '"><div class="eyebrow">' + esc(d.type) + " · " + esc(d.id) + " · v" + esc(d.version) + "</div><h3>" + esc(d.titre) + '</h3><div class="md-state">' + esc(st) + '</div><p class="cite-src" style="margin:0">' + esc(d.resume || "") + '</p><div class="row-actions"><button type="button" class="btn' + (m.etat === "alire" ? " primary" : "") + '" data-open="' + esc(d.id) + '">' + (m.etat === "alire" ? "Lire et attester" : "Ouvrir") + "</button>" + dlBtn(d.pdf.file, "PDF") + "</div></li>";
      }).join("") + "</ul>";
  }

  // ---------- Page « Circuit d'approbation » (dynamique) ----------
  function renderCircuit() {
    var v = $("#v-circuit"); if (!v) return;
    var live = VARIANTS().filter(function (d) { return !etatOf(d.id); });
    var cols = [], seen = {};
    live.forEach(function (d) {
      var s = stageOf(d);
      if (!seen[s.k]) {
        var order = s.k === "renvoi" ? -1 : s.k === "lecture" ? 50 : s.k === "ok" ? 60 : s.k === "attente" ? 70 : circOf(d).map(function (x) { return x.label; }).indexOf(s.label);
        seen[s.k] = { k: s.k, label: s.label, docs: [], order: order }; cols.push(seen[s.k]);
      }
      seen[s.k].docs.push(d);
    });
    cols.sort(function (a, b) { return a.order - b.order; });
    var board = V.db ? '<div class="kanban">' + cols.map(function (c) {
      return '<section class="kcol k-' + esc(c.k.split(":")[0]) + '"><h3>' + esc(c.label) + ' <span class="count-chip">' + c.docs.length + "</span></h3><ul>" + c.docs.map(function (d) {
        var cur = docState(d).current;
        var who = cur ? (cur.holders.length ? cur.holders.map(function (h) { return vName(h); }).join(", ") : "aucun titulaire de la fonction") : "";
        return '<li><button type="button" data-open="' + esc(docHash(d)) + '"><span class="k-ref">' + esc(d.id) + (d.estProjet ? " · révision" : "") + '</span><span class="k-title">' + esc(d.titre) + "</span>" + (who ? '<span class="k-who">' + esc(who) + (cur.need > 1 ? " · " + cur.by.length + "/" + cur.need : "") + "</span>" : "") + "</button></li>";
      }).join("") + "</ul></section>";
    }).join("") + "</div>" : '<p class="lead">' + (V.ready ? "Le suivi n'est pas disponible dans cette vue." : "Chargement…") + "</p>";
    var niv = {}; (DATA.niveaux || []).forEach(function (n) { niv[n.type] = n; });
    var cards = TYPES.map(function (t) {
      var k = typeKey(t), cfg = V.circuits[k], steps = cfg && cfg.etapes && cfg.etapes.length ? cfg.etapes.map(normStep) : defaultTypeCircuit(t);
      if (V.edit && V.edit.type === k) return circEditorHtml(t, V.edit.steps);
      var ofType = docs.filter(function (d) { return d.type === t; });
      var varies = !cfg && ofType.some(function (d) { return JSON.stringify(d.circuit) !== JSON.stringify(ofType[0].circuit); });
      var issues = circuitIssues(steps);
      return '<article class="ccard"><header><div><h3>' + esc(t) + '</h3><span class="cite-src">' + ofType.length + " document" + (ofType.length > 1 ? "s" : "") + (niv[t] ? " · revue " + esc(String(niv[t].revue).toLowerCase()) : "") + " · " + (cfg ? "défini par l'administrateur" + (cfg.maj ? " le " + esc(fmtD(cfg.maj)) : "") : "déclaré dans les documents") + "</span></div>" +
        (V.owner && V.db ? '<button type="button" class="btn" data-vcirc="' + esc(k) + '|edit">Modifier</button>' : "") + "</header>" +
        '<ol class="csteps">' + steps.map(function (s, i) { return '<li class="' + (s.obligatoire ? "" : "opt") + '"><span class="stepn">' + (i + 1) + "</span><div><b>" + esc(s.label) + "</b><span>" + esc(FLABEL[s.role] || s.fonction) + (s.regle !== "un" ? " · " + esc(REGLES[s.regle]) : "") + (s.obligatoire ? "" : " · facultative") + (s.seance ? " · date de séance et PV" : "") + "</span></div></li>"; }).join("") +
        '<li class="end"><span class="stepn">✓</span><div><b>Prise de connaissance</b><span>Personnes désignées</span></div></li></ol>' +
        (varies ? '<p class="cite-src">Les documents de ce type déclarent des circuits différents ; le premier est affiché. Définir le circuit du type l\'appliquera à tous.</p>' : "") +
        (issues.length ? '<ul class="tt-warn">' + issues.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul>" : "") + "</article>";
    }).join("");
    v.innerHTML = '<div class="eyebrow">Gouvernance documentaire</div><h1 class="title">Circuit d\'approbation</h1>' +
      '<p class="lead">Où en est chaque document, et qui doit agir. Les étapes se visent dans l\'ordre ; une même personne ne vise pas deux étapes d\'une même version (règle des quatre yeux). Si le texte change, le circuit recommence.</p>' +
      '<h2 class="section-h">Où en sont les documents</h2>' + board +
      '<h2 class="section-h">Circuits par type de document</h2><p class="lead">' + (V.owner ? "Vous pouvez modifier le circuit de chaque type. Le nouveau circuit s'applique aux versions dont le circuit n'a pas commencé ; une version déjà visée garde le circuit de son premier visa." : "Définis par l'administrateur. Une version déjà visée garde le circuit de son premier visa.") + '</p><div class="ccards">' + cards + "</div>" +
      '<p class="cite-src panel-gap">Numérotation des versions : 0.x pour un projet, 1.0 à l\'adoption, 1.1 pour une correction mineure (forme, coquille : les lectures restent valables), 2.0 pour une révision de fond, soumise de nouveau au circuit et à la lecture.</p>';
  }
  function circEditorHtml(t, steps) {
    var k = typeKey(t);
    var opt = function (list, val) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join(""); };
    var regles = Object.keys(REGLES).map(function (r) { return [r, REGLES[r]]; });
    var issues = circuitIssues(steps.map(normStep));
    return '<article class="ccard editing"><header><div><h3>' + esc(t) + '</h3><span class="cite-src">Modification du circuit</span></div></header>' +
      '<ol class="cedit">' + steps.map(function (s, i) {
        return '<li><span class="stepn">' + (i + 1) + '</span><div class="ce-fields">' +
          '<label class="vf">Étape<input type="text" data-cedit="' + i + '|label" value="' + esc(s.label) + '" maxlength="80"></label>' +
          '<label class="vf">Fonction<select data-cedit="' + i + '|role">' + opt(FONCTIONS, s.role) + "</select></label>" +
          '<label class="vf">Qui doit viser<select data-cedit="' + i + '|regle">' + opt(regles, s.regle || "un") + "</select></label>" +
          '<label class="chkl"><input type="checkbox" data-cedit="' + i + '|obligatoire"' + (s.obligatoire !== false ? " checked" : "") + "> Obligatoire</label>" +
          '<label class="chkl"><input type="checkbox" data-cedit="' + i + '|seance"' + (s.seance ? " checked" : "") + "> Date de séance et PV</label></div>" +
          '<div class="ce-move"><button type="button" class="icon-btn" data-vcirc="' + k + "|up|" + i + '" aria-label="Monter"' + (i ? "" : " disabled") + '>↑</button><button type="button" class="icon-btn" data-vcirc="' + k + "|down|" + i + '" aria-label="Descendre"' + (i < steps.length - 1 ? "" : " disabled") + '>↓</button><button type="button" class="icon-btn" data-vcirc="' + k + "|del|" + i + '" aria-label="Supprimer l\'étape">✕</button></div></li>';
      }).join("") + "</ol>" +
      '<button type="button" class="btn" data-vcirc="' + k + '|add">+ Ajouter une étape</button>' +
      (issues.length ? '<ul class="tt-warn">' + issues.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul>" : "") +
      '<div class="visa-btns"><button type="button" class="btn primary" data-vcirc="' + k + '|save">Enregistrer le circuit</button><button type="button" class="btn" data-vcirc="' + k + '|cancel">Annuler</button>' +
      (V.circuits[k] ? '<button type="button" class="btn ghost" data-vcirc="' + k + '|reset">Revenir au circuit déclaré dans les documents</button>' : "") + "</div></article>";
  }
  async function circAction(k, act, i) {
    var t = TYPES.filter(function (x) { return typeKey(x) === k; })[0];
    if (act === "edit") { var c = V.circuits[k]; V.edit = { type: k, steps: JSON.parse(JSON.stringify(c && c.etapes && c.etapes.length ? c.etapes.map(normStep) : defaultTypeCircuit(t))) }; renderCircuit(); return; }
    if (!V.edit || V.edit.type !== k) return;
    var s = V.edit.steps; i = +i;
    if (act === "cancel") { V.edit = null; renderCircuit(); return; }
    if (act === "up" && i > 0) { var a = s[i - 1]; s[i - 1] = s[i]; s[i] = a; }
    if (act === "down" && i < s.length - 1) { var b = s[i + 1]; s[i + 1] = s[i]; s[i] = b; }
    if (act === "del") s.splice(i, 1);
    if (act === "add") s.push({ label: "Nouvelle étape", role: "dg", regle: "un", obligatoire: true, seance: false });
    if (act === "reset") {
      if (!(await confirmer({ titre: "Revenir au circuit déclaré dans les documents", html: "<p>Type : <b>" + esc(t) + "</b></p>", points: ["Chaque document de ce type reprend le circuit inscrit dans son en-tête.", "Les versions déjà visées gardent le circuit de leur premier visa."], phrase: "rétablir le circuit " + t, bouton: "Rétablir" }))) return;
      try { await V.db.doc("circuits/" + k).delete(); V.edit = null; toast("Le type « " + t + " » reprend le circuit déclaré dans chaque document."); } catch (e) { toast("Opération refusée : réservée à l'administrateur."); } return; }
    if (act === "save") {
      var used = {};
      var steps = s.map(function (x) {
        var base = x.etape || (x.seance ? "adoption" : /v[ée]rif/i.test(x.label) ? "verification" : /approb/i.test(x.label) ? "approbation" : typeKey(x.label) || "etape");
        var e = base, n = 2; while (used[e]) e = base + "-" + n++; used[e] = 1;
        return { etape: e, label: String(x.label || "").trim(), role: x.role, fonction: FLABEL[x.role] || x.role, regle: x.regle || "un", obligatoire: x.obligatoire !== false, seance: !!x.seance };
      });
      if (!steps.length || steps.some(function (x) { return !x.label; })) { toast("Chaque étape doit avoir un nom."); return; }
      if (!steps.some(function (x) { return x.obligatoire; })) { toast("Le circuit doit comporter au moins une étape obligatoire."); return; }
      var ok = await confirmer({
        titre: "Modifier le circuit des documents de type « " + t + " »",
        html: '<ol class="csteps">' + steps.map(function (x, i) { return '<li class="' + (x.obligatoire ? "" : "opt") + '"><span class="stepn">' + (i + 1) + "</span><div><b>" + esc(x.label) + "</b><span>" + esc(x.fonction) + (x.regle !== "un" ? " · " + esc(REGLES[x.regle]) : "") + (x.obligatoire ? "" : " · facultative") + (x.seance ? " · date de séance et PV" : "") + "</span></div></li>"; }).join("") + "</ol>",
        points: ["S'applique aux versions dont le circuit n'a pas encore commencé.", "Une version déjà visée garde le circuit de son premier visa.", "La Procédure de maîtrise documentaire doit rester cohérente avec ce circuit."].concat(circuitIssues(steps).map(function (m) { return "<b>Attention :</b> " + esc(m); })),
        phrase: "modifier le circuit " + t, bouton: "Enregistrer le circuit"
      });
      if (!ok) return;
      try { await V.db.doc("circuits/" + k).set({ type: t, etapes: steps, maj: new Date().toISOString(), par: V.me }); V.edit = null; toast("Circuit des documents de type « " + t + " » enregistré."); }
      catch (e) { toast("Enregistrement refusé : réservé à l'administrateur."); }
      return;
    }
    renderCircuit();
  }

  // ---------- Page « Archives » ----------
  function renderArchives() {
    var v = $("#v-archives"); if (!v) return;
    var list = docs.filter(function (d) { var e = etatOf(d.id); return e && (e.statut === "abroge" || V.owner); });
    v.innerHTML = '<div class="eyebrow">Référentiel</div><h1 class="title">Archives</h1><p class="lead">Documents abrogés' + (V.owner ? " ou supprimés du registre" : "") + ". Ils restent consultables avec leur historique et leurs visas ; ils ne s'appliquent plus.</p>" +
      (list.length ? '<div class="table-scroll panel-gap"><table class="reg"><thead><tr><th>Document</th><th>État</th><th>Motif</th><th></th></tr></thead><tbody>' + list.map(function (d) {
        var e = etatOf(d.id);
        return '<tr><td><div class="doc-title">' + esc(d.id) + '</div><div class="doc-sum">' + esc(d.titre) + "</div></td><td>" + '<span class="pill abroge">' + (e.statut === "abroge" ? "Abrogé" : "Supprimé") + '</span><div class="cite-src">' + esc(fmtD(e.date)) + (e.par ? " · " + esc(vName(e.par)) : "") + "</div></td><td>" + esc(e.motif || "") + '</td><td><div class="row-actions"><button type="button" class="btn" data-open="' + esc(d.id) + '">Consulter</button>' + (canRestore(e) ? '<button type="button" class="btn" data-vetat="' + esc(d.id) + '|restaurer">Rétablir</button>' : "") + "</div></td></tr>";
      }).join("") + "</tbody></table></div>" : '<p class="tt-empty panel-gap">Aucun document archivé.</p>');
  }

  async function vSetRole(id, key, on) {
    var r = V.roles[id] ? JSON.parse(JSON.stringify(V.roles[id])) : { fonctions: [], actif: true };
    if (key === "__add") { if (V.roles[id]) return; r = { fonctions: ["collab"], actif: true, depuis: new Date().toISOString().slice(0, 10) }; }
    else if (key === "__actif") r.actif = on;
    else { r.fonctions = (r.fonctions || []).filter(function (f) { return f !== key; }); if (on) r.fonctions.push(key); if (!r.depuis) r.depuis = new Date().toISOString().slice(0, 10); }
    r.maj = new Date().toISOString();
    try { await V.db.doc("roles/" + id).set(r); } catch (e) { toast("Modification refusée : seul l'administrateur peut attribuer les fonctions."); renderVisas(); }
  }
  // Lectures obligatoires : les changements sont préparés, puis enregistrés ensemble après double validation
  V.lectEdits = {};
  var lectOf = function (docId) { return V.lectEdits[docId] || V.lectures[docId] || {}; };
  function vSetLect(docId, key, on) {
    var L = JSON.parse(JSON.stringify(lectOf(docId))); L.ids = L.ids || [];
    if (key === "__tous") L.tous = on;
    else { L.ids = L.ids.filter(function (x) { return x !== key; }); if (on) L.ids.push(key); }
    V.lectEdits[docId] = L; renderVisas();
  }
  async function vSaveLect() {
    var ids = Object.keys(V.lectEdits); if (!ids.length) return;
    var desc = ids.map(function (id) {
      var a = V.lectures[id] || {}, b = V.lectEdits[id], av = a.ids || [], bv = b.ids || [];
      var plus = bv.filter(function (x) { return av.indexOf(x) < 0; }).map(vName), moins = av.filter(function (x) { return bv.indexOf(x) < 0; }).map(vName);
      return "<b>" + esc(id) + "</b> : " + [(!!a.tous !== !!b.tous ? (b.tous ? "lecture demandée à tous" : "plus à tous") : ""), plus.length ? "ajout de " + esc(plus.join(", ")) : "", moins.length ? "retrait de " + esc(moins.join(", ")) : ""].filter(Boolean).join(" ; ");
    });
    if (!(await confirmer({ titre: "Enregistrer les lectures obligatoires", points: desc.concat(["Les personnes ajoutées devront attester leur lecture une fois le document en vigueur."]), phrase: "enregistrer les lectures", bouton: "Enregistrer" }))) return;
    try {
      for (var i = 0; i < ids.length; i++) { var L = V.lectEdits[ids[i]]; L.maj = new Date().toISOString(); await V.db.doc("lectures/" + ids[i]).set(L); }
      V.lectEdits = {}; toast("Lectures obligatoires enregistrées."); renderVisas();
    } catch (e) { toast("Modification refusée : seul l'administrateur peut désigner les lecteurs."); }
  }
  async function vCsv() {
    var lines = [["Document", "Version", "Empreinte visée", "Empreinte en ligne", "Étape", "Fonction", "Personne", "Adresse", "Date et heure (UTC)", "Séance", "PV", "Fonction détenue", "Commentaire"].join(";")];
    Object.keys(V.sigs).forEach(function (id) {
      (V.sigs[id] || []).forEach(function (s) {
        var d = docs.filter(function (x) { return x.id === s.doc; })[0];
        lines.push([s.doc, s.version, s.empreinte, d ? d.empreinte : "", s.etape + (s.etapeVisee ? " (" + s.etapeVisee + ")" : ""), FLABEL[s.role] || s.role, V.names[id] || "", V.emails[id] || "", s.at, s.seance || "", s.pv || "", s.role === "lecture" || hasRole(id, s.role) ? "oui" : "non", (s.commentaire || "").replace(/[;\n]/g, " ")].map(function (x) { return String(x == null ? "" : x); }).join(";"));
      });
    });
    var dl = await downloadsP;
    var data = "﻿" + lines.join("\r\n");
    if (!dl) { toast("Le téléchargement n'est pas disponible dans cette vue."); return; }
    try { await dl.save({ filename: "registre-des-visas_" + new Date().toISOString().slice(0, 10) + ".csv", data: data }); } catch (e) { if (!(e && e.code === "declined")) toast("Le téléchargement a échoué."); }
  }

  var vSearchTimer = null;
  document.addEventListener("input", function (ev) {
    var t = ev.target;
    if (t.matches && t.matches("[data-cedit]") && V.edit && V.edit.steps) { var p = t.getAttribute("data-cedit").split("|"); var s = V.edit.steps[+p[0]]; if (s && t.type !== "checkbox") s[p[1]] = t.value; return; }
    if (t.id !== "v-q" || !V.user) return;
    var q = t.value;
    clearTimeout(vSearchTimer);
    vSearchTimer = setTimeout(async function () {
      try { V.search = await V.user.search(q); } catch (e) { V.search = []; }
      var box = $("#v-hits"); if (!box) return;
      box.innerHTML = V.search.filter(function (h) { return vPeople().indexOf(h.id) < 0; }).slice(0, 8).map(function (h) { return '<button type="button" class="btn" data-vrole="' + esc(h.id) + '|__add">Ajouter ' + esc(h.name || h.email || "cette personne") + "</button>"; }).join("");
    }, 250);
  });
  document.addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.matches("[data-cedit]") && V.edit && V.edit.steps) { var c = t.getAttribute("data-cedit").split("|"); var s = V.edit.steps[+c[0]]; if (s) { s[c[1]] = t.type === "checkbox" ? t.checked : t.value; renderCircuit(); } return; }
    if (t.matches("[data-vrole]")) { var p = t.getAttribute("data-vrole").split("|"); vSetRole(p[0], p[1], t.checked); }
    if (t.matches("[data-vlect]")) { var q = t.getAttribute("data-vlect").split("|"); vSetLect(q[0], q[1], t.checked); }
  });
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-vact],[data-vcsv],[data-vgo],button[data-vrole],[data-vcirc],[data-vetat],[data-vlectsave]"); if (!b) return;
    ev.preventDefault();
    if (b.hasAttribute("data-vlectsave")) { if (b.getAttribute("data-vlectsave") === "annuler") { V.lectEdits = {}; renderVisas(); } else vSaveLect(); return; }
    if (b.hasAttribute("data-vgo")) { V.done = null; V.pending = null; go(b.getAttribute("data-vgo")); return; }
    if (b.hasAttribute("data-vcsv")) { vCsv(); return; }
    if (b.hasAttribute("data-vcirc")) { var c = b.getAttribute("data-vcirc").split("|"); circAction(c[0], c[1], c[2]); return; }
    if (b.hasAttribute("data-vetat")) {
      var e = b.getAttribute("data-vetat").split("|");
      if (e[0] === "cancel") V.edit = null;
      else if (e[1] === "restaurer") setEtat(e[0], null);
      else if (e[2] === "ok") {
        var motif = (($("#v-motif") || {}).value || "").trim();
        if (!motif) { toast("Indiquez le motif."); return; }
        V.edit = null; setEtat(e[0], e[1], motif);
      } else V.edit = { etat: e[0], mode: e[1] };
      var cur = currentVariant(decodeURIComponent(location.hash.slice(1)));
      if (cur) { renderDocVisas(cur); var m = $("#v-motif"); if (m) m.focus(); } else renderArchives();
      return;
    }
    if (b.hasAttribute("data-vrole")) { var r = b.getAttribute("data-vrole").split("|"); vSetRole(r[0], r[1], true); var q = $("#v-q"); if (q) q.value = ""; V.search = []; return; }
    var a = b.getAttribute("data-vact");
    if (a === "cancel") { var dc = V.pending && variantByKey(V.pending.doc); V.pending = null; if (dc) renderDocVisas(dc); return; }
    var p = a.split("|");
    if (p[2] === "ok") { if (p[1] === "renvoi") vSign(p[0], "renvoi", p[3]); else vSign(p[0], p[1]); return; }
    V.pending = { doc: p[0], etape: p[1], mode: p[2] === "renvoi" ? "renvoi" : "visa" };
    var d = variantByKey(p[0]); if (d) { renderDocVisas(d); var f = $("#v-seance") || $("#v-com"); if (f) f.focus(); }
  });

  // ---------- Membre connecté (bas du rail) ----------
  function vRenderMe() {
    var box = $("#rail-me"); if (!box) return;
    var badge = $(RESTREINT ? "#nav-badge-emp" : "#nav-badge");
    var lm = $("#nav-membres"); if (lm) lm.hidden = !(HOSTED && V.owner);
    var bn = $("#btn-nouveau"); if (bn) bn.hidden = !(HOSTED && typeof canEdit === "function" && canEdit());
    if (!V.ready && !V.me) { box.innerHTML = '<div class="me-load">Chargement…</div>'; return; }
    if (!V.me) {
      box.innerHTML = '<div class="me-card"><div class="me-av">?</div><div class="me-id"><b>Lecture seule</b><span>' + (HOSTED ? "Session expirée" : "Connectez-vous à claude.ai pour viser") + "</span></div></div>";
      if (badge) badge.hidden = true; return;
    }
    var nom = V.names[V.me] || "", mail = V.emails[V.me] || "";
    var ini = (nom || mail || "?").split(/[\s.@]+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0].toUpperCase(); }).join("");
    var f = myRoles(), r = V.roles[V.me] || {};
    var todo = vTodoList(), nv = todo.filter(function (x) { return x.a.etape !== "lecture"; }).length, n = todo.length;
    if (badge) { badge.hidden = !n; badge.textContent = n; badge.title = n + " action" + (n > 1 ? "s" : "") + " en attente"; }
    box.innerHTML =
      '<div class="me-card" title="' + esc(nom + (mail ? " · " + mail : "")) + '"><div class="me-av">' + esc(ini || "?") + (n ? '<i class="me-dot"></i>' : "") + '</div><div class="me-id"><b>' + esc(nom || mail || "Vous") + "</b>" + (mail && nom ? "<span>" + esc(mail) + "</span>" : "") + "</div></div>" +
      '<div class="me-more">' +
      '<div class="me-roles">' + (f.length ? f.map(function (x) { return '<span class="me-chip">' + esc(FLABEL[x] || x) + "</span>"; }).join("") : '<span class="me-none">Aucune fonction attribuée</span>') + (V.owner ? '<span class="me-chip gold">Administrateur</span>' : "") + "</div>" +
      (RESTREINT ? '<button type="button" class="me-todo" data-open="mesdocs"><span><b>' + n + "</b> à lire</span><span><b>" + docs.length + "</b> document" + (docs.length > 1 ? "s" : "") + "</span></button>" : '<button type="button" class="me-todo" data-open="atraiter"><span><b>' + nv + "</b> à viser</span><span><b>" + (n - nv) + "</b> à lire</span></button>") +
      (r.depuis ? '<div class="me-since">Fonctions attribuées depuis le ' + esc(fmtDate(r.depuis)) + "</div>" : "") +
      (HOSTED ? '<div class="me-links">' + (V.owner ? '<a href="/membres">Membres</a>' : "") + '<a href="/deconnexion">Se déconnecter</a></div>' : "") +
      "</div>";
  }

  // ---------- Aperçu (panneau) : état du circuit ----------
  function drawerVisasHtml(d) {
    if (!V.db) return "";
    var st = docState(d), acts = myActions(d);
    var steps = st.steps.map(function (x) {
      return '<li class="' + (x.done ? "ok" : x.old ? "re" : "") + '"><span>' + esc(x.st.label) + "</span>" + (x.done ? "<small>" + esc(vName(x.cur.by).replace(" (vous)", "")) + " · " + esc(fmtD(x.cur.at)) + "</small>" : x.old ? "<small>À viser de nouveau</small>" : "<small>" + (st.current === x ? "En cours" : x.st.obligatoire ? "En attente" : "Facultative") + (x.need > 1 ? " · " + x.by.length + "/" + x.need : "") + "</small>") + "</li>";
    }).join("");
    var lect = d.estProjet ? "" : '<li class="' + (st.readers.length && st.read.length === st.readers.length ? "ok" : "") + '"><span>Prise de connaissance</span><small>' + (st.readers.length ? st.read.length + " / " + st.readers.length : "Aucun lecteur désigné") + "</small></li>";
    return (etatOf(d.id) ? '<div class="dr-todo"><b>' + (etatOf(d.id).statut === "abroge" ? "Document abrogé" : "Document supprimé du registre") + "</b> — " + esc(etatOf(d.id).motif || "") + "</div>" : "") +
      (st.renvois.length ? '<div class="dr-todo"><b>Renvoyé pour modification :</b> « ' + esc(st.renvois[0].commentaire || "") + " »</div>" : "") +
      '<p class="side-title">Circuit</p><ol class="dr-steps">' + steps + lect + "</ol>" +
      (acts.length ? '<p class="dr-todo"><b>À vous :</b> ' + acts.map(function (a) { return esc(a.label); }).join(", ") + ' — <button type="button" class="doclink" data-vgo="' + esc(docHash(d)) + '">examiner le document</button></p>' : "");
  }

  function currentVariant(h) {
    var pj = /~projet$/.test(h), id = h.replace(/~projet$/, "");
    var d = docs.filter(function (x) { return x.id === id; })[0];
    return d ? (pj ? d.projet || d : d) : null;
  }
  // Rafraîchit la vue ouverte sans toucher un champ en cours de saisie
  function vRefresh() {
    vRenderMe();
    vAdoptionsManquantes();
    // À la première ouverture de la session, une personne qui a des actions en attente arrive sur « À traiter »
    if (!V.landed && V.ready && V.me && Object.keys(V.roles).length) {
      V.landed = true;
      var first = true; try { first = !sessionStorage.getItem("pc-ref-atraiter"); sessionStorage.setItem("pc-ref-atraiter", "1"); } catch (e) { /* stockage indisponible */ }
      if (first && !location.hash.slice(1) && vTodoList().length && !RESTREINT) { go("atraiter"); return; }
    }
    var h = decodeURIComponent(location.hash.slice(1));
    var act = document.activeElement;
    if (act && (act.id === "v-q" || act.id === "v-seance" || act.id === "v-pv" || act.id === "v-com" || act.id === "v-motif" || act.id === "v-confirm" || (act.matches && act.matches("[data-cedit]")))) return;
    if (h === "visas") renderVisas();
    if (h === "atraiter") renderATraiter();
    if (h === "circuit") renderCircuit();
    if (h === "archives") renderArchives();
    if (RESTREINT && (h === "" || h === "mesdocs")) renderMesDocs();
    if (h.indexOf("edition/") === 0 && E && !(act && act.closest && act.closest("#v-edition"))) renderEditor();
    var d = currentVariant(h);
    if (d && !V.pending && !(V.edit && V.edit.etat)) renderDocVisas(d);
  }
