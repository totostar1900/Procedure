// Les références PC-… citées dans les textes s'affichent par le titre du document (à l'affichage seulement :
// le texte source et l'empreinte ne changent pas). « Politique de gestion des risques (PC-POL-RIS-001, annexe X) »
// devient « Politique de gestion des risques (annexe X) » ; « selon le PC-PRO-GOV-001 » devient
// « selon la Procédure de maîtrise documentaire ». Une valeur qui n'est qu'une référence (champ id…) est laissée telle quelle.
const ID = "PC-[A-Z]+(?:-[A-Z]+)?-\\d{3}";
const MASC = /^(Code|Règlement|Plan|Manuel|Guide|Registre)\b/;
const norm = (t) => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export function referencesEnTitres(txt, lang, TITRES) {
  const en = lang === "en";
  const titre = (id) => { const t = TITRES[id]; return t ? (en ? t.en || t.fr : t.fr) : null; };
  let s = String(txt == null ? "" : txt);
  if (new RegExp("^\\s*" + ID + "\\s*$").test(s)) return s;
  // 1. Le titre précède : « Titre (PC-…) » → « Titre » ; « Titre (PC-…, article 11) » → « Titre (article 11) »
  const src = s;
  s = s.replace(new RegExp("\\s?\\((" + ID + ")(\\)|,\\s*)", "g"), (m, id, fin, off) => {
    const t = titre(id); if (!t) return m;
    const avant = norm(src.slice(Math.max(0, off - 140), off)).split(" ").slice(-7);
    const mots = norm(t).split(" ").filter((w) => w.length > 2).slice(-2);
    if (!mots.length || !mots.every((w) => avant.includes(w))) return m;
    return fin === ")" ? "" : " (";
  });
  // 2. Référence seule : le titre, avec l'article qui convient (le / la, du / de la, au / à la)
  const art = en ? "(\\b(?:the|The)\\s+)?" : "(\\b(?:le|la|Le|La|du|Du|de|De|au|Au|à la|À la)\\s+)?";
  s = s.replace(new RegExp("(^|[^\\w/\\-\\[])" + art + "(" + ID + ")(?![\\w/\\-])", "g"), (m, pre, a, id, off, all) => {
    const t = titre(id); if (!t) return m;
    if (en) {
      if (a) return pre + a + t;
      const avant = all.slice(Math.max(0, off - 25), off + pre.length);
      return pre + (/\b(under|with|in|see|per|by|of|to|and|from|on|into|for)\s*$/i.test(avant) ? "the " + t : t);
    }
    const masc = MASC.test(t);
    if (a) {
      const x = a.trim().toLowerCase(), maj = /^[A-ZÀ]/.test(a);
      const rep = x === "le" || x === "la" ? (masc ? "le " : "la ") : x === "du" || x === "de" ? (masc ? "du " : "de la ") : (masc ? "au " : "à la ");
      return pre + (maj ? rep[0].toUpperCase() + rep.slice(1) : rep) + t;
    }
    const avant = all.slice(Math.max(0, off - 30), off + pre.length);
    if (/\b(selon|par|voir|dans|avec|sur|conformément à|cf\.)\s*$/i.test(avant)) return pre + (masc ? "le " : "la ") + t;
    return pre + t;
  });
  // 3. Titre répété entre parenthèses (« Titre (Titre, article 5) ») : une seule fois
  for (const id of Object.keys(TITRES)) {
    const t = titre(id); if (!t || s.indexOf(t + " (" + t) < 0) continue;
    s = s.split(t + " (" + t + ")").join(t).split(t + " (" + t + ", ").join(t + " (");
  }
  return s;
}
