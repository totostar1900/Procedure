// Constantes des avis par e-mail, partagées entre le serveur (notifier.ts) et la page Paramétrage
export const SITE = "https://referentiel.purposecapital.africa";
export const BOITE = "referentiel@purposecapital.africa";

export type Reglages = {
  actif: boolean; test: boolean; boite: string; actif_depuis: string | null;
  types: Record<string, boolean>; fonctions: Record<string, boolean>;
  escalade_jours: number; escalade_vers: string[];
};
// Catégories d'avis : [clé, libellé, destinataires, moment] — un interrupteur chacune dans Paramétrage
export const CATEGORIES: [string, string, string, string][] = [
  ["visa", "Visa attendu", "Titulaires de la fonction qui peuvent viser", "Dès le début de l'étape"],
  ["lecture", "Lecture demandée", "Lecteurs désignés", "Dès l'adoption"],
  ["renvoi", "Renvoi pour modification", "Rédacteurs du texte et RCCI", "Immédiat"],
  ["abrogation", "Abrogation", "Lecteurs du document et boîte partagée", "Immédiat"],
  ["redaction", "Modification soumise, publiée ou refusée", "Rédacteurs et boîte partagée", "Immédiat"],
  ["acces", "Accès ouvert", "La personne et la boîte partagée", "Immédiat"],
  ["droits", "Fonctions ou prérogatives modifiées", "La personne et la boîte partagée", "Immédiat"],
  ["suspension", "Suspension ou réactivation", "Boîte partagée (et la personne réactivée)", "Immédiat"],
  ["rappel", "Rappels de visa et de lecture", "Les personnes attendues", "Au seuil d'alerte, à l'échéance, puis tous les 3 jours"],
  ["escalade", "Retards persistants", "Fonctions d'escalade et boîte partagée", "Après le délai d'escalade, puis chaque semaine"],
  ["nouveautes", "Nouveautés de la semaine", "Personnes concernées par le document", "Le lundi"],
  ["revue", "Revues périodiques", "RCCI et boîte partagée", "Le premier jour ouvré du mois"],
  ["resume", "Résumé quotidien", "Boîte partagée", "Chaque jour ouvré, à la première exécution après 7 h"],
];
export const FONCTIONS_N: [string, string][] = [
  ["pca", "Président du Conseil"], ["adm", "Administrateur du Conseil"], ["dg", "Directeur Général"], ["rcci", "RCCI"],
  ["dcom", "Directeur Commercial"], ["dmc", "Directeur des Marchés de Capitaux"], ["redac", "Rédacteur"], ["collab", "Collaborateur"],
];
export const DEFAUT: Reglages = {
  actif: false, test: true, boite: BOITE, actif_depuis: null,
  types: Object.fromEntries(CATEGORIES.map((c) => [c[0], true])), fonctions: Object.fromEntries(FONCTIONS_N.map((f) => [f[0], true])),
  escalade_jours: 3, escalade_vers: ["dg", "rcci"],
};
export const lireReglages = (x: Partial<Reglages> | null | undefined): Reglages => ({
  ...DEFAUT, ...(x || {}), types: { ...DEFAUT.types, ...((x && x.types) || {}) }, fonctions: { ...DEFAUT.fonctions, ...((x && x.fonctions) || {}) },
});
