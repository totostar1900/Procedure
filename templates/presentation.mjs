// Présentation des documents imprimés (PDF, Word, conventions générées) : page de garde, en-tête, bas de page.
// Réglée dans Paramétrage › Présentation des documents (kv presentation/reglages), écrite par la publication
// dans content/presentation.json. Ne touche ni le texte ni l'empreinte : aucun visa n'est concerné.
//   G1 bandeau marine, nom en lettres · G2 bandeau marine, logo blanc · G3 page blanche, logo couleur
//   E1 nom en lettres · E2 soleil et nom · E3 logo complet à gauche · E4 papier à en-tête (logo centré)
//   P1 informations et page · P2 soleil centré · P3 soleil, informations et page · P4 soleil à droite
// Aucune référence (PC-…) n'apparaît en en-tête, bas de page ni page de garde ; les documents remis au client
// (modèles de contrat, formulaires, conventions générées, annexes renseignées par le client) n'affichent pas de version.
import fs from "node:fs";
import path from "node:path";

export const TYPES = ["Code", "Politique", "Procédure", "Modèle de contrat", "Mode opératoire", "Formulaire", "_conventions"];
export const TYPES_CLIENT = ["Modèle de contrat", "Formulaire", "_conventions"];
// Champs de la fiche d'identité : [clé, libellé, préfixe FR, préfixe EN, ligne du pied (1 identité, 2 contact)]
export const CHAMPS = [
  ["raison_sociale", "Raison sociale", "", "", 1], ["forme", "Forme sociale", "", "", 1], ["capital", "Capital", "Capital ", "Share capital ", 1],
  ["rccm", "RCCM", "RCCM ", "Trade register ", 1], ["niu", "NIU", "NIU ", "Tax ID ", 1], ["agrement", "Agrément COSUMAF", "Agrément ", "Licence ", 1],
  ["siege", "Siège", "", "", 2], ["bp", "Boîte postale", "BP ", "PO Box ", 2], ["telephone", "Téléphone", "Tél. ", "Tel. ", 2],
  ["email", "E-mail", "", "", 2], ["site", "Site web", "", "", 2], ["mention1", "Mention libre 1", "", "", 2], ["mention2", "Mention libre 2", "", "", 2],
];
// Textes traduisibles : une version anglaise à côté (clé_en)
export const TRADUISIBLES = ["forme", "mention1", "mention2"];
const CHAMPS_CLIENT = ["raison_sociale", "forme", "capital", "rccm", "agrement", "siege", "telephone", "email"];
const CHAMPS_INTERNE = ["raison_sociale", "siege"];
export const DEFAUT = {
  societe: {},
  types: Object.fromEntries(TYPES.map((t) => [t, { garde: "G3", entete: "E2", pied: "P3", champs: TYPES_CLIENT.includes(t) ? CHAMPS_CLIENT : CHAMPS_INTERNE }])),
  documents: {},
};

export function lirePresentation(root) {
  const f = path.join(root, "content", "presentation.json");
  const x = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
  const types = {};
  for (const t of TYPES) types[t] = { ...DEFAUT.types[t], ...((x.types || {})[t] || {}) };
  return { societe: x.societe || {}, types, documents: x.documents || {} };
}
// Règle applicable à un document (type, puis exception propre au document)
export function regle(P, d, type) {
  const t = type || d.type, base = P.types[t] || P.types["Procédure"], ex = (d && P.documents[d.id]) || {};
  const r = { ...base };
  for (const k of ["garde", "entete", "pied"]) if (ex[k]) r[k] = ex[k];
  r.client = TYPES_CLIENT.includes(t);
  return r;
}
// Une annexe remise au client (renseignée par lui) n'affiche pas de version, comme les documents client
export const annexeClient = (a) => /client|titulaire|donneur d'ordre/i.test(String(a.renseigne_par || ""));

// Lignes du bas de page : identité, puis contact (sans libellé quand la valeur se suffit)
export function lignesPied(societe, champs, en) {
  const val = (k) => { const v = en && TRADUISIBLES.includes(k) && societe[k + "_en"] ? societe[k + "_en"] : societe[k]; return v == null ? "" : String(v).trim(); };
  const l = [[], []];
  for (const [k, , fr, enP, n] of CHAMPS) if ((champs || []).includes(k) && val(k)) l[n - 1].push((en ? enP : fr) + val(k));
  return l.map((x) => x.join(" · ")).filter(Boolean);
}

// Images du logo (SVG pour les PDF, PNG pour Word et les conventions générées dans le navigateur)
export function logos(root) {
  const r = (f) => fs.readFileSync(path.join(root, "templates", "logo", f));
  const uri = (f, t) => `data:${t};base64,${r(f).toString("base64")}`;
  return {
    svg: { logo: uri("logo.svg", "image/svg+xml"), blanc: uri("logo-blanc.svg", "image/svg+xml"), soleil: uri("soleil.svg", "image/svg+xml") },
    png: { logo: r("logo.png"), blanc: r("logo-blanc.png"), soleil: r("soleil.png") },
    pngUri: { logo: uri("logo.png", "image/png"), soleil: uri("soleil.png", "image/png") },
    ratio: 451 / 158,
  };
}
