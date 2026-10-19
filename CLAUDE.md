# Référentiel documentaire — Purpose Capital S.A.

Lire `README.md` avant toute modification : arborescence, génération, versionnage (`tools/version.mjs`), visas électroniques, publication.

- Site publié (artefact claude.ai, privé) : https://claude.ai/artifact/LmKmic7atsYRxmhaARpNWv — republier avec `root=dist`, sans repasser `capabilities` (les règles d'accès de la base des visas sont déjà déclarées).
- `npm install` puis `node build.mjs` (site + PDF + Word) ou `node build.mjs --no-pdf`. Chromium : `PLAYWRIGHT_BROWSERS_PATH` si nécessaire.
- Rédaction : ton clair et compréhensible de tous ; bonnes pratiques occidentales adaptées au Cameroun et à la CEMAC, appuyées sur les textes CEMAC/COSUMAF ; rôles désignés par leur titre, jamais par un nom ; structure « ## Titre X — … » / « ### Article N — … ».
- YAML : toute valeur contenant « : » entre guillemets (sinon un élément de liste devient un objet).
- Ne jamais écrire de visa dans la base à la place d'une personne. Les visas se lisent (ArtifactData, collections `roles` et `sig`) puis `node tools/version.mjs visas <export>`.
- Le Guichet (dépôt totostar1900/guichet) reprend la convention de compte-titres (articles 1 à 10) : toute modification de l'un se reporte dans l'autre le même jour.
