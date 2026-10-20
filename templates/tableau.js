  // ---------- Tableau de bord ----------
  // Vue d'ensemble pour l'administrateur et les personnes à qui il l'ouvre (page Membres) :
  // documents par étape, visas attendus et retards (délais fixés par type dans la page Circuit), alertes,
  // charge par personne, modifications en cours, lectures, journal des opérations, revues périodiques.
  var T = { periode: 30, type: "", domaine: "", personne: "", projets: true, flux: "tout", journal: null, ampleur: {}, relance: null };
  var JOUR = 86400000;
  var jours = function (iso) { return iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / JOUR)) : 0; };
  var jTxt = function (n) { return n === 0 ? "aujourd'hui" : n + " j"; };
  var accesTableau = function () { var r = V.me && V.roles[V.me]; return !!(V.db && V.me && (V.owner || (r && r.actif !== false && r.tableau && r.acces !== "employe"))); };
  var fonctionsDe = function (id) { var r = V.roles[id]; return r ? (r.fonctions || []).filter(function (f) { return f !== "collab" || (r.fonctions || []).length === 1; }).map(function (f) { return FLABEL[f] || f; }).join(", ") : ""; };
  var nomCourt = function (id) { return vName(id).replace(" (vous)", ""); };

  function docsSuivis() {
    return VARIANTS().filter(function (d) {
      if (etatOf(d.id)) return false;
      if (T.type && d.type !== T.type) return false;
      if (T.domaine && d.domaine !== T.domaine) return false;
      if (!T.projets && d.statut !== "En vigueur" && !d.estProjet) return false;
      return true;
    });
  }
  // Début de l'étape en cours : dernier visa de l'étape précédente, sinon date du texte (historique)
  function debutEtape(d, st, x) {
    var i = st.steps.indexOf(x), t = null;
    for (var k = 0; k < i; k++) { var s = st.steps[k]; if (s.done) s.sigs.forEach(function (g) { if (!t || g.at > t) t = g.at; }); }
    return t || (d.historique && d.historique[0] && d.historique[0].date) || null;
  }
  function dateApprobation(d, st) {
    var t = null; st.steps.forEach(function (s) { if (s.st.obligatoire) s.sigs.forEach(function (g) { if (!t || g.at > t) t = g.at; }); });
    return t || d.date_approbation || null;
  }
  function attentes(list) {
    var out = [];
    list.forEach(function (d) {
      var st = docState(d), x = st.current; if (!x) return;
      var qui = x.holders.filter(function (h) { return x.by.indexOf(h) < 0 && !authorOf(d, h) && !signedOther(d, x.st.etape, h); });
      var dep = debutEtape(d, st, x), age = jours(dep);
      out.push({ d: d, x: x, qui: qui, depuis: dep, age: age, delai: x.st.delai || 7, retard: age > (x.st.delai || 7) });
    });
    return out.sort(function (a, b) { return b.age - a.age; });
  }
  function lectures(list) {
    return list.filter(function (d) { return !d.estProjet; }).map(function (d) {
      var st = docState(d); if (!st.approved || !st.readers.length) return null;
      var dep = dateApprobation(d, st), lim = delaiLecture(d.type), age = jours(dep);
      var manquants = st.readers.filter(function (r) { return st.read.indexOf(r) < 0; });
      return { d: d, lus: st.read.length, attendus: st.readers.length, manquants: manquants, retard: age > lim ? manquants : [], age: age, delai: lim };
    }).filter(Boolean);
  }
  function echeance(d) {
    var v = String(d.prochaine_revue || "");
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    var m = v.match(/(\d+)\s*mois/), base = d.date_effet || d.date_approbation;
    if (m && base && d.statut === "En vigueur") { var x = new Date(base + "T00:00:00"); x.setMonth(x.getMonth() + +m[1]); return x.toISOString().slice(0, 10); }
    return null;
  }

  async function chargerJournal() {
    if (!V.db || T.journal) return;
    T.journal = [];
    try { var s = await V.db.collection("journal").get(); T.journal = s.docs.map(function (x) { return x.data(); }); }
    catch (e) { T.journal = null; }
    if (location.hash === "#tableau") renderTableau();
  }
  var idParEmail = function (mail) { mail = String(mail || "").toLowerCase(); var id = Object.keys(V.emails).filter(function (k) { return String(V.emails[k]).toLowerCase() === mail; })[0]; return id || null; };
  function evenements() {
    var out = [], lim = T.periode ? Date.now() - T.periode * JOUR : 0;
    var push = function (at, cat, qui, texte) { if (!at || new Date(at).getTime() < lim) return; out.push({ at: at, cat: cat, qui: qui, texte: texte }); };
    if (T.journal) T.journal.forEach(function (j) {
      var p = String(j.path || ""), dt = j.data || {}, par = j.par_email ? (idParEmail(j.par_email) ? nomCourt(idParEmail(j.par_email)) : j.par_email) : "Publication automatique";
      var seg = p.split("/");
      if (seg[0] === "sig" && j.action === "INSERT") {
        var who = nomCourt(seg[1]) + (fonctionsDe(seg[1]) ? " (" + fonctionsDe(seg[1]) + ")" : "");
        if (dt.etape === "lecture") push(j.le, "lectures", who, "a attesté sa lecture de <b>" + esc(dt.doc) + "</b> v" + esc(dt.version));
        else if (dt.etape === "renvoi") push(j.le, "renvois", who, "a <b>renvoyé</b> " + esc(dt.doc) + " : « " + esc(dt.commentaire || "") + " »");
        else push(j.le, "visas", who, "a donné son visa (" + esc(FLABEL[dt.role] || dt.role) + ") à <b>" + esc(dt.doc) + "</b> v" + esc(dt.version));
      } else if (seg[0] === "redaction") {
        if (dt.statut === "soumis" && j.action !== "DELETE") push(j.le, "modifications", par, "a <b>soumis</b> " + (dt.nouveau ? "la création de " : "une modification de ") + esc(seg[1]) + (dt.objet ? " : « " + esc(dt.objet) + " »" : ""));
        else if (dt.statut === "applique") push(j.le, "modifications", "Publication automatique", esc(seg[1]) + (dt.nouveau ? " <b>créé</b>" : " <b>modifié</b>") + " (v" + esc(dt.version || "") + ")");
        else if (dt.statut === "conflit") push(j.le, "modifications", "Publication automatique", "publication de " + esc(seg[1]) + " <b>refusée</b> : " + esc(dt.message || ""));
        else if (j.action === "INSERT") push(j.le, "modifications", par, "a ouvert un brouillon de " + esc(seg[1]));
        else if (j.action === "DELETE") push(j.le, "modifications", par, "a abandonné le brouillon de " + esc(seg[1]));
      } else if (seg[0] === "adoptions" && dt.statut === "adopte") push(j.le, "adoptions", "Publication automatique", "<b>" + esc(seg[1].split("~")[0]) + "</b> adopté : v" + esc(dt.version) + " en vigueur");
      else if (seg[0] === "etats") push(j.le, "abrogations", par, j.action === "DELETE" ? "a <b>rétabli</b> " + esc(seg[1]) : "a <b>" + (dt.statut === "supprime" ? "supprimé" : "abrogé") + "</b> " + esc(seg[1]) + (dt.motif ? " : « " + esc(dt.motif) + " »" : ""));
      else if (seg[0] === "circuits") push(j.le, "acces", par, (j.action === "DELETE" ? "a rétabli" : "a <b>modifié</b>") + " le circuit des documents de type « " + esc(dt.type || seg[1]) + " »");
      else if (seg[0] === "lectures") push(j.le, "acces", par, "a modifié les lectures obligatoires de " + esc(seg[1]));
      else if (/^MEMBRE_/.test(j.action)) push(j.le, "acces", par, (j.action === "MEMBRE_INSERT" ? "a <b>ouvert un accès</b> pour " : j.action === "MEMBRE_DELETE" ? "a retiré l'invitation de " : "a modifié l'accès de ") + esc((dt.nom || "") + (dt.nom ? " · " : "") + (dt.email || p)));
    });
    else Object.keys(V.sigs).forEach(function (id) { (V.sigs[id] || []).forEach(function (g) { push(g.at, g.etape === "lecture" ? "lectures" : g.etape === "renvoi" ? "renvois" : "visas", nomCourt(id), (g.etape === "lecture" ? "a attesté sa lecture de " : g.etape === "renvoi" ? "a renvoyé " : "a visé ") + "<b>" + esc(g.doc) + "</b>"); }); });
    return out.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  }

  var COULEURS = { renvoi: "#9B2C1F", lecture: "#3E8E7E", ok: "#1E6B45", attente: "#8FA2B8" };
  var PALETTE = ["#1E4A78", "#0B2E52", "#5A3E8A", "#2F6E9E", "#4B5D73"];
  function renderTableau() {
    var v = $("#v-tableau"); if (!v) return;
    if (!accesTableau()) { v.innerHTML = '<div class="eyebrow">Administration</div><h1 class="title">Tableau de bord</h1><p class="lead">' + (V.ready ? "Le tableau de bord est réservé à l'administrateur et aux personnes à qui il l'a ouvert." : "Chargement…") + "</p>"; return; }
    chargerJournal();
    var list = docsSuivis(), att = attentes(list), lec = lectures(list);
    if (T.personne) att = att.filter(function (a) { return a.qui.indexOf(T.personne) >= 0; });
    var principaux = docs.filter(function (d) { return !etatOf(d.id) && (!T.type || d.type === T.type) && (!T.domaine || d.domaine === T.domaine); });
    var nV = principaux.filter(function (d) { return d.statut === "En vigueur"; }).length, nP = principaux.filter(function (d) { return d.statut !== "En vigueur"; }).length, nR = principaux.filter(function (d) { return d.projet; }).length;
    var renv = list.filter(function (d) { return docState(d).renvois.length; });
    var lus = lec.reduce(function (n, l) { return n + l.lus; }, 0), att2 = lec.reduce(function (n, l) { return n + l.attendus; }, 0), enRetardL = lec.reduce(function (n, l) { return n + l.retard.length; }, 0);
    var drafts = Object.keys(V.redac || {}).map(function (id) { return { id: id, r: V.redac[id] }; }).filter(function (x) { return x.r && ["brouillon", "soumis", "conflit"].indexOf(x.r.statut) >= 0; });
    var rev = principaux.map(function (d) { return { d: d, e: echeance(d) }; }).filter(function (x) { return x.e; }).sort(function (a, b) { return a.e < b.e ? -1 : 1; });
    var auj = new Date().toISOString().slice(0, 10), dans60 = new Date(Date.now() + 60 * JOUR).toISOString().slice(0, 10);
    var echues = rev.filter(function (x) { return x.e < auj; }).length, bientot = rev.filter(function (x) { return x.e >= auj && x.e <= dans60; }).length;
    var retards = att.filter(function (a) { return a.retard; }).length;

    var kpi = function (val, lab, sub, cls, go) { return '<button type="button" class="kpi ' + (cls || "") + '"' + (go ? ' data-tgo="' + go + '"' : "") + "><b>" + val + '</b><span class="l">' + lab + '</span><span class="s">' + sub + "</span></button>"; };
    var kpis = '<div class="kpis">' +
      kpi(principaux.length, "Documents", nV + " en vigueur · " + nP + " en projet" + (nR ? " · " + nR + " en révision" : ""), "", "registre") +
      kpi(att.length, "Visas en attente", retards ? retards + " au-delà du délai" : "aucun retard", retards ? "alert" : "", "t-att") +
      kpi(renv.length, "Renvois ouverts", renv.length ? renv.map(function (d) { return d.id.replace(/^PC-/, ""); }).slice(0, 3).join(", ") : "aucun", renv.length ? "bad" : "", "t-att") +
      kpi(att2 ? Math.round(100 * lus / att2) + " %" : "—", "Lectures attestées", att2 ? lus + " / " + att2 + (enRetardL ? " · " + enRetardL + " en retard" : "") : "aucune lecture demandée", enRetardL ? "alert" : "", "t-lec") +
      kpi(drafts.length, "Modifications", drafts.filter(function (x) { return x.r.statut === "brouillon"; }).length + " brouillon(s) · " + drafts.filter(function (x) { return x.r.statut === "soumis"; }).length + " soumis" + (drafts.some(function (x) { return x.r.statut === "conflit"; }) ? " · refus" : ""), drafts.some(function (x) { return x.r.statut === "conflit"; }) ? "bad" : "", "t-mod") +
      kpi(echues, "Revue" + (echues > 1 ? "s" : "") + " échue" + (echues > 1 ? "s" : ""), bientot + " autre(s) sous 60 jours", echues ? "bad" : "", "t-rev") + "</div>";

    // Étapes
    var groupes = {}, ordre = [];
    list.forEach(function (d) { var s = stageOf(d); var k = s.k.indexOf("etape:") === 0 ? s.label : s.k; if (!groupes[k]) { groupes[k] = { k: k, label: s.label, n: 0, o: s.k === "renvoi" ? 90 : s.k === "lecture" ? 91 : s.k === "ok" ? 92 : s.k === "attente" ? -1 : (s.step ? circOf(d).map(function (x) { return x.label; }).indexOf(s.label) : 50) }; ordre.push(groupes[k]); } groupes[k].n++; });
    ordre.sort(function (a, b) { return a.o - b.o; });
    var pi = 0, col = function (g) { return g.k === "renvoi" ? COULEURS.renvoi : g.k === "lecture" ? COULEURS.lecture : g.k === "ok" ? COULEURS.ok : g.k === "attente" ? COULEURS.attente : PALETTE[pi++ % PALETTE.length]; };
    ordre.forEach(function (g) { g.c = col(g); });
    var pipe = '<div class="pipe">' + ordre.map(function (g) { return '<div style="flex:' + g.n + ";background:" + g.c + '" title="' + esc(g.label) + " : " + g.n + '">' + g.n + "</div>"; }).join("") + '</div><div class="legend">' + ordre.map(function (g) { return '<span><i style="background:' + g.c + '"></i>' + esc(g.label) + " <b>" + g.n + "</b></span>"; }).join("") + "</div>";
    // Délais par étape : moyenne des étapes terminées dans la période, plus longue attente en cours
    var lim = T.periode ? Date.now() - T.periode * JOUR : 0, dl = {};
    list.forEach(function (d) {
      var st = docState(d);
      st.steps.forEach(function (x, i) {
        var k = x.st.label, e = dl[k] || (dl[k] = { label: k, durees: [], max: 0, delais: [] });
        if (e.delais.indexOf(x.st.delai) < 0) e.delais.push(x.st.delai);
        if (x.done && x.sigs.length) { var fin = x.sigs[0].at; if (new Date(fin).getTime() >= lim) { var deb = debutEtape(d, st, x); if (deb) e.durees.push((new Date(fin) - new Date(deb)) / JOUR); } }
        if (st.current === x) e.max = Math.max(e.max, jours(debutEtape(d, st, x)));
      });
    });
    var dlRows = Object.keys(dl).map(function (k) { return dl[k]; });
    var dMoy = function (e) { return e.durees.length ? (e.durees.reduce(function (a, b) { return a + b; }, 0) / e.durees.length).toFixed(1).replace(".", ",") + " j" : "—"; };
    var delais = '<table class="mini"><thead><tr><th>Étape</th><th class="n">Délai moyen</th><th class="n">Plus longue attente</th><th class="n">Objectif</th></tr></thead><tbody>' +
      dlRows.map(function (e) { var obj = Math.min.apply(null, e.delais); return "<tr><td>" + esc(e.label) + '</td><td class="n">' + dMoy(e) + '</td><td class="n"><span class="age ' + (e.max > obj ? "late" : e.max > obj * 0.7 ? "warn" : "") + '">' + (e.max ? e.max + " j" : "—") + '</span></td><td class="n">' + (e.delais.length > 1 ? Math.min.apply(null, e.delais) + "–" + Math.max.apply(null, e.delais) : obj) + " j</td></tr>"; }).join("") +
      '<tr><td>Prise de connaissance</td><td class="n">—</td><td class="n"><span class="age ' + (lec.some(function (l) { return l.retard.length; }) ? "late" : "") + '">' + (lec.length ? Math.max.apply(null, lec.map(function (l) { return l.manquants.length ? l.age : 0; })) + " j" : "—") + '</span></td><td class="n">' + TYPES.map(delaiLecture).filter(function (x, i, a) { return a.indexOf(x) === i; }).join("–") + " j</td></tr></tbody></table>";

    // Alertes
    var al = [];
    var vus = {};
    TYPES.forEach(function (t) { var d = docs.filter(function (x) { return x.type === t; })[0]; circuitIssues(circOf(d)).forEach(function (m) { if (!vus[m]) { vus[m] = 1; al.push({ bad: /aucune personne/.test(m), t: "<b>" + esc(t) + " :</b> " + esc(m) }); } }); });
    var sansLecteur = principaux.filter(function (d) { return d.statut === "En vigueur" && !readersOf(d).length; });
    if (sansLecteur.length) al.push({ t: "<b>Sans lecteur désigné :</b> " + sansLecteur.length + " document(s) en vigueur n'ont aucune lecture obligatoire (" + esc(sansLecteur.slice(0, 4).map(function (d) { return d.id; }).join(", ")) + (sansLecteur.length > 4 ? "…" : "") + ")." });
    var dormants = Object.keys(V.roles).filter(function (id) { var r = V.roles[id]; return r.actif !== false && r.connecte === false && r.cree_le && jours(r.cree_le) > 30; });
    if (dormants.length) al.push({ t: "<b>Accès jamais utilisés :</b> " + dormants.length + " invitation(s) de plus de 30 jours (" + esc(dormants.map(nomCourt).slice(0, 3).join(", ")) + ")." });
    if (retards) al.push({ bad: true, t: "<b>Visas en retard :</b> " + retards + " étape(s) au-delà du délai fixé." });
    if (enRetardL) al.push({ t: "<b>Lectures en retard :</b> " + enRetardL + " attestation(s) au-delà du délai de prise de connaissance." });
    var alertes = al.length ? '<ul class="alerts">' + al.map(function (a) { return '<li class="' + (a.bad ? "bad" : "") + '">' + a.t + "</li>"; }).join("") + "</ul>" : '<p class="tt-empty">Rien ne bloque le circuit.</p>';

    // En attente
    T.lignes = att;
    var attHtml = att.length ? '<table class="mini"><thead><tr><th>Document</th><th>Étape</th><th>Attendu de</th><th class="n">Depuis</th><th></th></tr></thead><tbody>' + att.slice(0, T.tout ? 999 : 10).map(function (a, i) {
      return '<tr><td><span class="ref">' + esc(a.d.id) + (a.d.estProjet ? " · révision" : "") + "</span><small>" + esc(a.d.titre) + "</small></td><td>" + esc(a.x.st.label) + (a.x.need > 1 ? "<small>" + a.x.by.length + " / " + a.x.need + " visas</small>" : "") + "</td><td>" + (a.qui.length ? esc(a.qui.map(nomCourt).join(", ")) : '<span class="age late">personne ne peut viser</span>') + "<small>" + esc(FLABEL[a.x.st.role] || a.x.st.role) + '</small></td><td class="n"><span class="age ' + (a.retard ? "late" : a.age > a.delai * 0.7 ? "warn" : "") + '">' + jTxt(a.age) + "</span><small>objectif " + a.delai + ' j</small></td><td class="acts2"><button type="button" class="lnk" data-open="' + esc(docHash(a.d)) + '">Ouvrir</button>' + (a.qui.length ? ' · <button type="button" class="lnk" data-trel="a|' + i + '">Relancer</button>' : "") + "</td></tr>";
    }).join("") + "</tbody></table>" + (att.length > 10 && !T.tout ? '<p><button type="button" class="lnk" data-tgo="tout">Afficher les ' + att.length + " attentes</button></p>" : "") : '<p class="tt-empty">Aucun visa en attente.</p>';

    // Par personne
    var gens = Object.keys(V.roles).filter(function (id) { var r = V.roles[id]; return r.actif !== false; });
    var parP = gens.map(function (id) {
      var av = att.filter(function (a) { return a.qui.indexOf(id) >= 0; }), al2 = lec.filter(function (l) { return l.manquants.indexOf(id) >= 0; });
      var plus = Math.max.apply(null, [0].concat(av.map(function (a) { return a.age; })).concat(al2.map(function (l) { return l.age; })));
      var late = av.some(function (a) { return a.retard; }) || al2.some(function (l) { return l.retard.indexOf(id) >= 0; });
      return { id: id, v: av.length, l: al2.length, plus: plus, late: late };
    }).filter(function (p) { return p.v || p.l || fonctionsDe(p.id) !== "Collaborateur"; }).sort(function (a, b) { return (b.v + b.l) - (a.v + a.l) || b.plus - a.plus; });
    var persHtml = '<table class="mini"><thead><tr><th>Personne</th><th class="n">À viser</th><th class="n">À lire</th><th class="n">Plus ancienne</th></tr></thead><tbody>' + parP.map(function (p) {
      return '<tr><td><button type="button" class="lnk strong" data-tpers="' + esc(p.id) + '">' + esc(nomCourt(p.id)) + "</button><small>" + esc(fonctionsDe(p.id)) + '</small></td><td class="n">' + (p.v || "—") + '</td><td class="n">' + (p.l || "—") + '</td><td class="n"><span class="age ' + (p.late ? "late" : "") + '">' + (p.v || p.l ? jTxt(p.plus) : "—") + "</span></td></tr>";
    }).join("") + "</tbody></table>";

    // Modifications en cours
    var modsHtml = drafts.length ? '<table class="mini"><thead><tr><th>Document</th><th>Rédigé par</th><th class="n">Depuis</th><th>État</th><th>Ampleur</th></tr></thead><tbody>' + drafts.map(function (x) {
      var r = x.r, d = workOf(x.id), amp = T.ampleur[x.id];
      if (amp === undefined) { T.ampleur[x.id] = null; ampleur(x.id, r); }
      var etat = r.statut === "soumis" ? '<span class="tag2 s">Soumis · publication en cours</span>' : r.statut === "conflit" ? '<span class="tag2 c">Publication refusée</span>' : '<span class="tag2 b">Brouillon</span>';
      return '<tr><td><button type="button" class="lnk strong" data-edit-doc="' + esc(x.id) + '">' + esc(x.id) + "</button><small>" + esc(r.objet || (d ? d.titre : r.titre) || "") + (r.statut === "conflit" && r.message ? " · " + esc(r.message) : "") + "</small></td><td>" + esc((r.auteurs || [r.par]).map(nomCourt).join(", ")) + '</td><td class="n">' + jTxt(jours(r.cree_le || r.maj)) + "</td><td>" + etat + '</td><td class="diffn">' + (amp || "…") + "</td></tr>";
    }).join("") + "</tbody></table>" : '<p class="tt-empty">Aucune modification en cours.</p>';

    // Lectures
    T.lecLignes = lec;
    var barre = function (a, b) { var p = b ? Math.round(100 * a / b) : 0; return '<div class="bar"><i class="' + (p >= 80 ? "" : p >= 50 ? "mid" : "low") + '" style="width:' + p + '%"></i></div>'; };
    var lecHtml = lec.length ? lec.map(function (l, i) {
      return '<div class="prog-row"><div class="t"><span><b>' + esc(l.d.id) + "</b> " + esc(l.d.titre) + ' <small>v' + esc(l.d.version) + "</small></span><span>" + l.lus + " / " + l.attendus + "</span></div>" + barre(l.lus, l.attendus) +
        (l.manquants.length ? '<div class="who">' + (l.retard.length ? '<span class="age late">En retard (' + l.age + " j, délai " + l.delai + " j)</span> : " : "Pas encore lu : ") + esc(l.manquants.map(nomCourt).slice(0, 6).join(", ")) + (l.manquants.length > 6 ? "…" : "") + ' · <button type="button" class="lnk" data-trel="l|' + i + '">Relancer</button></div>' : "") + "</div>";
    }).join("") : '<p class="tt-empty">Aucune lecture demandée sur un document en vigueur.</p>';

    // Activité
    var ev = evenements().filter(function (e) { return T.flux === "tout" || e.cat === T.flux; });
    var CAT = [["tout", "Tout"], ["visas", "Visas"], ["renvois", "Renvois"], ["modifications", "Modifications"], ["adoptions", "Adoptions"], ["lectures", "Lectures"], ["abrogations", "Abrogations"], ["acces", "Accès et circuits"]];
    var IC = { visas: ["v", "✓"], renvois: ["r", "↩"], modifications: ["m", "✎"], adoptions: ["a", "★"], lectures: ["l", "◉"], abrogations: ["x", "⌫"], acces: ["x", "⚙"] };
    var fluxHtml = '<div class="chips">' + CAT.map(function (c) { return '<button type="button" class="chip' + (T.flux === c[0] ? " on" : "") + '" data-tflux="' + c[0] + '">' + c[1] + "</button>"; }).join("") + "</div>" +
      (T.journal === null && !V.owner ? "" : "") +
      (ev.length ? '<ul class="feed">' + ev.slice(0, 60).map(function (e) { var ic = IC[e.cat] || ["x", "•"]; return "<li><time>" + esc(fmtDT(e.at).replace(" à ", " · ")) + '</time><span class="ic ' + ic[0] + '">' + ic[1] + "</span><span><b>" + esc(e.qui) + "</b> " + e.texte + "</span></li>"; }).join("") + "</ul>" : '<p class="tt-empty">Aucune opération sur la période.</p>');

    // Revues
    var revHtml = rev.length ? '<table class="mini"><thead><tr><th>Document</th><th>Prochaine revue</th><th class="n"></th></tr></thead><tbody>' + rev.map(function (x) {
      var n = Math.round((new Date(x.e + "T00:00:00") - Date.now()) / JOUR);
      return '<tr><td><span class="ref">' + esc(x.d.id) + "</span><small>" + esc(x.d.titre) + (x.d.date_effet ? " · en vigueur depuis le " + esc(fmtDate(x.d.date_effet)) : "") + "</small></td><td>" + esc(fmtDate(x.e)) + '</td><td class="n"><span class="age ' + (n < 0 ? "late" : n <= 60 ? "warn" : "") + '">' + (n < 0 ? "échue depuis " + -n + " j" : "dans " + n + " j") + "</span></td></tr>";
    }).join("") + "</tbody></table>" : '<p class="tt-empty">Aucun document en vigueur : les revues apparaîtront après les adoptions.</p>';

    var opt = function (vals, cur, all) { return '<option value="">' + all + "</option>" + vals.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === cur ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join(""); };
    var doms = docs.map(function (d) { return d.domaine; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; }).sort();
    v.innerHTML =
      '<div class="db-head"><div><div class="eyebrow">Administration</div><h1 class="title">Tableau de bord</h1><p class="lead">Situation au ' + esc(fmtDT(new Date().toISOString())) + " · mise à jour en continu.</p></div>" +
      '<div class="row-actions"><button type="button" class="btn" data-tgo="csv">Exporter (CSV)</button><button type="button" class="btn" data-tgo="imprimer">Imprimer</button></div></div>' +
      '<div class="db-filters">' +
      '<select data-tf="periode" aria-label="Période"><option value="7"' + (T.periode === 7 ? " selected" : "") + '>7 derniers jours</option><option value="30"' + (T.periode === 30 ? " selected" : "") + '>30 derniers jours</option><option value="90"' + (T.periode === 90 ? " selected" : "") + '>90 derniers jours</option><option value="365"' + (T.periode === 365 ? " selected" : "") + '>12 derniers mois</option><option value="0"' + (T.periode === 0 ? " selected" : "") + ">Depuis l'origine</option></select>" +
      '<select data-tf="type" aria-label="Type">' + opt(TYPES.map(function (t) { return [t, t]; }), T.type, "Tous les types") + "</select>" +
      '<select data-tf="domaine" aria-label="Domaine">' + opt(doms.map(function (t) { return [t, t]; }), T.domaine, "Tous les domaines") + "</select>" +
      '<select data-tf="personne" aria-label="Personne">' + opt(gens.map(function (id) { return [id, nomCourt(id)]; }), T.personne, "Toutes les personnes") + "</select>" +
      '<label class="selchk"><input type="checkbox" data-tf="projets"' + (T.projets ? " checked" : "") + "> Inclure les projets</label></div>" +
      kpis +
      '<div class="g2"><section class="card"><div class="ch"><h2>Où en sont les documents</h2><button type="button" class="lnk" data-open="circuit">Circuits et délais</button></div><p class="sub">' + list.length + " version(s) suivie(s), par étape du circuit</p>" + pipe + delais + "</section>" +
      '<section class="card"><div class="ch"><h2>Alertes</h2></div><p class="sub">Ce qui empêche le circuit d\'avancer</p>' + alertes + "</section></div>" +
      '<div class="g2"><section class="card" id="t-att"><div class="ch"><h2>En attente d\'une action</h2></div><p class="sub">Par ancienneté ; en rouge au-delà du délai fixé pour l\'étape</p>' + attHtml + "</section>" +
      '<section class="card"><div class="ch"><h2>Par personne</h2>' + (V.owner && HOSTED ? '<a class="lnk" href="/membres">Membres</a>' : "") + '</div><p class="sub">Ce qui attend chacun ; cliquez un nom pour filtrer</p>' + persHtml + "</section></div>" +
      '<div class="g2b"><section class="card" id="t-mod"><div class="ch"><h2>Modifications en cours</h2></div><p class="sub">Brouillons, soumissions et publications refusées</p>' + modsHtml + "</section>" +
      '<section class="card" id="t-lec"><div class="ch"><h2>Lectures obligatoires</h2><button type="button" class="lnk" data-open="visas">Gérer les lectures</button></div><p class="sub">Attestations par document en vigueur</p>' + lecHtml + "</section></div>" +
      '<div class="g2"><section class="card"><div class="ch"><h2>Activité</h2></div><p class="sub">Qui a fait quoi, et quand' + (T.journal ? "" : " (visas et lectures)") + "</p>" + fluxHtml + "</section>" +
      '<section class="card" id="t-rev"><div class="ch"><h2>Revues périodiques</h2></div><p class="sub">Échéances de revue des documents en vigueur</p>' + revHtml + "</section></div>";
  }
  async function ampleur(id, r) {
    try {
      if (r.nouveau) { var p = parseBody(r.body || ""); T.ampleur[id] = "nouveau · " + p.titres.reduce(function (n, t) { return n + t.articles.length; }, 0) + " article(s)"; }
      else { var src = await fetchSource(id); var ch = diffBodies(src.body, r.body || ""); var c = { ajout: 0, modif: 0, retrait: 0 }; ch.forEach(function (x) { c[x.type]++; }); T.ampleur[id] = '<span class="p">+' + c.ajout + '</span> <span class="e">~' + c.modif + '</span> <span class="m">−' + c.retrait + "</span>"; }
    } catch (e) { T.ampleur[id] = "—"; }
    if (location.hash === "#tableau") renderTableau();
  }

  // Relance : message prêt à envoyer (pas d'envoi automatique)
  function relancer(kind, i) {
    var to = [], sujet = "", corps = "", lien = location.origin + location.pathname;
    if (kind === "a") { var a = T.lignes[i]; to = a.qui; sujet = "Référentiel : " + a.d.id + " attend votre " + a.x.st.label.toLowerCase(); corps = "Bonjour,\n\nLe document " + a.d.id + " — " + a.d.titre + " (version " + a.d.version + ") attend votre " + a.x.st.label.toLowerCase() + " depuis " + a.age + " jour(s) (délai fixé : " + a.delai + " jours).\n\nVous pouvez le viser ici : " + lien + "#" + docHash(a.d) + "\n\nMerci."; }
    else { var l = T.lecLignes[i]; to = l.manquants; sujet = "Référentiel : lecture de " + l.d.id + " à attester"; corps = "Bonjour,\n\nLe document " + l.d.id + " — " + l.d.titre + " (version " + l.d.version + ") est en vigueur. Merci de le lire et d'attester votre lecture (délai : " + l.delai + " jours) : " + lien + "#" + l.d.id + "\n\nMerci."; }
    var mails = to.map(function (id) { return V.emails[id]; }).filter(Boolean);
    var el = document.createElement("div"); el.className = "cfm-scrim";
    el.innerHTML = '<div class="cfm" role="dialog" aria-modal="true" aria-labelledby="rl-t"><h2 id="rl-t">Relancer</h2><dl><dt>À</dt><dd>' + esc(to.map(nomCourt).join(", ")) + (mails.length ? "<br><small>" + esc(mails.join(", ")) + "</small>" : "") + "</dd><dt>Objet</dt><dd>" + esc(sujet) + '</dd></dl><textarea class="rl-txt" rows="9">' + esc(corps) + '</textarea><p class="cite-src">Aucun message n\'est envoyé par le site : copiez le texte ou ouvrez votre messagerie.</p><div class="visa-btns"><button type="button" class="btn primary" data-rl="copier">Copier le message</button>' + (mails.length ? '<a class="btn" href="mailto:' + encodeURIComponent(mails.join(",")).replace(/%40/g, "@").replace(/%2C/g, ",") + "?subject=" + encodeURIComponent(sujet) + "&body=" + encodeURIComponent(corps) + '">Ouvrir dans la messagerie</a>' : "") + '<button type="button" class="btn" data-rl="fermer">Fermer</button></div></div>';
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      e.stopPropagation();
      if (e.target === el || e.target.closest('[data-rl="fermer"]')) el.remove();
      if (e.target.closest('[data-rl="copier"]')) { var t = el.querySelector(".rl-txt"); try { navigator.clipboard.writeText(sujet + "\n\n" + t.value); toast("Message copié."); } catch (er) { t.select(); document.execCommand("copy"); toast("Message copié."); } }
    });
    el.addEventListener("keydown", function (e) { if (e.key === "Escape") el.remove(); });
  }

  async function exporterTableau() {
    var lignes = [["Référence", "Titre", "Type", "Statut", "Version", "Étape en cours", "Attendu de", "Depuis (jours)", "Délai (jours)", "En retard", "Lectures attestées", "Lectures attendues", "Brouillon en cours", "Prochaine revue"].join(";")];
    var att = attentes(docsSuivis()), lec = lectures(docsSuivis());
    docsSuivis().forEach(function (d) {
      var a = att.filter(function (x) { return x.d === d; })[0], l = lec.filter(function (x) { return x.d === d; })[0], dr = V.redac && V.redac[d.id];
      lignes.push([d.id, d.titre, d.type, d.estProjet ? "Révision en cours" : d.statut, d.version, a ? a.x.st.label : stageOf(d).label, a ? a.qui.map(nomCourt).join(", ") : "", a ? a.age : "", a ? a.delai : "", a && a.retard ? "oui" : "", l ? l.lus : "", l ? l.attendus : "", dr && ["brouillon", "soumis", "conflit"].indexOf(dr.statut) >= 0 ? dr.statut : "", echeance(d) || ""].map(function (x) { return String(x == null ? "" : x).replace(/[;\n]/g, " "); }).join(";"));
    });
    var dl = await downloadsP; if (!dl) { toast("Le téléchargement n'est pas disponible dans cette vue."); return; }
    try { await dl.save({ filename: "tableau-de-bord_" + new Date().toISOString().slice(0, 10) + ".csv", data: "﻿" + lignes.join("\r\n") }); } catch (e) { if (!(e && e.code === "declined")) toast("Le téléchargement a échoué."); }
  }

  document.addEventListener("change", function (ev) {
    var f = ev.target.getAttribute && ev.target.getAttribute("data-tf"); if (!f) return;
    if (f === "projets") T.projets = ev.target.checked; else if (f === "periode") T.periode = +ev.target.value; else T[f] = ev.target.value;
    renderTableau();
  });
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-tgo],[data-tflux],[data-trel],[data-tpers]"); if (!b) return;
    ev.preventDefault();
    if (b.hasAttribute("data-tflux")) { T.flux = b.getAttribute("data-tflux"); renderTableau(); return; }
    if (b.hasAttribute("data-tpers")) { T.personne = T.personne === b.getAttribute("data-tpers") ? "" : b.getAttribute("data-tpers"); renderTableau(); return; }
    if (b.hasAttribute("data-trel")) { var r = b.getAttribute("data-trel").split("|"); relancer(r[0], +r[1]); return; }
    var g = b.getAttribute("data-tgo");
    if (g === "csv") { exporterTableau(); return; }
    if (g === "imprimer") { window.print(); return; }
    if (g === "tout") { T.tout = true; renderTableau(); return; }
    if (g === "registre") { go("registre"); return; }
    var el = document.getElementById(g); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
