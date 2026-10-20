  // ---------- Guide : page écrite et visite animée, adaptées aux accès de la personne connectée ----------
  var INTRO = "Le référentiel documentaire réunit, en un seul endroit, les codes, politiques, procédures et modèles de contrat de Purpose Capital. " +
    "Chaque texte y suit un circuit d'approbation tracé : il est rédigé, vérifié, approuvé puis adopté par les personnes désignées, chacune par un visa électronique daté. " +
    "Une fois en vigueur, il est porté à la connaissance des collaborateurs concernés, qui attestent l'avoir lu. " +
    "Vous y trouvez toujours la version applicable, son historique et la preuve de son adoption, en ligne, en PDF et en Word.";
  function profilGuide() {
    var r = (V.me && V.roles[V.me]) || {}, f = r.fonctions || [];
    var appro = f.filter(function (x) { return ["pca", "adm", "dg", "rcci", "dcom", "dmc"].indexOf(x) >= 0; });
    return {
      employe: RESTREINT, complet: !RESTREINT, approbateur: !RESTREINT && appro.length > 0, fonctions: appro,
      redacteur: !RESTREINT && canEdit(), tableau: !RESTREINT && accesTableau(), admin: !RESTREINT && !!V.owner,
      superAdmin: !RESTREINT && !!V.owner && (!HOSTED || estSuper()), circuits: peut("circuits"), lectures: peut("lectures"), archiver: canArchive(),
    };
  }
  // Étapes de la visite : cible (sélecteur), vue à ouvrir, condition d'affichage
  var ETAPES = [
    { titre: "Bienvenue dans le référentiel", texte: INTRO },
    { sel: "#rail-me", titre: "Votre carte", texte: "Votre nom, vos fonctions et ce qui vous attend. Les compteurs ouvrent directement la liste de vos actions." },
    { si: "employe", vue: "mesdocs", sel: '.nav [data-open="mesdocs"]', titre: "Mes documents", texte: "Les documents que l'on vous a attribués, et rien d'autre. Un badge indique le nombre de lectures à attester." },
    { si: "employe", vue: "mesdocs", sel: "#v-mesdocs .md-list, #v-mesdocs", titre: "Lire et attester", texte: "Ouvrez un document, lisez-le jusqu'au bout, puis attestez votre lecture en bas de page. Votre attestation est datée et conservée au registre." },
    { si: "approbateur", vue: "atraiter", sel: '.nav [data-open="atraiter"]', titre: "À traiter", texte: "Votre point d'entrée : les documents qui attendent votre visa, dans l'ordre du circuit. Un badge rouge compte vos actions." },
    { si: "approbateur", vue: "atraiter", sel: "#v-atraiter .tt-list, #v-atraiter", titre: "Examiner, viser ou renvoyer", texte: "Ouvrez un document : la barre en haut propose de viser, ou de renvoyer avec un commentaire. Chaque visa demande d'écrire l'action pour éviter les erreurs. Une même personne ne vise pas deux étapes d'une même version (règle des quatre yeux)." },
    { si: "complet", vue: "registre", sel: '.nav [data-open="registre"]', titre: "Documents", texte: "Le registre de tous les textes, avec leur statut, leur version et leur prochaine revue." },
    { si: "complet", vue: "registre", sel: "#f-q", titre: "Rechercher et filtrer", texte: "Cherchez par mot, filtrez par type, domaine ou statut. Cliquez une ligne pour un aperçu ; ouvrez le document pour le texte complet, le PDF ou le Word." },
    { si: "redacteur", vue: "registre", sel: "#btn-nouveau", titre: "Rédiger", texte: "Créez un document, ou ouvrez un document existant et choisissez « Modifier ». Vous pouvez aussi repartir d'un fichier Word. Une fois soumis, le texte est publié automatiquement et repart dans son circuit ; vous ne pouvez pas viser votre propre version." },
    { si: "complet", sel: '.nav [data-open="visas"]', titre: "Suivi des visas", texte: "Qui a visé quoi et quand, document par document, et l'état des lectures obligatoires." },
    { si: "complet", sel: '.nav [data-open="circuit"]', titre: "Circuit d'approbation", texte: "Où en est chaque document et qui doit agir." + "" },
    { si: "circuits", vue: "circuit", sel: "#v-circuit .section-h ~ .lead, #v-circuit", titre: "Modifier les circuits", texte: "Par type de document : étapes, fonctions, règles de visa et délais. Une version déjà visée garde le circuit de son premier visa." },
    { si: "tableau", sel: '.nav [data-open="tableau"]', titre: "Tableau de bord", texte: "La vue d'ensemble : visas en attente et retards, alertes, charge par personne, modifications en cours, lectures et revues." },
    { si: "admin", sel: "#nav-membres", titre: "Membres", texte: "Ouvrir un accès, modifier les fonctions, suspendre, attribuer les documents aux employés — dans la limite de vos prérogatives." },
    { si: "superAdmin", sel: "#nav-parametrage", titre: "Paramétrage", texte: "Réservé au super administrateur : administrateurs et prérogatives, règles, journal complet." },
    { si: "complet", sel: "#rail-fold", titre: "Replier le menu", texte: "Ce bouton masque le menu pour lire en pleine largeur. Approchez la souris du bord gauche pour le faire réapparaître." },
    { sel: '.nav [data-open="guide"]', titre: "Retrouver ce guide", texte: "Le guide écrit et cette visite restent accessibles ici à tout moment." },
  ];
  var G = null;
  var visible = function (el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; };
  function cible(sel) { if (!sel) return null; var l = sel.split(", "); for (var i = 0; i < l.length; i++) { var el = document.querySelector(l[i]); if (visible(el) || (el && el.closest(".rail"))) return el; } return null; }
  function visite(filtre) {
    var p = profilGuide();
    var etapes = ETAPES.filter(function (e) { return (!e.si || p[e.si]) && (!filtre || filtre(e)); });
    if (!etapes.length) return;
    fermerVisite();
    var el = document.createElement("div"); el.className = "gt";
    el.innerHTML = '<div class="gt-block"></div><div class="gt-spot"></div><div class="gt-card" role="dialog" aria-live="polite" aria-labelledby="gt-t"><div class="gt-prog"></div><h3 id="gt-t"></h3><p class="gt-txt"></p><div class="gt-btns"><button type="button" class="btn" data-gt="prev">Précédent</button><button type="button" class="btn primary" data-gt="next">Suivant</button><button type="button" class="gt-skip" data-gt="fin">Quitter la visite</button></div></div>';
    document.body.appendChild(el);
    G = { el: el, etapes: etapes, i: 0, retour: location.hash };
    el.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-gt]"); if (!b) return;
      var a = b.getAttribute("data-gt");
      if (a === "next") { if (G.i < G.etapes.length - 1) montrer(G.i + 1); else fermerVisite(true); }
      if (a === "prev" && G.i > 0) montrer(G.i - 1);
      if (a === "fin") fermerVisite(true);
    });
    montrer(0);
  }
  function montrer(i, sens) {
    if (!G) return;
    sens = sens || (i >= G.i ? 1 : -1);
    G.i = i; var e = G.etapes[i], el = G.el;
    var suite = function () {
      if (!G) return;
      var t = cible(e.sel), mobile = window.innerWidth <= 860;
      // Élément absent (accès, écran) : on passe à l'étape suivante plutôt que d'afficher une bulle dans le vide
      if (e.sel && !t && !e.vue) { var j = i + sens; if (j >= 0 && j < G.etapes.length) { G.etapes.splice(i, 1); montrer(sens > 0 ? i : j, sens); } else if (G.etapes.length > 1) { G.etapes.splice(i, 1); montrer(Math.max(0, i - 1), -1); } return; }
      var dansRail = t && t.closest && t.closest(".rail");
      document.body.classList.toggle("rail-peek", !!(dansRail && document.body.classList.contains("rail-folded")));
      if (mobile) railMobile(!!dansRail);
      var spot = el.querySelector(".gt-spot"), card = el.querySelector(".gt-card");
      el.querySelector("#gt-t").textContent = e.titre;
      el.querySelector(".gt-txt").textContent = e.texte;
      el.querySelector(".gt-prog").innerHTML = G.etapes.map(function (x, k) { return "<i" + (k === i ? ' class="on"' : k < i ? ' class="vu"' : "") + "></i>"; }).join("") + "<span>" + (i + 1) + " / " + G.etapes.length + "</span>";
      el.querySelector('[data-gt="prev"]').hidden = i === 0;
      el.querySelector('[data-gt="next"]').textContent = i === G.etapes.length - 1 ? "Terminer" : "Suivant";
      card.classList.remove("in"); void card.offsetWidth; card.classList.add("in");
      setTimeout(function () {
        if (!G) return;
        var W = window.innerWidth, H = window.innerHeight, cw = Math.min(360, W - 32);
        card.style.width = cw + "px";
        if (!t) { spot.style.cssText = "left:" + W / 2 + "px;top:" + H / 2 + "px;width:0;height:0;opacity:0"; card.style.left = (W - cw) / 2 + "px"; card.style.top = Math.max(16, H / 2 - card.offsetHeight / 2) + "px"; return; }
        if (!dansRail) t.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(function () {
          if (!G) return;
          var r = t.getBoundingClientRect(), m = 6, ch = card.offsetHeight;
          var h = Math.min(r.height + 2 * m, H * 0.6);
          spot.style.cssText = "left:" + (r.left - m) + "px;top:" + (r.top - m) + "px;width:" + (r.width + 2 * m) + "px;height:" + h + "px;opacity:1";
          var x, y;
          if (r.right + 16 + cw < W && r.width < W / 2) { x = r.right + 16; y = Math.min(Math.max(16, r.top + r.height / 2 - ch / 2), H - ch - 16); }
          else { x = Math.min(Math.max(16, r.left), W - cw - 16); y = r.top - m + h + 14 + ch < H ? r.top - m + h + 14 : Math.max(16, r.top - ch - 20); }
          card.style.left = x + "px"; card.style.top = y + "px";
        }, dansRail ? 220 : 380);
      }, 30);
    };
    if (e.vue && location.hash.slice(1) !== e.vue && !(e.vue === "registre" && !location.hash.slice(1))) { go(e.vue); setTimeout(suite, 300); } else suite();
  }
  function fermerVisite(fini) {
    if (!G) return;
    G.el.remove(); document.body.classList.remove("rail-peek"); if (window.innerWidth <= 860) railMobile(false);
    var retour = G.retour; G = null;
    if (fini) { try { localStorage.setItem("pc-ref-guide-vu-" + (V.me || ""), "1"); } catch (e) { /* stockage indisponible */ } if (location.hash !== retour && retour !== undefined) location.hash = retour || ""; }
  }
  document.addEventListener("keydown", function (ev) {
    if (!G) return;
    if (ev.key === "Escape") fermerVisite(true);
    if (ev.key === "ArrowRight" || ev.key === "Enter") { ev.preventDefault(); G.el.querySelector('[data-gt="next"]').click(); }
    if (ev.key === "ArrowLeft" && G.i > 0) montrer(G.i - 1);
  });
  window.addEventListener("resize", function () { if (G) montrer(G.i); });

  // Page « Guide » : le mode d'emploi écrit, limité à ce que la personne peut faire
  var SECTIONS = [
    { si: "employe", id: "lire", titre: "Lire et attester vos documents", etapes: [
      "Ouvrez « Mes documents » : seuls les textes qui vous ont été attribués y figurent.",
      "Ouvrez un document à lire et lisez-le jusqu'au bout. Le PDF et le Word sont disponibles en haut de page.",
      "En bas du document, attestez votre lecture. L'attestation est datée et conservée ; elle vaut engagement à respecter le texte.",
      "Quand une nouvelle version entre en vigueur, il vous est demandé de la lire à nouveau."], visite: function (e) { return e.si === "employe" || !e.sel || e.sel === "#rail-me"; } },
    { si: "complet", id: "lire-complet", titre: "Prendre connaissance d'un document", etapes: [
      "Quand un document qui vous concerne entre en vigueur, il apparaît dans « À traiter », rubrique « À lire ».",
      "Lisez-le, puis attestez votre lecture en bas de page. L'attestation est datée et conservée au registre.",
      "Une nouvelle version vous est de nouveau proposée à la lecture."], visite: function (e) { return /atraiter/.test(e.sel || "") && !/viser/i.test(e.titre); } },
    { si: "complet", id: "consulter", titre: "Trouver et consulter un document", etapes: [
      "« Documents » présente le registre : statut, version, prochaine revue. Cliquez un en-tête de colonne pour trier.",
      "Cherchez par mot-clé, filtrez par type, domaine ou statut. Cliquez une ligne pour un aperçu rapide.",
      "La page du document donne le texte applicable, la fiche de maîtrise (circuit, visas, historique) et les téléchargements PDF et Word.",
      "« Textes de référence » relie chaque document aux textes CEMAC/COSUMAF ; le « Glossaire » définit les termes."], visite: function (e) { return /registre|f-q/.test(e.sel || "") || e.vue === "registre" && !e.si; } },
    { si: "approbateur", id: "viser", titre: "Viser, approuver ou renvoyer", etapes: [
      "« À traiter » liste les documents qui attendent votre visa, dans l'ordre du circuit.",
      "Ouvrez le document : la barre en haut indique l'étape et ce qui est attendu de vous.",
      "Pour viser, cliquez le bouton puis écrivez l'action demandée (double validation). Pour renvoyer, indiquez ce qui doit être corrigé : le document repart en rédaction.",
      "Les étapes se visent dans l'ordre ; une même personne ne vise pas deux étapes d'une même version (règle des quatre yeux).",
      "Quand la dernière étape est visée, le document est adopté et publié automatiquement."], visite: function (e) { return e.si === "approbateur"; } },
    { si: "complet", id: "suivre", titre: "Suivre les circuits", etapes: [
      "« Circuit d'approbation » montre où en est chaque document et qui doit agir.",
      "« Suivi des visas » donne, document par document, les visas obtenus et les lectures attestées.",
      "« Archives » conserve les documents abrogés et les versions antérieures."], visite: function (e) { return /visas|circuit/.test(e.sel || ""); } },
    { si: "redacteur", id: "rediger", titre: "Rédiger et modifier", etapes: [
      "Sur la page d'un document, « Modifier » ouvre l'éditeur : article par article, ou le texte complet.",
      "Vous pouvez repartir d'un Word : téléchargez le document en Word, modifiez-le, puis importez-le. Titres, articles, listes, tableaux et images sont repris.",
      "Votre brouillon est enregistré au fur et à mesure. Avant soumission, la vue d'ensemble montre toutes les modifications.",
      "Une fois soumis, le texte est publié automatiquement et repart dans son circuit. Vous ne pouvez pas viser une version que vous avez rédigée.",
      "« + Nouveau document » crée un texte à partir d'un modèle vierge."], visite: function (e) { return e.si === "redacteur"; } },
    { si: "tableau", id: "tableau", titre: "Le tableau de bord", etapes: [
      "Six indicateurs : documents, visas en attente, renvois, lectures, modifications, revues échues.",
      "« En attente d'une action » classe les visas par ancienneté ; en rouge au-delà du délai fixé. « Relancer » prépare un message à envoyer vous-même.",
      "Filtrez par période, type, domaine ou personne ; exportez en CSV ou imprimez."], visite: function (e) { return e.si === "tableau"; } },
    { si: "admin", id: "administrer", titre: "Administrer", etapes: [
      "« Membres » : ouvrir un accès, modifier une fiche (nom, poste, fonctions, accès), suspendre, attribuer les documents aux employés.",
      "Vous agissez dans la limite des prérogatives que le super administrateur vous a données ; vous ne modifiez ni votre propre accès ni celui d'un autre administrateur.",
      "« Suivi des visas » : lectures obligatoires par document et export du registre des visas.",
      "« Circuit d'approbation » : modification des circuits et des délais (si vous en avez la prérogative)."], visite: function (e) { return e.si === "admin" || e.si === "circuits" || e.si === "superAdmin"; } },
    { si: "superAdmin", id: "parametrer", titre: "Paramétrer (super administrateur)", etapes: [
      "« Paramétrage » : nommer les administrateurs et choisir leurs prérogatives.",
      "Les règles sont appliquées par la base : on ne donne que ce que l'on détient, personne ne se dispense d'une lecture obligatoire, il reste toujours un super administrateur.",
      "Le journal complet retrace toutes les opérations ; il ne peut être modifié depuis le site."], visite: function (e) { return e.si === "superAdmin"; } },
  ];
  function renderGuide() {
    var v = $("#v-guide"); if (!v) return;
    var p = profilGuide();
    var qui = p.employe ? "Collaborateur — accès aux documents attribués" : [p.superAdmin ? "Super administrateur" : p.admin ? "Administrateur" : "", p.fonctions.map(function (f) { return FLABEL[f] || f; }).join(", "), p.redacteur ? "Rédacteur" : ""].filter(Boolean).join(" · ") || "Accès complet en consultation";
    var secs = SECTIONS.filter(function (s) { return p[s.si]; });
    v.innerHTML = '<div class="eyebrow">Mode d\'emploi</div><h1 class="title">Guide du référentiel</h1>' +
      '<p class="lead">' + esc(INTRO) + "</p>" +
      '<div class="gd-hero"><div><b>Votre profil</b><span>' + esc(qui) + '</span><small>Ce guide ne présente que ce que vos accès vous permettent de faire.</small></div><button type="button" class="btn primary" data-gvis="">▶ Lancer la visite guidée</button></div>' +
      '<nav class="gd-som" aria-label="Sommaire du guide">' + secs.map(function (s, k) { return '<a href="#guide" data-gsec="' + s.id + '"><span>' + (k + 1) + "</span>" + esc(s.titre) + "</a>"; }).join("") + "</nav>" +
      secs.map(function (s, k) {
        return '<section class="gd-sec" id="gd-' + s.id + '"><header><span class="gd-n">' + (k + 1) + "</span><h2>" + esc(s.titre) + '</h2><button type="button" class="btn" data-gvis="' + s.id + '">▶ Montrer</button></header><ol class="gd-steps">' +
          s.etapes.map(function (t, j) { return '<li style="--d:' + j * 70 + 'ms">' + esc(t) + "</li>"; }).join("") + "</ol></section>";
      }).join("") +
      '<p class="cite-src">Une question sur un texte ? Adressez-vous au RCCI. Un problème d\'accès ? À un administrateur.</p>';
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-gvis],[data-gsec],[data-guide]"); if (!b) return;
    ev.preventDefault();
    if (b.hasAttribute("data-guide")) { go("guide"); return; }
    if (b.hasAttribute("data-gsec")) { var s = document.getElementById("gd-" + b.getAttribute("data-gsec")); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    var id = b.getAttribute("data-gvis"), sec = SECTIONS.filter(function (s) { return s.id === id; })[0];
    visite(sec ? sec.visite : null);
  });
  // Première connexion : proposer la visite (une fois par personne et par navigateur)
  (function inviter(n) {
    if (n > 60) return;
    if (!V.ready || !V.me || G) { setTimeout(function () { inviter(n + 1); }, 1000); return; }
    var k = "pc-ref-guide-vu-" + V.me, vu = false;
    try { vu = !!localStorage.getItem(k); } catch (e) { vu = true; }
    if (vu) return;
    var el = document.createElement("div"); el.className = "gt-invite"; el.setAttribute("role", "dialog");
    el.innerHTML = "<b>Première visite ?</b><span>Découvrez le référentiel en une minute, selon vos accès.</span><div><button type=\"button\" class=\"btn primary\" data-gi=\"go\">Lancer la visite</button><button type=\"button\" class=\"btn\" data-gi=\"non\">Plus tard</button></div>";
    document.body.appendChild(el);
    el.addEventListener("click", function (ev) {
      var a = ev.target.closest("[data-gi]"); if (!a) return;
      try { localStorage.setItem(k, "1"); } catch (e) { /* stockage indisponible */ }
      el.remove();
      if (a.getAttribute("data-gi") === "go") visite();
    });
  })(0);
