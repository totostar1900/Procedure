/* Langue de l'interface (FR / EN).
   Le site est écrit en français ; en anglais, chaque texte affiché (nœuds de texte, info-bulles, libellés
   d'accessibilité, textes indicatifs) est remplacé à la volée à partir d'un dictionnaire, complété de motifs
   pour les phrases qui contiennent des valeurs (nombres, dates, noms). Le contenu des documents n'est jamais
   traduit ici : il a sa propre version anglaise (zones marquées data-i18n="no" ou .doc-body).
   Utilisé par la page du référentiel (en ligne dans <head>) et par les pages d'administration (/i18n.js). */
(function () {
  var D = /*I18N_DICT*/{};
  var P = /*I18N_PATTERNS*/[];
  var KEY = "pc-ref-lang";
  var lang = "fr";
  try { lang = localStorage.getItem(KEY) === "en" ? "en" : "fr"; } catch (e) { /* stockage indisponible */ }
  var RX = P.map(function (p) { return [new RegExp("^" + p[0] + "$"), p[1]]; });
  var cache = Object.create(null);
  var norm = function (s) { return String(s).replace(/[\s  ]+/g, " ").trim(); };

  // Traduit une chaîne : dictionnaire, puis motifs (les parties variables sont traduites à leur tour), puis ponctuation
  function tr(s, profondeur) {
    if (lang !== "en" || s == null) return s;
    var k = norm(s); if (!k) return s;
    if (Object.prototype.hasOwnProperty.call(D, k)) return D[k];
    if (k in cache) return cache[k];
    profondeur = (profondeur || 0) + 1;
    var r = null;
    if (profondeur < 6) {
      for (var i = 0; i < RX.length && r === null; i++) {
        var m = k.match(RX[i][0]);
        if (m) r = RX[i][1].replace(/\$(\d)/g, function (_, n) { var g = m[+n]; return g == null ? "" : tr(g, profondeur); });
      }
      if (r === null) {
        // Ponctuation et guillemets autour d'un texte connu
        var a = k.match(/^(.*?)\s*([:;,.…!?])$/);
        if (a && a[1] && D[a[1]] !== undefined) r = D[a[1]] + (a[2] === "…" ? "…" : a[2]);
        var q = !r && k.match(/^«\s*(.+?)\s*»$/);
        if (q) { var t = tr(q[1], profondeur); if (t !== q[1]) r = "“" + t + "”"; }
        var pa = !r && k.match(/^\((.+)\)$/);
        if (pa) { var t2 = tr(pa[1], profondeur); if (t2 !== pa[1]) r = "(" + t2 + ")"; }
        var sep = !r && k.match(/^(.+?) · (.+)$/);
        if (sep) { var x = tr(sep[1], profondeur), y = tr(sep[2], profondeur); if (x !== sep[1] || y !== sep[2]) r = x + " · " + y; }
      }
    }
    if (r === null) r = k === norm(s) ? s : k;
    cache[k] = r;
    return r;
  }
  // Texte : on garde les espaces de début et de fin du nœud d'origine
  function trTexte(v) {
    var k = norm(v); if (!k || !/[A-Za-zÀ-ÿ]/.test(k)) return v;
    var t = tr(k); if (t === k) return v;
    var a = v.match(/^\s*/)[0], b = v.match(/\s*$/)[0];
    return a + t + b;
  }
  var SKIP = '[data-i18n="no"], .doc-body, script, style, textarea, code, pre, .ed-src';
  var fait = new WeakMap();
  var ATTRS = ["placeholder", "title", "aria-label", "alt"];
  function exclu(el) { return !el || (el.closest && el.closest(SKIP)); }
  function texte(n) {
    if (fait.get(n) === n.nodeValue) return;
    if (exclu(n.parentElement)) return;
    var v = trTexte(n.nodeValue);
    if (v !== n.nodeValue) n.nodeValue = v;
    fait.set(n, n.nodeValue);
  }
  function attrs(el) {
    if (exclu(el)) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute(a);
      if (v && /[A-Za-zÀ-ÿ]/.test(v)) { var t = trTexte(v); if (t !== v) el.setAttribute(a, t); }
    }
    if (el.tagName === "INPUT" && (el.type === "button" || el.type === "submit") && el.value) { var tv = trTexte(el.value); if (tv !== el.value) el.value = tv; }
  }
  function arbre(root) {
    if (!root) return;
    if (root.nodeType === 3) { texte(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (exclu(root)) return; attrs(root); }
    var w = document.createTreeWalker(root, 5, { acceptNode: function (n) { return n.nodeType === 1 && n.matches(SKIP) ? 2 : 1; } });
    var n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) texte(n); else attrs(n); }
  }
  var obs = null, titre = null;
  function demarrer() {
    if (lang !== "en" || obs) return;
    obs = new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        if (r.type === "childList") for (var j = 0; j < r.addedNodes.length; j++) arbre(r.addedNodes[j]);
        else if (r.type === "characterData") texte(r.target);
        else if (r.type === "attributes") { var v = r.target.getAttribute(r.attributeName); if (v) { var t = exclu(r.target) ? v : trTexte(v); if (t !== v) r.target.setAttribute(r.attributeName, t); } }
      }
      if (document.title !== titre) { titre = trTexte(document.title); if (titre !== document.title) document.title = titre; }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    arbre(document.documentElement);
  }
  function choisir(l) {
    try { localStorage.setItem(KEY, l === "en" ? "en" : "fr"); } catch (e) { /* stockage indisponible */ }
    location.reload();
  }
  // Sélecteur : tout élément [data-lang] bascule la langue
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-lang]"); if (!b) return;
    ev.preventDefault(); if (b.getAttribute("data-lang") !== lang) choisir(b.getAttribute("data-lang"));
  });
  function marquer() { document.querySelectorAll("[data-lang]").forEach(function (b) { var on = b.getAttribute("data-lang") === lang; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); }); }
  document.documentElement.lang = lang;
  if (lang === "en") {
    document.documentElement.classList.add("i18n-attente");
    demarrer();
    var fin = function () { arbre(document.documentElement); marquer(); document.documentElement.classList.remove("i18n-attente"); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fin); else fin();
    setTimeout(function () { document.documentElement.classList.remove("i18n-attente"); }, 1500);
  } else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", marquer); else marquer();
  window.PCI18N = {
    lang: lang, t: tr, locale: lang === "en" ? "en-GB" : "fr-FR", choisir: choisir, marquer: marquer,
    // Phrase de double validation : la personne peut écrire la phrase affichée (traduite) ou l'originale
    phrases: function (p) { return lang === "en" ? [p, tr(p)] : [p]; },
  };
})();
