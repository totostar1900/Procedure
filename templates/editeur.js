  // ---------- Édition en ligne des documents (brouillons) ----------
  // redaction/<ID>            brouillon de modification du texte de travail — Rédacteurs et administrateur
  //                           statut : brouillon → soumis → applique (ou conflit), écrit en dernier par la publication automatique
  // auteurs/<ID>~<empreinte>  rédacteurs d'une version publiée : ils ne peuvent pas la viser (règle des quatre yeux)
  // Le texte source vient de source/<ID>.json (publié avec le site). La publication automatique applique le brouillon
  // au dépôt (tools/appliquer.mjs), régénère PDF et Word et le circuit recommence sur la nouvelle empreinte.
  var E = null; // brouillon ouvert
  var IMPORT_APRES = false; // nouveau document « à partir d'un Word » : ouvrir le choix du fichier à l'arrivée dans l'éditeur
  var canEdit = function () { return !!(V.db && V.me && V.canWrite && (peut("rediger") || hasRole(V.me, "redac") || hasRole(V.me, "membre"))); };
  var draftOf = function (id) { var r = V.redac && V.redac[id]; return r && (r.statut === "brouillon" || r.statut === "soumis" || r.statut === "conflit") ? r : null; };
  var isAuthor = function (d) { var a = V.auteurs && V.auteurs[d.id + "~" + d.empreinte]; return !!(a && V.me && (a.auteurs || []).indexOf(V.me) >= 0); };
  var workOf = function (id) { var d = docs.filter(function (x) { return x.id === id; })[0]; return d ? d.projet || d : null; };
  var ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
  var uidN = 0; var uid = function () { return "n" + (++uidN); };

  // Markdown → structure (préambule, titres, articles) et retour, avec renumérotation
  function parseBody(md) {
    var m = { pre: [], titres: [] }, cur = null, art = null, ok = true;
    String(md || "").replace(/\r/g, "").split("\n").forEach(function (l) {
      var h2 = /^##\s+(.+?)\s*$/.exec(l), h3 = /^###\s+(.+?)\s*$/.exec(l);
      if (h2 && !/^###/.test(l)) { var t = /^Titre\s+[IVXLC]+\s+—\s+(.+)$/.exec(h2[1]); cur = { uid: uid(), label: t ? t[1] : h2[1], numbered: !!t, pre: [], articles: [] }; m.titres.push(cur); art = null; return; }
      if (h3) { var a = /^Article\s+\d+\s+—\s+(.+)$/.exec(h3[1]); if (!cur) { cur = { uid: uid(), label: "", numbered: false, pre: [], articles: [] }; m.titres.push(cur); } art = { uid: uid(), titre: a ? a[1] : h3[1], numbered: !!a, body: [] }; if (!a) ok = false; cur.articles.push(art); return; }
      (art ? art.body : cur ? cur.pre : m.pre).push(l);
    });
    var trim = function (a) { return a.join("\n").replace(/^\n+|\n+$/g, ""); };
    m.pre = trim(m.pre); m.titres.forEach(function (t) { t.pre = trim(t.pre); t.articles.forEach(function (a) { a.body = trim(a.body); }); });
    m.structured = ok && m.titres.some(function (t) { return t.articles.length; });
    return m;
  }
  function serialize(m) {
    var out = [], n = 0, ti = 0;
    if (m.pre) out.push(m.pre, "");
    m.titres.forEach(function (t) {
      if (t.label || t.numbered) { out.push("## " + (t.numbered ? "Titre " + (ROMAN[++ti] || ti) + " — " : "") + t.label, ""); }
      if (t.pre) out.push(t.pre, "");
      t.articles.forEach(function (a) { out.push("### " + (a.numbered ? "Article " + (++n) + " — " : "") + a.titre, ""); if (a.body) out.push(a.body, ""); });
    });
    return out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\n+$/, "") + "\n";
  }

  // Comparaison mot à mot (plus longue sous-suite commune)
  function wordDiff(a, b) {
    var x = String(a || "").split(/(\s+)/), y = String(b || "").split(/(\s+)/);
    if (x.length * y.length > 4e6) return '<del>' + esc(a) + "</del><ins>" + esc(b) + "</ins>";
    var n = x.length, m = y.length, L = new Array(n + 1);
    for (var i = 0; i <= n; i++) { L[i] = new Uint16Array(m + 1); }
    for (i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var out = "", del = "", ins = "", flush = function () { if (del) out += "<del>" + esc(del) + "</del>"; if (ins) out += "<ins>" + esc(ins) + "</ins>"; del = ins = ""; };
    i = 0; j = 0;
    while (i < n && j < m) {
      if (x[i] === y[j]) { flush(); out += esc(x[i]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) del += x[i++]; else ins += y[j++];
    }
    while (i < n) del += x[i++]; while (j < m) ins += y[j++]; flush();
    return out;
  }
  // Changements entre deux textes, article par article (les articles sont rapprochés par leur titre, puis par leur rang)
  function diffBodies(oldMd, newMd) {
    var flat = function (md) { var p = parseBody(md), out = []; if (p.pre) out.push({ k: "Préambule", t: "", b: p.pre }); p.titres.forEach(function (t) { if (t.pre) out.push({ k: "Titre " + t.label, t: "", b: t.pre }); t.articles.forEach(function (a) { out.push({ k: a.titre, t: a.titre, b: a.body, titre: t.label }); }); }); return out; };
    var A = flat(oldMd), B = flat(newMd), used = {}, ch = [];
    B.forEach(function (b, bi) {
      var ai = -1; A.forEach(function (a, k) { if (ai < 0 && !used[k] && a.k === b.k) ai = k; });
      if (ai < 0 && A[bi] && !used[bi] && !B.some(function (z) { return z.k === A[bi].k; })) ai = bi;
      if (ai < 0) { ch.push({ type: "ajout", n: bi, b: b }); return; }
      used[ai] = 1; var a = A[ai];
      if (a.k !== b.k || a.b !== b.b) ch.push({ type: "modif", n: bi, a: a, b: b });
    });
    A.forEach(function (a, k) { if (!used[k]) ch.push({ type: "retrait", a: a }); });
    return ch;
  }
  function diffHtml(ch, artNo) {
    if (!ch.length) return '<p class="tt-empty">Aucune modification du texte.</p>';
    return '<ul class="dlist">' + ch.map(function (c) {
      var lab = c.type === "ajout" ? "Ajouté" : c.type === "retrait" ? "Supprimé" : "Modifié";
      var name = (c.b || c.a).k;
      var body = c.type === "ajout" ? "<ins>" + esc(c.b.b) + "</ins>" : c.type === "retrait" ? "<del>" + esc(c.a.b) + "</del>" : (c.a.k !== c.b.k ? '<div class="d-t">Intitulé : ' + wordDiff(c.a.k, c.b.k) + "</div>" : "") + wordDiff(c.a.b, c.b.b);
      return '<li class="d-' + c.type + '"><div class="d-head"><span class="pill ' + (c.type === "ajout" ? "vigueur" : c.type === "retrait" ? "abroge" : "projet") + '">' + lab + "</span> <b>" + esc(name) + '</b></div><div class="d-body">' + body + "</div></li>";
    }).join("") + "</ul>";
  }

  async function fetchSource(id, vig) {
    var r = await fetch("source/" + id + (vig ? ".vigueur" : "") + ".json", { cache: "no-store" });
    if (!r.ok) throw new Error("source");
    return r.json();
  }

  // ---------- Ouverture du brouillon ----------
  async function openEditor(id) {
    var v = $("#v-edition"); if (!v) return;
    var d = workOf(id);
    v.innerHTML = '<p class="lead">Chargement du texte…</p>';
    if (!V.ready) { setTimeout(function () { if (location.hash.indexOf("#edition/") === 0) openEditor(id); }, 400); return; }
    var nv = !d && V.redac[id] && V.redac[id].nouveau ? V.redac[id] : null;
    if (nv) d = nouveauDoc(id, nv.meta || {});
    if (!d) { v.innerHTML = '<p class="lead">Document introuvable.</p>'; return; }
    if (!canEdit()) { v.innerHTML = '<div class="eyebrow">Modification</div><h1 class="title">' + esc(d.titre) + '</h1><p class="lead">' + (V.db ? "La modification des documents est réservée aux personnes ayant la fonction « Rédacteur » et à l'administrateur." : "La modification des documents se fait sur le site du référentiel, referentiel.purposecapital.africa.") + ' <button type="button" class="doclink" data-open="' + esc(d.id) + '">Revenir au document</button></p>'; return; }
    var src;
    if (nv) src = { id: id, version: "0.9", statut: "Nouveau", empreinte: "nouveau", titre: "", resume: "", body: "", annexes: [] };
    else try { src = await fetchSource(id); } catch (e) { v.innerHTML = '<p class="lead">Le texte source n\'est pas disponible dans cette vue. La modification se fait sur referentiel.purposecapital.africa.</p>'; return; }
    var dr = draftOf(id);
    var stale = dr && dr.base !== src.empreinte && dr.statut !== "soumis";
    var body = dr ? dr.body : src.body;
    E = { id: id, d: d, src: src, draft: dr ? JSON.parse(JSON.stringify(dr)) : null, maj: dr ? dr.maj : null, stale: stale,
      f: { nature: dr ? dr.nature : "mineure", objet: dr ? dr.objet || "" : "", titre: dr ? dr.titre || src.titre : src.titre, resume: dr ? dr.resume || src.resume : src.resume },
      model: parseBody(body), raw: body, view: "edit", saved: dr ? dr.maj : null, dirty: false, confirm: false,
      onglet: "texte", annexes: JSON.parse(JSON.stringify((dr && Array.isArray(dr.annexes) ? dr.annexes : src.annexes) || [])), ouvertes: {} };
    E.mode = (dr && dr.mode) || (E.model.structured && !d.modele ? "articles" : "texte");
    E.nouveau = !!nv; E.meta = nv ? nv.meta || {} : null; E.medias = {};
    await chargerMedias(body);
    renderEditor();
    if (IMPORT_APRES) { IMPORT_APRES = false; var fi = $("#ed-word"); if (fi) try { fi.click(); } catch (e) { /* le bouton « Importer un Word » reste disponible */ } }
  }
  // Document en création : pas encore de fichier, ses informations viennent du brouillon
  function nouveauDoc(id, m) { return { id: id, type: m.type || "", domaine: m.domaine || "", titre: m.titre || id, version: "0.9", statut: "Projet", circuit: [], empreinte: "nouveau", annexes: [], toc: [], historique: [], nouveau: true }; }
  var enVigueur = function () { return E && E.src.statut === "En vigueur"; };
  var curBody = function () { return E.mode === "articles" ? serialize(E.model) : E.raw.replace(/\s*$/, "\n"); };
  var nextVersion = function () { var p = String(E.src.version).split(".").map(Number); return enVigueur() ? (E.f.nature === "mineure" ? p[0] + "." + ((p[1] || 0) + 1) : (p[0] + 1) + ".0") : E.src.version; };

  function renderEditor() {
    var v = $("#v-edition"); if (!v || !E) return;
    var d = E.d, dr = draftOf(E.id), sub = dr && dr.statut === "soumis", conf = dr && dr.statut === "conflit";
    var other = dr && E.maj && dr.maj !== E.maj && dr.par !== V.me;
    var pub = V.redac[E.id] && V.redac[E.id].statut === "applique" && E.draft && E.draft.statut === "soumis";
    if (pub) { v.innerHTML = '<div class="eyebrow">Modification · ' + esc(d.id) + '</div><h1 class="title">' + esc(E.f.titre) + '</h1><div class="revbar ok"><div class="rb-main"><b>Modification publiée</b> — version ' + esc(V.redac[E.id].version || "") + ', empreinte <code>' + esc(V.redac[E.id].empreinte || "") + '</code>. Le circuit d\'approbation commence.</div><div class="rb-btns"><button type="button" class="btn primary" onclick="location.reload()">Recharger le référentiel</button></div></div>'; return; }
    var head = (E.nouveau ? '<button type="button" class="crumb" data-open="registre">← Registre des documents</button>' : '<button type="button" class="crumb" data-open="' + esc(d.id + (d.estProjet ? "~projet" : "")) + '">← ' + esc(d.id) + " · retour au document</button>") +
      '<div class="eyebrow">Modification · ' + esc(d.type) + " · " + esc(d.id) + '</div><h1 class="title">' + esc(E.f.titre) + "</h1>" +
      (E.nouveau ? '<p class="cite-src">Nouveau document — il sera créé en projet v0.9 à la soumission, puis suivra le circuit des documents de type « ' + esc(d.type) + " ». " + esc([E.meta.domaine, "propriétaire : " + (E.meta.proprietaire || "—"), "vérifié par : " + (E.meta.verifie_par || "—"), "approuvé par : " + (E.meta.approuve_par || "—")].join(" · ")) + "</p>" :
      '<p class="cite-src">Texte de travail v' + esc(E.src.version) + " (" + esc(E.src.statut) + ")") + (E.nouveau ? "" : (enVigueur() ? " → nouvelle version " + esc(nextVersion()) + " après publication ; la version " + esc(E.src.version) + " reste en vigueur jusqu'à l'adoption." : " → le projet reste en version " + esc(E.src.version) + " ; le circuit recommence sur le texte modifié.") + "</p>");
    var bar = '<div class="edbar"><span class="ed-state">' + (sub ? "Soumis le " + esc(fmtDT(dr.soumis_le)) + " — publication en cours (quelques minutes)" : E.dirty ? "Modifications non enregistrées…" : E.saved ? "Brouillon enregistré · " + esc(fmtDT(E.saved).split(/ à |, (?=\d\d:)/)[1] || "") : "Aucune modification") + "</span>" +
      '<div class="ed-btns">' +
      (E.model.structured && !d.modele ? '<span class="seg"><button type="button" data-ed="mode|articles" aria-pressed="' + (E.mode === "articles") + '">Par article</button><button type="button" data-ed="mode|texte" aria-pressed="' + (E.mode === "texte") + '">Texte intégral</button></span>' : "") +
      renvoiSelect() + '<label class="btn" title="Remplacer le texte du brouillon par celui d\'un fichier Word">Importer un Word…<input type="file" id="ed-word" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden></label>' +
      '<button type="button" class="btn" data-ed="view|' + (E.view === "diff" ? "edit" : "diff") + '">' + (E.view === "diff" ? "Revenir à l'édition" : "Voir les modifications") + "</button>" +
      (sub ? '<button type="button" class="btn" data-ed="reprendre">Reprendre le brouillon</button>' : '<button type="button" class="btn primary" data-ed="soumettre">Soumettre au circuit…</button>') +
      (dr ? '<button type="button" class="btn ghost danger" data-ed="abandon">Abandonner</button>' : "") + "</div></div>";
    var warn = (E.stale ? '<div class="rev-banner proj"><b>Le texte a changé depuis la création de ce brouillon</b> (nouvelle version publiée). Vérifiez vos modifications avec « Voir les modifications » avant de soumettre ; la publication refusera un brouillon fondé sur un texte périmé. <button type="button" class="doclink" data-ed="rebase">Repartir du texte publié</button></div>' : "") +
      (conf ? '<div class="rev-banner proj"><b>Publication refusée :</b> ' + esc(dr.message || "le texte a changé entre-temps") + "</div>" : "") +
      (other ? '<div class="rev-banner proj"><b>' + esc(vName(dr.par)) + "</b> a modifié ce brouillon le " + esc(fmtDT(dr.maj)) + '. <button type="button" class="doclink" data-ed="recharger">Charger sa version</button> (vos modifications non enregistrées seront perdues)</div>' : "") +
      (d.modele ? '<div class="notice"><b>Modèle de contrat.</b> Ne modifiez pas les zones entre accolades ({{…}}, {% … %}) : elles alimentent le formulaire des conventions.</div>' : "");
    var confirm = "";
    var fields = '<div class="edfields">' +
      (enVigueur() ? '<fieldset class="ed-nature"><legend>Nature de la modification</legend>' +
        '<label class="radio"><input type="radio" name="ed-nat" value="mineure"' + (E.f.nature === "mineure" ? " checked" : "") + '> <span><b>Correction mineure</b> — forme, coquille : version ' + esc(String(E.src.version).split(".")[0] + "." + ((+String(E.src.version).split(".")[1] || 0) + 1)) + ", les lectures restent valables</span></label>" +
        '<label class="radio"><input type="radio" name="ed-nat" value="revision"' + (E.f.nature === "revision" ? " checked" : "") + '> <span><b>Révision</b> — fond : version ' + esc((+String(E.src.version).split(".")[0] + 1) + ".0") + ", nouvelle lecture demandée après l'adoption</span></label></fieldset>" : "") +
      '<label class="vf">Objet de la modification (repris dans l\'historique)<input type="text" data-ef="objet" maxlength="200" value="' + esc(E.f.objet) + '" placeholder="Ex. : mise à jour des seuils de déclaration"></label>' +
      '<label class="vf">Titre du document<input type="text" data-ef="titre" maxlength="160" value="' + esc(E.f.titre) + '"></label>' +
      '<label class="vf">Résumé (affiché dans le registre)<textarea data-ef="resume" rows="3" maxlength="800">' + esc(E.f.resume) + "</textarea></label></div>";
    var tabs = E.view === "diff" ? "" : '<div class="ed-tabs" role="tablist"><button type="button" role="tab" data-ed="onglet|texte" aria-selected="' + (E.onglet !== "annexes") + '">Texte</button><button type="button" role="tab" data-ed="onglet|annexes" aria-selected="' + (E.onglet === "annexes") + '">Annexes <span class="count-chip">' + E.annexes.length + "</span></button></div>";
    var main = E.view === "diff" ? '<h2 class="section-h">Modifications par rapport au texte publié</h2>' + metaDiff() + diffHtml(diffBodies(E.src.body, curBody())) + annexesDiffHtml()
      : E.onglet === "annexes" ? annexesHtml()
      : E.mode === "texte" ? '<h2 class="section-h">Texte intégral</h2><p class="cite-src">Markdown : « ## Titre I — … » pour un titre, « ### Article 1 — … » pour un article. La numérotation n\'est pas refaite dans ce mode.</p><textarea class="ed-raw" data-ef="raw" spellcheck="true">' + esc(E.raw) + "</textarea>"
      : articlesHtml();
    v.innerHTML = head + bar + warn + confirm + fields + tabs + main;
    autoGrow(v);
  }
  // ---------- Annexes ----------
  // Désignées par leur nom court (« l'annexe « Pièces client » ») ; la clé (A1, A2…) reste interne et ne change jamais.
  var NATURES = ["Formulaire", "Registre", "Liste de contrôle", "Matrice", "Modèle", "Tableau", "Fiche", "Note"];
  var MODELES_ANNEXE = {
    "Formulaire": "Renseignez les champs ci-dessous.\n\n| Rubrique | Information |\n|---|---|\n| Nom et prénoms | |\n| Fonction | |\n| Date | |\n\nSignature :\n",
    "Registre": "Une ligne par événement, dans l'ordre chronologique.\n\n| N° | Date | Objet | Responsable | Suite donnée |\n|---|---|---|---|---|\n| | | | | |\n",
    "Liste de contrôle": "Cochez chaque point vérifié.\n\n- [ ] Premier point à vérifier\n- [ ] Deuxième point à vérifier\n",
    "Matrice": "| Élément | Niveau | Mesure | Responsable |\n|---|---|---|---|\n| | | | |\n",
  };
  var cleAnnexe = function (a) { return a.cle || a.tmp; };
  var annexeOrig = function (a) { return a.cle ? (E.src.annexes || []).filter(function (x) { return x.cle === a.cle; })[0] : null; };
  var CHAMPS = [["nature", "Nature"], ["renseigne_par", "Renseignée par"], ["conserve_par", "Conservée par"], ["frequence", "Fréquence"]];
  function annexesHtml() {
    var A = E.annexes, noms = {};
    A.forEach(function (a) { var k = (a.nom || "").trim().toLowerCase(); noms[k] = (noms[k] || 0) + 1; });
    return '<h2 class="section-h">Annexes</h2><p class="cite-src">Chaque annexe est désignée par un nom court, unique dans le document. Dans le texte, un renvoi s\'insère avec la liste « Renvoi vers une annexe » : il s\'affiche avec le nom de l\'annexe et suit ses changements de nom.</p>' +
      '<div class="ed-annexes">' + A.map(function (a, i) {
        var k = cleAnnexe(a), ouv = !!E.ouvertes[k], dbl = noms[(a.nom || "").trim().toLowerCase()] > 1;
        return '<article class="ed-card ed-ann" id="ed-x' + i + '"><div class="ed-ahead"><span class="ed-num">Annexe</span>' +
          '<input type="text" class="ed-xnom" data-ex="' + i + '|nom" value="' + esc(a.nom) + '" maxlength="60" placeholder="Nom court (2 à 4 mots)" aria-label="Nom de l\'annexe">' +
          '<span class="ed-tools"><button type="button" class="icon-btn" data-ed="x-up|' + i + '" aria-label="Monter l\'annexe"' + (i ? "" : " disabled") + '>↑</button><button type="button" class="icon-btn" data-ed="x-down|' + i + '" aria-label="Descendre l\'annexe"' + (i < A.length - 1 ? "" : " disabled") + '>↓</button><button type="button" class="icon-btn" data-ed="x-del|' + i + '" aria-label="Supprimer l\'annexe">✕</button></span></div>' +
          (dbl ? '<p class="tt-warn">Deux annexes portent ce nom : choisissez un nom unique.</p>' : !(a.nom || "").trim() ? '<p class="tt-warn">Donnez un nom court à l\'annexe.</p>' : "") +
          '<label class="vf">Titre<input type="text" data-ex="' + i + '|titre" value="' + esc(a.titre) + '" maxlength="200"></label>' +
          '<div class="ed-xfiche">' + CHAMPS.map(function (c) {
            if (c[0] === "nature") return '<label class="vf">' + c[1] + '<select data-ex="' + i + '|nature">' + NATURES.concat(NATURES.indexOf(a.nature) < 0 && a.nature ? [a.nature] : []).map(function (n) { return '<option' + (n === a.nature ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("") + "</select></label>";
            return '<label class="vf">' + c[1] + '<input type="text" data-ex="' + i + "|" + c[0] + '" value="' + esc(a[c[0]]) + '" maxlength="200"></label>';
          }).join("") + '<label class="chkl"><input type="checkbox" data-ex="' + i + '|orientation"' + (a.orientation === "paysage" ? " checked" : "") + "> Page en paysage</label></div>" +
          '<div class="ed-afoot"><button type="button" class="doclink" data-ed="x-ouvrir|' + i + '">' + (ouv ? "Masquer le contenu" : "Modifier le contenu") + '</button><button type="button" class="doclink" data-ed="x-apercu|' + i + '">Aperçu</button>' + (a.cle ? "" : ' <span class="pill projet">Nouvelle</span>') + "</div>" +
          (ouv ? '<textarea class="ed-raw ed-xbody" data-ex="' + i + '|body" aria-label="Contenu de l\'annexe ' + esc(a.nom) + '">' + esc(a.body) + "</textarea>" : "") +
          '<div class="ed-prev" id="ed-xp' + i + '" hidden></div></article>';
      }).join("") + (A.length ? "" : '<p class="tt-empty">Ce document n\'a pas d\'annexe.</p>') + "</div>" +
      '<div class="ed-tfoot"><span class="lbl">Ajouter une annexe :</span>' + NATURES.slice(0, 4).map(function (n) { return '<button type="button" class="btn" data-ed="x-add|' + esc(n) + '">+ ' + esc(n) + "</button>"; }).join("") + '<button type="button" class="btn ghost" data-ed="x-add|">+ Annexe vierge</button></div>';
  }
  // Annexes ajoutées, supprimées, modifiées (fiche et contenu) par rapport au texte publié
  function annexesChanges() {
    var out = [], src = E.src.annexes || [];
    E.annexes.forEach(function (a, i) {
      var o = annexeOrig(a);
      if (!o) { out.push({ type: "ajout", a: a }); return; }
      var champs = ["nom", "titre"].concat(CHAMPS.map(function (c) { return c[0]; }), ["orientation"]).filter(function (k) { return (o[k] || "") !== (a[k] || ""); });
      var j = src.indexOf(o);
      if (champs.length || o.body !== a.body || j !== i) out.push({ type: "modif", a: a, o: o, champs: champs, corps: o.body !== a.body, ordre: j !== i });
    });
    src.forEach(function (o) { if (!E.annexes.some(function (a) { return a.cle === o.cle; })) out.push({ type: "retrait", o: o }); });
    return out;
  }
  function annexesDiffHtml() {
    var ch = annexesChanges(); if (!ch.length) return "";
    return '<h2 class="section-h">Annexes</h2><ul class="dlist">' + ch.map(function (c) {
      var lab = c.type === "ajout" ? "Ajoutée" : c.type === "retrait" ? "Supprimée" : "Modifiée", x = c.a || c.o;
      var body = c.type === "ajout" ? "<ins>" + esc(c.a.titre) + "\n\n" + esc(c.a.body) + "</ins>" : c.type === "retrait" ? "<del>" + esc(c.o.titre) + "</del>"
        : c.champs.map(function (k) { return '<div class="d-t">' + esc(({ nom: "Nom", titre: "Titre", orientation: "Orientation" })[k] || (CHAMPS.filter(function (z) { return z[0] === k; })[0] || ["", k])[1]) + " : " + wordDiff(c.o[k] || "", c.a[k] || "") + "</div>"; }).join("") + (c.ordre ? '<div class="d-t">Position changée</div>' : "") + (c.corps ? wordDiff(c.o.body, c.a.body) : "");
      return '<li class="d-' + c.type + '"><div class="d-head"><span class="pill ' + (c.type === "ajout" ? "vigueur" : c.type === "retrait" ? "abroge" : "projet") + '">' + lab + '</span> <b>Annexe « ' + esc(x.nom) + " »</b></div><div class=\"d-body\">" + body + "</div></li>";
    }).join("") + "</ul>";
  }
  // Liste « Renvoi vers une annexe » : insère le code du renvoi là où se trouve le curseur
  function renvoiSelect() {
    var autres = docs.filter(function (d) { return d.id !== E.id && (d.annexes || []).length; });
    return '<select class="ed-renvoi" data-ed-renvoi aria-label="Insérer un renvoi vers une annexe"><option value="">Renvoi vers une annexe…</option>' +
      (E.annexes.filter(function (a) { return a.cle; }).length ? '<optgroup label="Ce document">' + E.annexes.filter(function (a) { return a.cle; }).map(function (a) { return '<option value="' + esc(a.cle) + '">' + esc(a.nom || a.cle) + "</option>"; }).join("") + "</optgroup>" : "") +
      autres.map(function (d) { var v = vueLangue(d); return '<optgroup label="' + esc(d.id + " — " + v.titre) + '">' + (v.annexes || []).map(function (a) { return '<option value="' + esc(d.id + "/A" + a.num) + '">' + esc(a.nom || "A" + a.num) + "</option>"; }).join("") + "</optgroup>"; }).join("") + "</select>";
  }
  document.addEventListener("focusin", function (ev) { var t = ev.target; if (E && t.tagName === "TEXTAREA" && t.closest && t.closest("#v-edition")) E.focus = { el: t, pos: t.selectionStart }; });
  document.addEventListener("keyup", function (ev) { if (E && E.focus && ev.target === E.focus.el) E.focus.pos = ev.target.selectionStart; });
  document.addEventListener("click", function (ev) { if (E && E.focus && ev.target === E.focus.el) E.focus.pos = ev.target.selectionStart; });
  document.addEventListener("change", function (ev) {
    var t = ev.target; if (!E || !t.hasAttribute || !t.hasAttribute("data-ed-renvoi") || !t.value) return;
    var code = "[[annexe:" + t.value + "]]"; t.value = "";
    var f = E.focus && document.contains(E.focus.el) ? E.focus : null;
    if (!f) { try { navigator.clipboard.writeText(code); } catch (e) { /* presse-papiers indisponible */ } toast("Placez d'abord le curseur dans le texte. Le renvoi " + code + " est copié."); return; }
    var el = f.el, p = Math.min(f.pos == null ? el.value.length : f.pos, el.value.length);
    el.value = el.value.slice(0, p) + code + el.value.slice(p); el.focus(); el.selectionStart = el.selectionEnd = p + code.length; f.pos = p + code.length;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  // Renvois : [[annexe:A1]] (ce document) ou [[annexe:PC-…/A1]] ; affichés avec le nom de l'annexe
  function renvoisVers(cle) { if (!cle) return 0; var t = curBody() + "\n" + E.annexes.map(function (a) { return a.body; }).join("\n"); return t.split("[[annexe:" + cle + "]]").length - 1; }
  function nommer(md) {
    return String(md || "").replace(/\[\[annexe:(?:(PC-[A-Z0-9-]+)\/)?(A\d+)\]\]/g, function (m, doc, cle) {
      var n = null;
      if (!doc || doc === E.id) { var a = E.annexes.filter(function (x) { return x.cle === cle; })[0]; n = a && a.nom; }
      else { var d = docs.filter(function (x) { return x.id === doc; })[0], v = d ? vueLangue(d) : null, x = v ? (v.annexes || []).filter(function (y) { return "A" + y.num === cle; })[0] : null; n = x && x.nom; }
      return n ? (EN ? "“" + n + "”" : "« " + n + " »") : (EN ? "“(missing appendix)”" : "« (annexe introuvable) »");
    });
  }
  function metaDiff() {
    var out = "";
    if (E.f.titre !== E.src.titre) out += '<li class="d-modif"><div class="d-head"><span class="pill projet">Modifié</span> <b>Titre du document</b></div><div class="d-body">' + wordDiff(E.src.titre, E.f.titre) + "</div></li>";
    if (E.f.resume !== E.src.resume) out += '<li class="d-modif"><div class="d-head"><span class="pill projet">Modifié</span> <b>Résumé</b></div><div class="d-body">' + wordDiff(E.src.resume, E.f.resume) + "</div></li>";
    return out ? '<ul class="dlist">' + out + "</ul>" : "";
  }
  function articlesHtml() {
    var n = 0, ti = 0, m = E.model;
    var outline = '<nav class="ed-outline" aria-label="Plan du document"><p class="side-title">Plan</p><ol>' + m.titres.map(function (t, i) {
      return '<li><button type="button" data-jump="ed-t' + i + '">' + esc((t.numbered ? (ROMAN[++ti] || ti) + ". " : "") + (t.label || "Sans titre")) + "</button></li>";
    }).join("") + "</ol></nav>";
    ti = 0;
    var body = '<div class="ed-arts">' + (m.pre || m.titres.length === 0 ? '<section class="ed-card pre"><label class="vf">Préambule<textarea data-ea="pre" rows="3">' + esc(m.pre) + "</textarea></label></section>" : "") +
      m.titres.map(function (t, i) {
        var tnum = t.numbered ? "Titre " + (ROMAN[++ti] || ti) + " —" : "";
        return '<section class="ed-titre" id="ed-t' + i + '"><div class="ed-thead"><span class="ed-num">' + esc(tnum) + '</span><input type="text" data-ea="t|' + i + '|label" value="' + esc(t.label) + '" aria-label="Intitulé du titre" placeholder="Intitulé du titre">' +
          '<span class="ed-tools"><button type="button" class="icon-btn" data-ed="t-up|' + i + '" aria-label="Monter le titre"' + (i ? "" : " disabled") + '>↑</button><button type="button" class="icon-btn" data-ed="t-down|' + i + '" aria-label="Descendre le titre"' + (i < m.titres.length - 1 ? "" : " disabled") + '>↓</button>' +
          (!t.articles.length ? '<button type="button" class="icon-btn" data-ed="t-del|' + i + '" aria-label="Supprimer le titre">✕</button>' : "") + "</span></div>" +
          (t.pre ? '<textarea data-ea="t|' + i + '|pre" rows="2" aria-label="Introduction du titre">' + esc(t.pre) + "</textarea>" : "") +
          t.articles.map(function (a, j) {
            n++;
            return '<article class="ed-card" id="ed-a' + i + "-" + j + '"><div class="ed-ahead"><span class="ed-num">' + (a.numbered ? "Article " + n + " —" : "") + '</span><input type="text" data-ea="a|' + i + "|" + j + '|titre" value="' + esc(a.titre) + '" aria-label="Intitulé de l\'article ' + n + '">' +
              '<span class="ed-tools"><button type="button" class="icon-btn" data-ed="a-up|' + i + "|" + j + '" aria-label="Monter l\'article"' + (i || j ? "" : " disabled") + '>↑</button><button type="button" class="icon-btn" data-ed="a-down|' + i + "|" + j + '" aria-label="Descendre l\'article">↓</button><button type="button" class="icon-btn" data-ed="a-del|' + i + "|" + j + '" aria-label="Supprimer l\'article">✕</button></span></div>' +
              '<textarea data-ea="a|' + i + "|" + j + '|body" aria-label="Texte de l\'article ' + n + '">' + esc(a.body) + "</textarea>" +
              '<div class="ed-afoot"><button type="button" class="doclink" data-ed="a-add|' + i + "|" + j + '">+ Article après</button><button type="button" class="doclink" data-ed="preview|' + i + "|" + j + '">Aperçu</button></div><div class="ed-prev" id="ed-p' + i + "-" + j + '" hidden></div></article>';
          }).join("") +
          '<div class="ed-tfoot"><button type="button" class="btn" data-ed="a-add|' + i + "|" + (t.articles.length - 1) + '">+ Article</button><button type="button" class="btn ghost" data-ed="t-add|' + i + '">+ Titre après</button></div></section>';
      }).join("") + "</div>";
    return '<h2 class="section-h">Texte, article par article</h2><p class="cite-src">Les articles et les titres sont renumérotés automatiquement. Les renvois écrits dans le texte (« l\'article 12 ») ne le sont pas : vérifiez-les après avoir ajouté, supprimé ou déplacé un article.</p><div class="ed-layout">' + outline + body + "</div>";
  }
  // Vue d'ensemble avant soumission : récapitulatif, modifications mot à mot et document complet tel qu'il sera publié
  async function openSubmit() {
    if (!E.f.objet.trim()) { toast("Indiquez l'objet de la modification."); var o = $('[data-ef="objet"]'); if (o) o.focus(); return; }
    var axc = annexesChanges();
    if (!E.nouveau && curBody() === E.src.body && E.f.titre === E.src.titre && E.f.resume === E.src.resume && !axc.length) { toast("Aucune modification à soumettre."); return; }
    var nomsA = E.annexes.map(function (a) { return (a.nom || "").trim().toLowerCase(); });
    if (nomsA.some(function (n, k) { return !n || nomsA.indexOf(n) !== k; })) { toast("Chaque annexe doit avoir un nom court, unique dans le document."); E.onglet = "annexes"; renderEditor(); return; }
    if (E.annexes.some(function (a) { return !(a.titre || "").trim(); })) { toast("Chaque annexe doit avoir un titre."); E.onglet = "annexes"; renderEditor(); return; }
    // Renvois vers des annexes supprimées ou renommées, dans ce document et dans les autres
    var partis = (E.src.annexes || []).filter(function (o) { return !E.annexes.some(function (a) { return a.cle === o.cle; }); });
    var restes = partis.filter(function (o) { return renvoisVers(o.cle); }).map(function (o) { return "« " + o.nom + " »"; });
    var ailleurs = partis.filter(function (o) { return (o.cite_par || []).length; }).map(function (o) { return "« " + o.nom + " » (cité par " + o.cite_par.join(", ") + ")"; });
    if (E.nouveau && (!E.f.titre.trim() || !E.f.resume.trim() || !curBody().trim())) { toast("Titre, résumé et texte sont nécessaires pour créer le document."); return; }
    var ch = diffBodies(E.src.body, curBody());
    var c = { ajout: 0, modif: 0, retrait: 0 }; ch.forEach(function (x) { c[x.type]++; });
    var meta = (E.f.titre !== E.src.titre ? 1 : 0) + (E.f.resume !== E.src.resume ? 1 : 0);
    var st = docState(E.d), started = st.steps.some(function (x) { return x.sigs.length; });
    var complet = '<p class="cite-src">Aperçu indisponible.</p>';
    try { var mk = await loadLib("marked"); await chargerMedias(curBody()); complet = '<div class="eyebrow">' + esc(E.d.type) + " · " + esc(E.id) + " · v" + esc(nextVersion()) + '</div><h1 class="title" style="font-size:var(--fs-xl)">' + esc(E.f.titre) + '</h1><p class="lead">' + esc(E.f.resume) + '</p><div class="doc-body">' + mk.parse(avecMedias(nommer(curBody()))) + "</div>"; } catch (e) { /* aperçu indisponible */ }
    var ok = await confirmer({
      titre: (E.nouveau ? "Créer le document " : "Soumettre la modification de ") + E.id, large: true,
      html: "<dl><dt>Document</dt><dd><b>" + esc(E.id) + "</b> — " + esc(E.f.titre) + "</dd><dt>Objet</dt><dd>" + esc(E.f.objet) + "</dd><dt>Version</dt><dd>" + (enVigueur() ? esc(E.src.version) + " → " + esc(nextVersion()) + " (" + (E.f.nature === "mineure" ? "correction mineure" : "révision") + ")" : esc(E.src.version) + " (projet)") + "</dd></dl>",
      points: [E.nouveau ? c.ajout + " article(s) ou passage(s)." : c.modif + " passage" + (c.modif > 1 ? "s" : "") + " modifié" + (c.modif > 1 ? "s" : "") + ", " + c.ajout + " ajouté" + (c.ajout > 1 ? "s" : "") + ", " + c.retrait + " supprimé" + (c.retrait > 1 ? "s" : "") + (meta ? ", titre ou résumé modifié" : "") + ".",
        E.nouveau ? "Le document " + esc(E.id) + " est créé en projet (version 0.9), avec les informations saisies à sa création." : enVigueur() ? "La version " + esc(E.src.version) + " reste en vigueur jusqu'à l'adoption de la nouvelle." : "Le projet est remplacé par le texte modifié.",
        started ? "<b>Les visas déjà donnés sur le texte actuel tombent</b> : le circuit recommence au début." : "Le circuit d'approbation commence sur le nouveau texte.",
        "Vous ne pourrez viser aucune étape de cette version, puisque vous l'avez rédigée (règle des quatre yeux).",
        "La publication (texte, PDF, Word) prend quelques minutes."].concat(axc.length ? [axc.length + " annexe(s) ajoutée(s), modifiée(s) ou supprimée(s)."] : [],
        restes.length ? ["<b>Attention :</b> le texte renvoie encore à " + restes.join(", ") + ", qui n'existe plus sous ce nom."] : [],
        ailleurs.length ? ["<b>Autres documents qui renvoient à une annexe supprimée :</b> " + ailleurs.join(" ; ") + "."] : []),
      onglets: [{ titre: "Modifications", html: metaDiff() + diffHtml(ch) + annexesDiffHtml() }, { titre: "Document complet", html: complet }],
      phrase: (E.nouveau ? "créer " : "soumettre ") + E.id, bouton: E.nouveau ? "Créer et soumettre au circuit" : "Soumettre au circuit"
    });
    if (ok) submitDraft();
  }
  function autoGrow(root) { (root || document).querySelectorAll(".ed-card textarea, .ed-titre > textarea").forEach(function (t) { t.style.height = "auto"; t.style.height = Math.max(70, t.scrollHeight + 2) + "px"; }); }

  // ---------- Enregistrement ----------
  var saveTimer = null;
  function markDirty() { E.dirty = true; var s = $(".ed-state"); if (s) s.textContent = "Modifications non enregistrées…"; clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 1500); }
  async function saveDraft(statut) {
    if (!E) return;
    clearTimeout(saveTimer);
    var prev = draftOf(E.id);
    var body = { nouveau: E.nouveau || undefined, meta: E.meta || undefined, base: E.nouveau ? "nouveau" : E.draft && E.draft.base && !E.rebased ? E.draft.base : E.src.empreinte, version: E.src.version, statut: statut || "brouillon", mode: E.mode,
      nature: enVigueur() ? E.f.nature : null, objet: E.f.objet.trim(), titre: E.f.titre.trim(), resume: E.f.resume.trim(), body: curBody(),
      annexes: E.annexes.map(function (a) { return { cle: a.cle || "", tmp: a.tmp, nom: (a.nom || "").trim(), titre: a.titre || "", nature: a.nature || "", renseigne_par: a.renseigne_par || "", conserve_par: a.conserve_par || "", frequence: a.frequence || "", orientation: a.orientation || "", body: String(a.body || "").replace(/\s*$/, "\n") }; }),
      auteurs: ((prev && prev.auteurs) || []).concat(V.me).filter(function (x, i, a) { return x && a.indexOf(x) === i; }),
      cree_le: (prev && prev.cree_le) || new Date().toISOString(), maj: new Date().toISOString(), par: V.me };
    if (statut === "soumis") { body.soumis_le = body.maj; body.soumis_par = V.me; }
    try {
      await V.db.doc("redaction/" + E.id).set(body);
      E.draft = body; E.maj = body.maj; E.saved = body.maj; E.dirty = false; E.rebased = false;
      var s = $(".ed-state"); if (s && !statut) s.textContent = "Brouillon enregistré · " + (fmtDT(body.maj).split(/ à |, (?=\d\d:)/)[1] || "");
      return true;
    } catch (e) { toast("Enregistrement refusé : la modification est réservée aux Rédacteurs et à l'administrateur."); return false; }
  }
  async function submitDraft() {
    if (!(await saveDraft("soumis"))) return;
    if (HOSTED) { try { await fetch("/api/appliquer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ doc: E.id }) }); } catch (e) { /* la publication horaire prendra le relais */ } }
    toast("Modification soumise : publication en cours.");
    renderEditor();
  }

  // ---------- Événements ----------
  document.addEventListener("input", function (ev) {
    var t = ev.target; if (!E || !t.closest || !t.closest("#v-edition")) return;
    var x = t.getAttribute("data-ex");
    if (x) {
      var q = x.split("|"), an = E.annexes[+q[0]]; if (!an) return;
      if (q[1] === "orientation") return;
      if (q[1] === "nom" && an._nomAvant === undefined) an._nomAvant = an.nom;
      an[q[1]] = t.value;
      if (t.tagName === "TEXTAREA") { t.style.height = "auto"; t.style.height = Math.max(160, t.scrollHeight + 2) + "px"; }
      markDirty(); return;
    }
    var f = t.getAttribute("data-ef"), a = t.getAttribute("data-ea");
    if (f === "raw") { E.raw = t.value; E.model = parseBody(E.raw); }
    else if (f) E.f[f] = t.value;
    else if (a) {
      var p = a.split("|");
      if (p[0] === "pre") E.model.pre = t.value;
      else if (p[0] === "t") E.model.titres[+p[1]][p[2]] = t.value;
      else if (p[0] === "a") E.model.titres[+p[1]].articles[+p[2]][p[3]] = t.value;
      if (t.tagName === "TEXTAREA") { t.style.height = "auto"; t.style.height = Math.max(70, t.scrollHeight + 2) + "px"; }
    } else if (t.name === "ed-nat") return;
    else return;
    if (f === "titre") { var h = $("#v-edition h1.title"); if (h) h.textContent = t.value; }
    markDirty();
  });
  document.addEventListener("change", function (ev) {
    var t = ev.target; if (!E) return;
    if (t.name === "ed-nat") { E.f.nature = t.value; markDirty(); renderEditor(); return; }
    var x = t.getAttribute && t.getAttribute("data-ex"); if (!x) return;
    var q = x.split("|"), an = E.annexes[+q[0]]; if (!an) return;
    if (q[1] === "orientation") { an.orientation = t.checked ? "paysage" : ""; markDirty(); return; }
    if (q[1] === "nature") { an.nature = t.value; markDirty(); return; }
    if (q[1] === "nom") { delete an._nomAvant; an.nom = t.value.trim(); markDirty(); renderEditor(); }
  });
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-ed],[data-edit-doc],[data-ediff]"); if (!b) return;
    ev.preventDefault();
    if (b.hasAttribute("data-edit-doc")) { go("edition/" + b.getAttribute("data-edit-doc")); return; }
    if (b.hasAttribute("data-ediff")) { showRevisionDiff(b.getAttribute("data-ediff")); return; }
    if (!E) return;
    var p = b.getAttribute("data-ed").split("|"), m = E.model, i = +p[1], j = +p[2], T = m.titres;
    var sync = function () { E.raw = serialize(m); markDirty(); renderEditor(); };
    switch (p[0]) {
      case "mode": if (p[1] === "articles") { E.model = parseBody(E.raw); } else { E.raw = serialize(E.model); } E.mode = p[1]; renderEditor(); return;
      case "view": E.view = p[1]; renderEditor(); return;
      case "onglet": E.onglet = p[1]; renderEditor(); return;
      case "x-add":
        var nat = p[1] || "Note", tmp = "n" + Date.now();
        E.annexes.push({ cle: "", tmp: tmp, nom: "Nouvelle annexe", titre: "", nature: nat, renseigne_par: "", conserve_par: "", frequence: "", orientation: "", body: MODELES_ANNEXE[p[1]] || "" });
        E.ouvertes[tmp] = true; markDirty(); renderEditor();
        setTimeout(function () { var el = $("#ed-x" + (E.annexes.length - 1) + " .ed-xnom"); if (el) { el.focus(); el.select(); el.scrollIntoView({ block: "center" }); } }, 30);
        return;
      case "x-del":
        var ad = E.annexes[i], nr = renvoisVers(ad.cle);
        confirmer({ titre: "Supprimer l'annexe « " + ad.nom + " »", points: ["L'annexe sera retirée de la prochaine version du document ; les versions archivées la conservent.", nr ? "<b>" + nr + " renvoi(s)</b> vers cette annexe restent dans le texte : corrigez-les avant de soumettre." : "Aucun renvoi vers cette annexe dans ce document.", "Vérifiez aussi les autres documents qui y renvoient (signalés à la soumission)."], phrase: "supprimer l'annexe", bouton: "Supprimer l'annexe", danger: true })
          .then(function (ok) { if (!ok) return; E.annexes.splice(i, 1); markDirty(); renderEditor(); });
        return;
      case "x-up": if (i > 0) { var u = E.annexes[i]; E.annexes[i] = E.annexes[i - 1]; E.annexes[i - 1] = u; markDirty(); renderEditor(); } return;
      case "x-down": if (i < E.annexes.length - 1) { var w = E.annexes[i]; E.annexes[i] = E.annexes[i + 1]; E.annexes[i + 1] = w; markDirty(); renderEditor(); } return;
      case "x-ouvrir": var kk = cleAnnexe(E.annexes[i]); E.ouvertes[kk] = !E.ouvertes[kk]; renderEditor(); return;
      case "x-apercu":
        var bx = $("#ed-xp" + i); if (!bx) return;
        if (!bx.hidden) { bx.hidden = true; return; }
        loadLib("marked").then(function (mk) { bx.innerHTML = '<div class="doc-body">' + mk.parse(avecMedias(nommer(E.annexes[i].body || ""))) + "</div>"; bx.hidden = false; }).catch(function () { toast("Aperçu indisponible."); });
        return;
      case "soumettre": openSubmit(); return;
      case "soumettre-ok": submitDraft(); return;
      case "reprendre": saveDraft().then(renderEditor); return;
      case "recharger": E = null; openEditor(decodeURIComponent(location.hash.slice(9))); return;
      case "rebase":
        confirmer({ titre: "Repartir du texte publié", points: ["Les modifications de ce brouillon seront remplacées par le texte actuellement publié."], phrase: "repartir du texte publié", bouton: "Repartir du texte publié", danger: true }).then(function (ok) { if (!ok) return; E.model = parseBody(E.src.body); E.raw = E.src.body; E.f.titre = E.src.titre; E.f.resume = E.src.resume; E.stale = false; E.rebased = true; markDirty(); renderEditor(); });
        return;
      case "abandon":
        confirmer({ titre: "Abandonner le brouillon de " + E.id, points: ["Les modifications non soumises seront perdues.", "Le document publié n'est pas touché."], phrase: "abandonner " + E.id, bouton: "Abandonner le brouillon", danger: true }).then(function (ok) {
          if (!ok) return;
          V.db.doc("redaction/" + E.id).delete().then(function () { var id = E.id; E = null; toast("Brouillon abandonné."); go(id); }).catch(function () { toast("Opération refusée."); });
        });
        return;
      case "preview":
        var box = $("#ed-p" + i + "-" + j); if (!box) return;
        if (!box.hidden) { box.hidden = true; return; }
        loadLib("marked").then(function (mk) { box.innerHTML = '<div class="doc-body">' + mk.parse(avecMedias(nommer(m.titres[i].articles[j].body || ""))) + "</div>"; box.hidden = false; }).catch(function () { toast("Aperçu indisponible."); });
        return;
      case "a-add": T[i].articles.splice(j + 1, 0, { uid: uid(), titre: "Nouvel article", numbered: true, body: "" }); sync(); setTimeout(function () { var x = $("#ed-a" + i + "-" + (j + 1) + " input"); if (x) { x.focus(); x.select(); x.scrollIntoView({ block: "center" }); } }, 30); return;
      case "a-del": if ((T[i].articles[j].body || "").trim() && !confirm(window.PCI18N && PCI18N.lang === "en" ? "Delete the article “" + T[i].articles[j].titre + "”?" : "Supprimer l'article « " + T[i].articles[j].titre + " » ?")) return; T[i].articles.splice(j, 1); sync(); return;
      case "a-up": if (j > 0) { var x1 = T[i].articles[j]; T[i].articles[j] = T[i].articles[j - 1]; T[i].articles[j - 1] = x1; } else if (i > 0) { T[i - 1].articles.push(T[i].articles.shift()); } sync(); return;
      case "a-down": if (j < T[i].articles.length - 1) { var x2 = T[i].articles[j]; T[i].articles[j] = T[i].articles[j + 1]; T[i].articles[j + 1] = x2; } else if (i < T.length - 1) { T[i + 1].articles.unshift(T[i].articles.pop()); } sync(); return;
      case "t-add": T.splice(i + 1, 0, { uid: uid(), label: "Nouveau titre", numbered: true, pre: "", articles: [{ uid: uid(), titre: "Nouvel article", numbered: true, body: "" }] }); sync(); return;
      case "t-del": T.splice(i, 1); sync(); return;
      case "t-up": if (i > 0) { var y1 = T[i]; T[i] = T[i - 1]; T[i - 1] = y1; } sync(); return;
      case "t-down": if (i < T.length - 1) { var y2 = T[i]; T[i] = T[i + 1]; T[i + 1] = y2; } sync(); return;
    }
  });
  window.addEventListener("beforeunload", function (ev) { if (E && E.dirty) { saveDraft(); ev.preventDefault(); ev.returnValue = ""; } });

  // ---------- Images (importées d'un Word) ----------
  // Dans le brouillon, une image s'écrit ![légende](media:<empreinte>) ; son contenu est rangé à part (medias/<empreinte>)
  // et la publication l'enregistre dans le dossier du document (images/<empreinte>.<ext>).
  function hashTxt(t) { var h1 = 0x811c9dc5, h2 = 0; for (var i = 0; i < t.length; i++) { h1 ^= t.charCodeAt(i); h1 = Math.imul(h1, 16777619) >>> 0; h2 = (h2 * 31 + t.charCodeAt(i)) >>> 0; } return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0"); }
  async function chargerMedias(md) {
    var ids = (String(md || "").match(/media:[0-9a-f]{16}/g) || []).map(function (x) { return x.slice(6); }).filter(function (x, i, a) { return a.indexOf(x) === i && !(E.medias || {})[x]; });
    for (var i = 0; i < ids.length; i++) { try { var r = await V.db.doc("medias/" + ids[i]).get(); if (r.exists) E.medias[ids[i]] = r.data(); } catch (e) { /* image indisponible */ } }
  }
  function avecMedias(md) { return String(md || "").replace(/\(media:([0-9a-f]{16})\)/g, function (m, h) { var x = E && E.medias && E.medias[h]; return x ? "(data:" + x.type + ";base64," + x.data + ")" : m; }).replace(/\(images\/([^)\s]+)\)/g, function (m, f) { return "(img/" + E.id + "/" + f + ")"; }); }

  // ---------- Import d'un fichier Word ----------
  async function importerWord(file) {
    if (!E) return;
    if (!/\.docx$/i.test(file.name)) { toast("Choisissez un fichier Word (.docx)."); return; }
    toast("Lecture du fichier Word…");
    var mm, TD, G;
    try { mm = await loadLib("mammoth"); TD = await loadLib("turndown"); G = await loadLib("gfm"); } catch (e) { toast("Les outils de lecture des fichiers Word n'ont pas pu être chargés. Réessayez."); return; }
    var res = await mm.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, { styleMap: ["p[style-name='Title'] => p.titre-doc:fresh", "p[style-name='Titre'] => p.titre-doc:fresh"] });
    var div = document.createElement("div"); div.innerHTML = res.value;
    // On écarte la page de garde, la fiche de maîtrise et le sommaire : le texte commence après le repère, sinon au premier titre
    var kids = Array.prototype.slice.call(div.children), cut = -1;
    kids.forEach(function (k, i) { if (/Mettre à jour les champs|Rédigez le texte du document ci-dessous/i.test(k.textContent)) cut = i; });
    if (cut < 0) kids.forEach(function (k, i) { if (cut < 0 && /^H1$/.test(k.tagName)) cut = i - 1; });
    for (var i = 0; i <= cut; i++) kids[i].remove();
    div.querySelectorAll("p.titre-doc").forEach(function (p) { p.remove(); });
    // Cellules de tableau : une seule ligne de texte par cellule (sinon le tableau Markdown se casse)
    div.querySelectorAll("td, th").forEach(function (c) { var ps = c.querySelectorAll(":scope > p"); if (ps.length) c.innerHTML = Array.prototype.map.call(ps, function (p) { return p.innerHTML; }).join("<br>"); });
    var alertes = [];
    div.querySelectorAll("p").forEach(function (p) { if (/^\s*(Article\s+\d+|Titre\s+[IVXLC]+)\s*[—–-]/.test(p.textContent)) alertes.push("« " + p.textContent.trim().slice(0, 70) + " » ressemble à un titre ou à un article, mais n'a pas le style Word « Titre 1 » / « Titre 2 » : il reste un paragraphe."); });
    var td = new TD({ headingStyle: "atx", bulletListMarker: "-", emDelimiter: "*", strongDelimiter: "**" });
    td.use(G.gfm);
    var strip = function (t) { return t.replace(/^\s*(Titre\s+[IVXLC]+|Article\s+\d+)\s*[—–-]\s*/i, "").replace(/\s+/g, " ").trim(); };
    td.addRule("titres", { filter: ["h1"], replacement: function (c, n) { return "\n\n## Titre I — " + strip(n.textContent) + "\n\n"; } });
    td.addRule("articles", { filter: ["h2"], replacement: function (c, n) { return "\n\n### Article 1 — " + strip(n.textContent) + "\n\n"; } });
    td.addRule("sous-titres", { filter: ["h3", "h4"], replacement: function (c, n) { return "\n\n#### " + n.textContent.trim() + "\n\n"; } });
    var md = td.turndown(div.innerHTML);
    // Images : extraites du texte et rangées à part
    var nImg = 0, medias = {};
    md = md.replace(/\(data:(image\/[a-z+.-]+);base64,([A-Za-z0-9+/=]+)\)/g, function (m, type, data) { var h = hashTxt(data); medias[h] = { type: type, data: data }; nImg++; return "(media:" + h + ")"; });
    md = normaliserMd(md);
    var model = parseBody(md); md = serialize(model);
    var nTab = (div.querySelectorAll("table") || []).length;
    var ignore = (res.messages || []).filter(function (x) { return x.type === "warning"; }).length;
    var ok = await confirmer({
      titre: "Remplacer le texte par celui du fichier Word", large: true,
      html: "<dl><dt>Fichier</dt><dd>" + esc(file.name) + "</dd><dt>Contenu lu</dt><dd>" + model.titres.length + " titre(s), " + model.titres.reduce(function (n, t) { return n + t.articles.length; }, 0) + " article(s), " + nTab + " tableau(x), " + nImg + " image(s)</dd></dl>",
      points: ["Le texte du brouillon est remplacé par celui du fichier ; titres et articles sont renumérotés.", "Les commentaires et les modifications suivies de Word ne sont pas repris : acceptez-les dans Word avant l'import.", "Le titre et le résumé du document restent ceux des champs ci-dessus."].concat(alertes.slice(0, 8).map(function (a) { return "<b>À vérifier :</b> " + esc(a); })).concat(ignore ? ["<b>À vérifier :</b> " + ignore + " élément(s) de mise en forme n'ont pas pu être repris (couleurs, encadrés, styles inconnus)."] : []),
      onglets: [{ titre: "Modifications", html: diffHtml(diffBodies(E.src.body, md)) }],
      phrase: "importer le fichier", bouton: "Importer"
    });
    if (!ok) return;
    for (var h in medias) { try { await V.db.doc("medias/" + h).set({ type: medias[h].type, data: medias[h].data, doc: E.id, at: new Date().toISOString() }); E.medias[h] = medias[h]; } catch (e) { toast("Une image n'a pas pu être enregistrée."); } }
    E.raw = md; E.model = parseBody(md); E.mode = E.model.structured && !E.d.modele ? "articles" : "texte"; E.view = "diff";
    markDirty(); renderEditor();
    toast("Fichier Word importé : vérifiez les modifications, puis soumettez.");
  }
  document.addEventListener("change", function (ev) { if (ev.target && ev.target.id === "ed-word" && ev.target.files && ev.target.files[0]) { var f = ev.target.files[0]; ev.target.value = ""; importerWord(f); } });

  // Mise au propre du Markdown issu de Word, pour qu'un fichier exporté puis réimporté sans changement ne produise aucune différence
  function normaliserMd(md) {
    var lignes = md.replace(/\r/g, "").split("\n"), out = [], dansTable = false, sep = false;
    for (var i = 0; i < lignes.length; i++) {
      var l = lignes[i].replace(/^(\s*)([-*+])\s{2,}/, "$1- ").replace(/^(\s*)(\d+\.)\s{2,}/, "$1$2 ").replace(/\s+$/, "");
      if (/^\|/.test(l)) {
        var estSep = /^\|(\s*:?-{3,}:?\s*\|)+$/.test(l);
        if (!dansTable) { dansTable = true; sep = false; l = l.replace(/\*\*([^*|]+?)\*\*/g, "$1"); }
        else if (estSep) { if (sep) continue; sep = true; }
      } else dansTable = false;
      out.push(l);
    }
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  // ---------- Nouveau document ----------
  var FONCTIONS_TXT = ["Responsable de la conformité et du contrôle interne (RCCI)", "Directeur Général", "Conseil d'Administration", "Directeur Commercial", "Directeur des Marchés de Capitaux"];
  var SQUELETTE = "## Titre I — Dispositions générales\n\n### Article 1 — Objet\n\nCe que le document organise, en une ou deux phrases.\n\n### Article 2 — Champ d'application\n\nÀ qui et à quelles activités il s'applique.\n\n### Article 3 — Définitions\n\nLes termes employés renvoient au glossaire du référentiel.\n\n## Titre II — Règles\n\n### Article 4 — Principe\n\n…\n\n## Titre III — Dispositions finales\n\n### Article 5 — Entrée en vigueur\n\nLe présent document entre en vigueur à la date de son adoption, indiquée dans la fiche de maîtrise documentaire.\n";
  function renderNouveau() {
    var v = $("#v-nouveau"); if (!v) return;
    if (!canEdit()) { v.innerHTML = '<div class="eyebrow">Référentiel</div><h1 class="title">Nouveau document</h1><p class="lead">La création de documents est réservée aux Rédacteurs et à l\'administrateur.</p>'; return; }
    var types = (DATA.niveaux || []).filter(function (n) { return ["COD", "POL", "PRO"].indexOf(n.prefixe) >= 0; });
    var doms = docs.map(function (d) { return d.domaine; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; }).sort();
    var opt = function (l, def) { return l.map(function (x) { return "<option" + (x === def ? " selected" : "") + ">" + esc(x) + "</option>"; }).join(""); };
    v.innerHTML = '<button type="button" class="crumb" data-open="registre">← Registre des documents</button><div class="eyebrow">Référentiel</div><h1 class="title">Nouveau document</h1>' +
      '<p class="lead">Le document est créé en projet (version 0.9). Rédigez-le en ligne ou importez un Word ; à la soumission, il suit le circuit d\'approbation de son type, puis est adopté et publié comme les autres. <a href="#" data-dl="word/MODELE-VIERGE.docx">Télécharger le modèle Word vierge</a>.</p>' +
      '<form class="nvform" id="nv-form">' +
      '<label class="vf">Type<select name="type">' + types.map(function (n) { return '<option value="' + esc(n.type) + '" data-prefixe="' + esc(n.prefixe) + '">' + esc(n.type) + "</option>"; }).join("") + "</select></label>" +
      '<label class="vf">Code (2 à 4 lettres, ex. ESG)<input name="code" maxlength="4" pattern="[A-Za-z]{2,4}" required></label>' +
      '<label class="vf wide">Titre<input name="titre" maxlength="160" required></label>' +
      '<label class="vf wide">Résumé (affiché dans le registre)<textarea name="resume" rows="3" maxlength="800" required></textarea></label>' +
      '<label class="vf">Domaine<input name="domaine" list="nv-doms" required><datalist id="nv-doms">' + doms.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("") + "</datalist></label>" +
      '<label class="vf">Confidentialité<select name="confidentialite">' + opt(["Interne", "Public", "Confidentiel"], "Interne") + "</select></label>" +
      '<label class="vf">Propriétaire<select name="proprietaire">' + opt(FONCTIONS_TXT, FONCTIONS_TXT[0]) + "</select></label>" +
      '<label class="vf">Rédigé par<select name="redige_par">' + opt(FONCTIONS_TXT, FONCTIONS_TXT[0]) + "</select></label>" +
      '<label class="vf">Vérifié par<select name="verifie_par">' + opt(FONCTIONS_TXT, FONCTIONS_TXT[0]) + "</select></label>" +
      '<label class="vf">Approuvé par<select name="approuve_par">' + opt(FONCTIONS_TXT, "Directeur Général") + "</select></label>" +
      '<label class="vf">Diffusion<input name="diffusion" value="Tous les collaborateurs"></label>' +
      '<label class="vf">Prochaine revue<input name="prochaine_revue" value="12 mois après adoption"></label>' +
      '<fieldset class="vf wide"><legend>Point de départ</legend><label class="radio"><input type="radio" name="depart" value="ligne" checked> <span><b>Rédiger en ligne</b>, à partir d\'un plan type (titres et articles)</span></label><label class="radio"><input type="radio" name="depart" value="word"> <span><b>Importer un Word</b> rédigé à partir du modèle vierge</span></label></fieldset>' +
      '<div class="visa-btns wide"><button type="submit" class="btn primary">Créer le brouillon</button></div></form>';
  }
  document.addEventListener("submit", async function (ev) {
    if (ev.target.id !== "nv-form") return;
    ev.preventDefault();
    var f = ev.target, g = function (n) { return (f.elements[n].value || "").trim(); };
    var pre = f.elements.type.selectedOptions[0].getAttribute("data-prefixe"), code = g("code").toUpperCase();
    if (!/^[A-Z]{2,4}$/.test(code)) { toast("Le code doit compter 2 à 4 lettres."); return; }
    var n = 1, id; do { id = "PC-" + pre + "-" + code + "-" + String(n).padStart(3, "0"); n++; } while (docs.some(function (d) { return d.id === id; }) || V.redac[id]);
    var meta = { type: g("type"), titre: g("titre"), domaine: g("domaine"), confidentialite: g("confidentialite"), proprietaire: g("proprietaire"), redige_par: g("redige_par"), verifie_par: g("verifie_par"), approuve_par: g("approuve_par"), diffusion: g("diffusion"), prochaine_revue: g("prochaine_revue") };
    var word = f.elements.depart.value === "word";
    try {
      await V.db.doc("redaction/" + id).set({ nouveau: true, meta: meta, base: "nouveau", version: "0.9", statut: "brouillon", mode: "articles", nature: null, objet: "Création du document", titre: meta.titre, resume: g("resume"), body: word ? "" : SQUELETTE, auteurs: [V.me], cree_le: new Date().toISOString(), maj: new Date().toISOString(), par: V.me });
      V.redac[id] = { nouveau: true, meta: meta, statut: "brouillon", body: word ? "" : SQUELETTE, titre: meta.titre, resume: g("resume"), objet: "Création du document", base: "nouveau", auteurs: [V.me], maj: new Date().toISOString(), par: V.me };
      toast("Brouillon créé : " + id + ".");
      if (word) IMPORT_APRES = true;
      go("edition/" + id);
    } catch (e) { toast("Création refusée : réservée aux Rédacteurs et à l'administrateur."); }
  });

  // ---------- Sur la page d'un document ----------
  function renderDocEdit(d) {
    var box = $("#doc-edit"); if (!box) return;
    var dr = draftOf(d.id), w = workOf(d.id);
    var html = "";
    if (dr) html += '<div class="rev-banner proj"><b>' + (dr.statut === "soumis" ? "Modification soumise" : dr.statut === "conflit" ? "Publication refusée" : "Brouillon de modification en cours") + "</b> par " + esc((dr.auteurs || [dr.par]).map(vName).join(", ")) + " — " + esc(fmtDT(dr.maj)) + (dr.objet ? " : « " + esc(dr.objet) + " »" : "") + (canEdit() ? ' <button type="button" class="doclink" data-edit-doc="' + esc(d.id) + '">Ouvrir le brouillon</button>' : "") + "</div>";
    var btns = "";
    if (canEdit() && !etatOf(d.id) && !dr) btns += '<button type="button" class="btn" data-edit-doc="' + esc(d.id) + '">✎ Modifier le texte</button>';
    if (d.estProjet) btns += '<button type="button" class="btn" data-ediff="' + esc(d.id) + '">Voir les modifications par rapport à la version en vigueur</button>';
    if (btns) html += '<div class="doc-edit-btns">' + btns + (canEdit() && w !== d && !d.estProjet && !dr ? '<span class="cite-src">La modification porte sur le projet de révision v' + esc(w.version) + ".</span>" : "") + "</div>";
    html += '<div id="doc-diff"></div>';
    box.innerHTML = html;
  }
  async function showRevisionDiff(id) {
    var box = $("#doc-diff"); if (!box) return;
    if (box.innerHTML) { box.innerHTML = ""; return; }
    box.innerHTML = '<p class="cite-src">Comparaison en cours…</p>';
    try {
      var a = await fetchSource(id, true), b = await fetchSource(id);
      box.innerHTML = '<div class="diffbox"><h3>Modifications de la v' + esc(b.version) + " par rapport à la v" + esc(a.version) + " en vigueur</h3>" + diffHtml(diffBodies(a.body, b.body)) + "</div>";
    } catch (e) { box.innerHTML = '<p class="cite-src">La comparaison n\'est pas disponible dans cette vue.</p>'; }
  }

  // Brouillons de la personne, pour « À traiter »
  function myDraftsHtml() {
    if (!canEdit()) return "";
    var mine = Object.keys(V.redac || {}).map(function (id) { return { id: id, r: draftOf(id) }; }).filter(function (x) { return x.r; });
    var ren = VARIANTS().filter(function (d) { return !etatOf(d.id) && docState(d).renvois.length && !draftOf(d.id); });
    if (!mine.length && !ren.length) return "";
    var li = function (id, sub, btn) { var d = workOf(id); return '<li class="tt-item"><div class="tt-main"><div class="tt-ref">' + esc(id) + (d ? "" : ' <span class="pill projet">nouveau</span>') + '</div><div class="tt-title">' + esc(d ? d.titre : (V.redac[id] && V.redac[id].titre) || id) + '</div><div class="cite-src">' + sub + '</div></div><button type="button" class="btn' + (btn === "Corriger" ? " primary" : "") + '" data-edit-doc="' + esc(id) + '">' + btn + "</button></li>"; };
    return '<h2 class="section-h">Rédaction <span class="count-chip">' + (mine.length + ren.length) + "</span></h2>" +
      '<ul class="tt-list">' + ren.map(function (d) { var r = docState(d).renvois[0]; return li(d.id, "Renvoyé par " + esc(vName(r.by)) + " : « " + esc(r.commentaire || "") + " »", "Corriger"); }).join("") +
      mine.map(function (x) { return li(x.id, (x.r.statut === "soumis" ? "Soumis le " + esc(fmtDT(x.r.soumis_le)) + ", publication en cours" : x.r.statut === "conflit" ? "Publication refusée : " + esc(x.r.message || "") : "Brouillon · " + esc(fmtDT(x.r.maj))) + (x.r.objet ? " · « " + esc(x.r.objet) + " »" : ""), "Ouvrir"); }).join("") + "</ul>";
  }
