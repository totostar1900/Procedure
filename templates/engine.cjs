/* Moteur de modèles du référentiel Purpose Capital.
   Partagé par le générateur de site (Node) et la page (navigateur).

   Syntaxe dans les modèles Markdown :
     {{champ}}               valeur formatée selon le type du champ
     {{champ|lettres}}       montant : « un million de francs CFA (1 000 000 FCFA) »
     {{champ|nombre}}        entier : « trente (30) »
     {{societe.cle}}         constante de la société (referentiel.yaml)
     {% si champ = valeur %} … {% fin %}     bloc ou passage conditionnel
     {% si champ != valeur %} … {% fin %}
     @signatures(Titre A | sous-titre A ; Titre B | sous-titre B)

   Modes de rendu :
     "modele"  zones à compléter surlignées, variantes signalées (modèle imprimable)
     "apercu"  valeurs saisies ; champs manquants surlignés
     "rempli"  valeurs saisies uniquement (Word et PDF générés)
*/
(function (root) {
  "use strict";

  // ---------- Nombres en lettres (orthographe traditionnelle) ----------
  var U = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
    "onze", "douze", "treize", "quatorze", "quinze", "seize"];
  var D = { 2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante" };
  function lt100(n, final) {
    if (n <= 16) return U[n];
    if (n < 20) return "dix-" + U[n - 10];
    var d = Math.floor(n / 10), u = n % 10;
    if (d === 7 || d === 9) {
      var base = d === 7 ? "soixante" : "quatre-vingt";
      var r = n - (d === 7 ? 60 : 80);
      if (d === 7 && r === 11) return "soixante et onze";
      return base + "-" + lt100(r);
    }
    if (d === 8) return u === 0 ? (final === false ? "quatre-vingt" : "quatre-vingts") : "quatre-vingt-" + U[u];
    if (u === 0) return D[d];
    if (u === 1) return D[d] + " et un";
    return D[d] + "-" + U[u];
  }
  function lt1000(n, final) {
    var c = Math.floor(n / 100), r = n % 100, s = "";
    if (c > 0) {
      s = (c > 1 ? U[c] + " " : "") + "cent";
      if (c > 1 && r === 0 && final) s += "s";
      if (r > 0) s += " ";
    }
    if (r > 0 || c === 0) s += lt100(r, final);
    return s;
  }
  function enLettres(n) {
    n = Math.round(Math.abs(Number(n)));
    if (!isFinite(n)) return "";
    if (n === 0) return "zéro";
    var parts = [], scales = [[1e9, "milliard"], [1e6, "million"]];
    for (var i = 0; i < scales.length; i++) {
      var q = Math.floor(n / scales[i][0]);
      if (q > 0) {
        parts.push(lt1000(q, true) + " " + scales[i][1] + (q > 1 ? "s" : ""));
        n = n % scales[i][0];
      }
    }
    var m = Math.floor(n / 1000);
    if (m > 0) { parts.push(m === 1 ? "mille" : lt1000(m, false) + " mille"); n = n % 1000; }
    if (n > 0) parts.push(lt1000(n, true));
    return parts.join(" ");
  }

  // ---------- Formats ----------
  var NB = "\u00A0";
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  function fmtInt(n) {
    var s = String(Math.round(Math.abs(Number(n))));
    return (Number(n) < 0 ? "-" : "") + s.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  }
  function fmtDec(n, max) {
    var s = Number(n).toFixed(max == null ? 2 : max).replace(/\.?0+$/, "");
    var p = s.split(".");
    return fmtInt(p[0]) + (p[1] ? "," + p[1] : "");
  }
  function fmtMontant(n) { return fmtInt(n) + NB + "FCFA"; }
  function fmtPct(n) { return fmtDec(n, 2) + NB + "%"; }
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!m) return "";
    var d = Number(m[3]);
    return (d === 1 ? "1er" : d) + " " + MOIS[Number(m[2]) - 1] + " " + m[1];
  }
  function montantLettres(n) { var w = enLettres(n); return w + (/(millions?|milliards?)$/.test(w) ? " de" : "") + " francs CFA (" + fmtMontant(n) + ")"; }
  function nombreLettres(n) { return enLettres(n) + " (" + fmtInt(n) + ")"; }

  // ---------- Schéma ----------
  function fields(schema) {
    var out = [];
    (schema.sections || []).forEach(function (s) { (s.champs || []).forEach(function (f) { out.push(Object.assign({ section: s.id }, f)); }); });
    return out;
  }
  function index(schema) {
    if (schema.__idx) return schema.__idx;
    var idx = {};
    fields(schema).forEach(function (f) { idx[f.id] = f; });
    (schema.calculs || []).forEach(function (c) { idx[c.id] = Object.assign({ calcule: true }, c); });
    Object.defineProperty(schema, "__idx", { value: idx, enumerable: false });
    return idx;
  }
  function isEmpty(v) { return v == null || (typeof v === "string" && v.trim() === "") || (typeof v === "number" && isNaN(v)); }
  function condOk(cond, values) {
    if (!cond) return true;
    var v = values[cond.champ];
    if (cond.parmi) return cond.parmi.indexOf(v) >= 0;
    if (cond.different != null) return v !== cond.different;
    return v === cond.egal;
  }
  function visible(f, values, idx) {
    if (!f.si) return true;
    if (!condOk(f.si, values)) return false;
    var parent = idx && idx[f.si.champ];
    return parent ? visible(parent, values, idx) : true;
  }
  function num(v) { return isEmpty(v) ? NaN : Number(v); }

  // Valeurs calculées (ordre de déclaration)
  function compute(schema, values) {
    var out = Object.assign({}, values);
    (schema.calculs || []).forEach(function (c) {
      var a = num(out[c.a]), b = c.b != null ? num(out[c.b]) : NaN, r = NaN;
      if (c.op === "div") r = b ? a / b : NaN;
      else if (c.op === "pct") r = a * b / 100;
      else if (c.op === "diff") r = a - b;
      else if (c.op === "ratio") r = b ? a / b * 100 : NaN;
      else if (c.op === "somme") r = (c.de || []).reduce(function (t, k) { var x = num(out[k]); return t + (isNaN(x) ? 0 : x); }, 0);
      if (c.si && !condOk(c.si, out)) r = NaN;
      out[c.id] = isNaN(r) ? null : (c.type === "pourcentage" ? Math.round(r * 100) / 100 : c.type === "entier" ? Math.round(r * 1e6) / 1e6 : Math.round(r));
    });
    return out;
  }

  // Contrôles : champs manquants, formats, règles de cohérence
  function validate(schema, values) {
    var idx = index(schema), v = compute(schema, values);
    var missing = [], errors = [], warnings = [], filled = 0, required = 0;
    fields(schema).forEach(function (f) {
      if (!visible(f, v, idx)) return;
      var val = v[f.id];
      if (f.requis) { required++; if (!isEmpty(val)) filled++; }
      if (isEmpty(val)) { if (f.requis) missing.push(f); return; }
      var n = Number(val);
      if (["montant", "entier", "pourcentage"].indexOf(f.type) >= 0) {
        if (isNaN(n)) errors.push({ champs: [f.id], message: f.label + " : valeur numérique attendue." });
        else if (n < 0) errors.push({ champs: [f.id], message: f.label + " : la valeur ne peut pas être négative." });
        else if (f.type === "entier" && Math.round(n) !== n) errors.push({ champs: [f.id], message: f.label + " : nombre entier attendu." });
        else if (f.type === "pourcentage" && n > 100) errors.push({ champs: [f.id], message: f.label + " : un pourcentage ne peut dépasser 100 %." });
      }
      if (f.type === "date" && !fmtDate(val)) errors.push({ champs: [f.id], message: f.label + " : date invalide." });
      if (f.motif && !(new RegExp(f.motif)).test(String(val))) errors.push({ champs: [f.id], message: f.label + " : " + (f.motif_aide || "format inattendu.") });
    });
    (schema.regles || []).forEach(function (r) {
      var ids = [r.a].concat(r.b ? [r.b] : []);
      var hidden = ids.some(function (id) { return idx[id] && !idx[id].calcule && !visible(idx[id], v, idx); });
      if (hidden || (r.si && !condOk(r.si, v))) return;
      var a = v[r.a], b = r.b != null ? v[r.b] : r.valeur;
      if (isEmpty(a) || isEmpty(b)) return;
      var ok = true, fa = Number(a), fb = Number(b);
      if (r.type === "date") { fa = String(a); fb = String(b); }
      switch (r.op) {
        case "<": ok = fa < fb; break;
        case "<=": ok = fa <= fb; break;
        case ">": ok = fa > fb; break;
        case ">=": ok = fa >= fb; break;
        case "multiple": ok = fb > 0 && Math.abs(fa / fb - Math.round(fa / fb)) < 1e-9; break;
        case "entre": ok = fa >= r.min && fa <= r.max; break;
      }
      if (!ok) (r.niveau === "attention" ? warnings : errors).push({ champs: ids, message: r.message });
    });
    return { missing: missing, errors: errors, warnings: warnings, filled: filled, required: required, values: v, complete: !missing.length && !errors.length };
  }

  // ---------- Rendu ----------
  function escMd(s) {
    return String(s).replace(/[\\`*_[\]|]/g, "\\$&").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n+/g, " ");
  }
  function escHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function ph(label) { return '<span class="ph">[' + escHtml(label) + "]</span>"; }

  // ---------- Anglais (version de courtoisie des modèles) ----------
  var UNITS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  var TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  function en999(n) {
    var h = Math.floor(n / 100), r = n % 100, out = [];
    if (h) out.push(UNITS[h] + " hundred");
    if (r) out.push((h ? "and " : "") + (r < 20 ? UNITS[r] : TENS[Math.floor(r / 10)] + (r % 10 ? "-" + UNITS[r % 10] : "")));
    return out.join(" ");
  }
  function wordsEn(n) {
    n = Math.round(Math.abs(Number(n))); if (!n) return "zero";
    var parts = [], scales = [[1e12, "trillion"], [1e9, "billion"], [1e6, "million"], [1e3, "thousand"]];
    scales.forEach(function (sc) { var q = Math.floor(n / sc[0]); if (q) { parts.push(en999(q) + " " + sc[1]); n -= q * sc[0]; } });
    if (n) parts.push((parts.length && n < 100 ? "and " : "") + en999(n));
    return parts.join(" ");
  }
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function fmtIntEn(n) { var s = String(Math.round(Math.abs(Number(n)))); return (Number(n) < 0 ? "-" : "") + s.replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function fmtDecEn(n, max) { var s = Number(n).toFixed(max == null ? 2 : max).replace(/\.?0+$/, ""); var p = s.split("."); return fmtIntEn(p[0]) + (p[1] ? "." + p[1] : ""); }
  function fmtDateEn(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "")); return m ? Number(m[3]) + " " + MONTHS[Number(m[2]) - 1] + " " + m[1] : ""; }

  function formatValue(f, val, filtre, lang) {
    if (lang === "en") {
      if (f.type === "montant") return filtre === "lettres" ? wordsEn(val) + " CFA francs (FCFA " + fmtIntEn(val) + ")" : "FCFA " + fmtIntEn(val);
      if (f.type === "entier") return filtre === "nombre" ? wordsEn(val) + " (" + fmtIntEn(val) + ")" : fmtIntEn(val);
      if (f.type === "pourcentage") return fmtDecEn(val, 2) + "%";
      if (f.type === "date") return fmtDateEn(val);
    }
    if (f.type === "montant") return filtre === "lettres" ? montantLettres(val) : fmtMontant(val);
    if (f.type === "entier") return filtre === "nombre" ? nombreLettres(val) : fmtInt(val);
    if (f.type === "pourcentage") return fmtPct(val);
    if (f.type === "date") return fmtDate(val);
    if (f.type === "choix") {
      var o = (f.options || []).filter(function (x) { return x.valeur === val; })[0];
      if (!o) return String(val);
      return filtre === "label" ? o.label : (o.texte != null && o.texte !== "" ? o.texte : o.label);
    }
    return String(val).trim();
  }

  function renderVars(md, schema, values, mode, ctx) {
    var idx = index(schema);
    return md.replace(/\{\{\s*([\w.]+)\s*(?:\|\s*(\w+))?\s*\}\}/g, function (all, key, filtre) {
      if (key.indexOf("societe.") === 0) {
        var sv = ctx && ctx.societe ? ctx.societe[key.slice(8)] : null;
        if (!isEmpty(sv)) return escMd(sv);
        return mode === "rempli" ? "" : ph("Paramètre société : " + key.slice(8));
      }
      var f = idx[key];
      if (!f) return mode === "rempli" ? "" : ph("Champ inconnu : " + key);
      var val = values[key];
      if (mode === "modele" || isEmpty(val)) {
        if (mode === "rempli") return escMd(f.vide || "");
        if (!isEmpty(f.vide) && mode === "apercu" && !f.requis) return escMd(f.vide);
        return ph(f.label);
      }
      return escMd(formatValue(f, val, filtre, ctx && ctx.lang));
    });
  }

  function parseConds(md) {
    var re = /\{%\s*(?:si\s+(\w+)\s*(!=|=|\bdans\b)\s*([\w,-]+)|fin)\s*%\}/g, rootNode = { kids: [] }, stack = [rootNode], last = 0, m;
    while ((m = re.exec(md))) {
      stack[stack.length - 1].kids.push(md.slice(last, m.index));
      var before = md.slice(0, m.index), after = md.slice(m.index + m[0].length);
      var block = (/(^|\n)[ \t]*$/.test(before)) && (/^[ \t]*(\n|$)/.test(after));
      if (m[1]) {
        var node = { champ: m[1], op: m[2], val: m[3], block: block, kids: [] };
        stack[stack.length - 1].kids.push(node);
        stack.push(node);
      } else {
        if (stack.length > 1) stack.pop();
      }
      last = m.index + m[0].length;
      if (block) { var nl = md.indexOf("\n", last); if (nl >= 0 && /^[ \t]*$/.test(md.slice(last, nl))) last = nl + 1; }
    }
    stack[0].kids.push(md.slice(last));
    return rootNode;
  }
  function choiceLabel(f, val) {
    var o = f && (f.options || []).filter(function (x) { return x.valeur === val; })[0];
    return o ? o.label : val;
  }
  function renderConds(node, schema, values, mode) {
    var idx = index(schema);
    return node.kids.map(function (k) {
      if (typeof k === "string") return k;
      var inner = renderConds(k, schema, values, mode);
      if (mode === "modele") {
        var f = idx[k.champ];
        var label = (f ? f.label : k.champ) + (k.op === "!=" ? " autre que " : " : ") + k.val.split(",").map(function (x) { return choiceLabel(f, x); }).join(" ou ");
        if (k.block && /^\s*\|/.test(inner)) {
          return inner.replace(/^(\s*\|\s*)([^|\n]*)/gm, function (all, lead, cell) { return lead + cell.trim() + ' <span class="opt-inline">(si ' + escHtml(label) + ")</span> "; });
        }
        if (k.block) return '\n<div class="opt"><p class="opt-label">Variante — ' + escHtml(label) + "</p>\n\n" + inner.trim() + "\n\n</div>\n\n";
        return '<span class="opt-inline" title="' + escHtml(label) + '">' + inner + "</span>";
      }
      var ok = k.op === "dans" ? k.val.split(",").indexOf(values[k.champ]) >= 0 : k.op === "!=" ? values[k.champ] !== k.val : values[k.champ] === k.val;
      return ok ? inner : "";
    }).join("");
  }

  function renderDirectives(md) {
    return md.replace(/^@signatures\((.*)\)\s*$/gm, function (all, args) {
      var cells = args.split(";").map(function (c) {
        var p = c.split("|");
        return '<div class="sig"><span>' + p[0].trim() + "<br><small>" + (p[1] || "").trim() + "</small></span></div>";
      });
      return '<div class="sig-row">' + cells.join("") + "</div>";
    });
  }

  function render(md, schema, values, mode, ctx) {
    var v = compute(schema, values || {});
    var out = renderConds(parseConds(md), schema, v, mode);
    out = renderVars(out, schema, v, mode, ctx);
    out = renderDirectives(out);
    return out.replace(/\n{3,}/g, "\n\n");
  }

  var api = {
    enLettres: enLettres, fmtInt: fmtInt, fmtMontant: fmtMontant, fmtPct: fmtPct, fmtDate: fmtDate,
    montantLettres: montantLettres, nombreLettres: nombreLettres, formatValue: formatValue,
    fields: fields, index: index, visible: visible, compute: compute, validate: validate, render: render, isEmpty: isEmpty,
  };
  root.RefEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
