# Référentiel documentaire — Purpose Capital S.A.

Source unique des codes, politiques et procédures. Le site (consultation) et les PDF (partage, impression) sont générés à partir de cette source ; on ne modifie jamais un PDF à la main.

## Arborescence

```
content/
  referentiel.yaml            Société, circuit d'approbation, documents prévus, textes de référence, glossaire
  documents/<RÉF>/
    document.md               Métadonnées (en-tête YAML) + corps du document
    annexes/A1.md, A2.md…     Une annexe par fichier, téléchargeable séparément
templates/                    Gabarits du site (site.css, site.js, index.tpl.html) et des PDF (print.css)
build.mjs                     Générateur
dist/                         Résultat publié : index.html + pdf/
```

## Générer

```
npm install
npx playwright install chromium
node build.mjs            # site + PDF
node build.mjs --no-pdf   # site seul
```

## Règles de maîtrise

- Les rôles sont désignés par leur titre (RCCI, Directeur Général, Conseil d'Administration), jamais par un nom.
- Versions : 0.x projet · 1.0 adoption · 1.1 correction mineure · 2.0 révision. Statuts : `Projet`, `En vigueur`, `Abrogé`.
- Chaque ligne d'`historique` porte `nature` (`mineure` ou `revision`) et, une fois adoptée, `empreinte`.
- Ajouter un document : créer `content/documents/<RÉF>/document.md` ; il remplace automatiquement sa ligne dans `prevus`.
- Toute valeur YAML contenant « : » se met entre guillemets.

## Mettre à jour un document (procédure PC-PRO-GOV-001)

L'**empreinte** d'un document est calculée sur son texte et ses annexes (pas sur l'en-tête). Chaque visa électronique porte l'empreinte du texte visé : toute modification du texte rend les visas caducs.

1. **Document encore en projet (0.x)** : modifier directement le texte, ajouter une ligne d'historique, `node build.mjs`, publier.
2. **Document en vigueur** : ouvrir une révision
   `node tools/version.mjs reviser <RÉF> mineure|revision "objet"`
   La version en vigueur est figée dans `<RÉF>/vigueur/` et reste en ligne ; le texte de travail devient le **projet de révision**, affiché à côté avec ses propres PDF et visas. Modifier le texte, `node build.mjs`, publier.
3. **Visas** : vérification puis approbation (ou adoption par le Conseil) dans l'onglet Visas du site.
4. **Récupérer les visas** : exporter les collections `roles` et `sig` de la base du site (outil ArtifactData, option `out_dir`), puis
   `node tools/version.mjs visas <dossier-export>` → `content/approbations.json`.
5. **Adopter** : `node tools/version.mjs adopter <RÉF>` — passe le texte en vigueur (1.0 pour un premier projet), date d'approbation tirée des visas, archive l'ancienne version dans `content/archives/<RÉF>/v<version>/`. Puis `node build.mjs` et publier : la fiche de maîtrise des PDF affiche les visas électroniques.
6. **Lectures** : une correction `mineure` conserve les attestations de lecture ; une `revision` les redemande aux personnes désignées.

`node tools/version.mjs etat` liste versions, statuts, empreintes, révisions en cours et visas enregistrés.

## Publication

Le site est publié comme artefact claude.ai (page privée, partagée nominativement). Les Word sont publiés encodés en base64 (`dist/word/*.docx.txt`), le service ne servant pas les .docx ; la page les décode au téléchargement. Une publication envoie au plus 255 fichiers : publier les PDF et les Word en deux fois.

## Modèles à remplir (conventions)

Un document qui possède un fichier `variables.yaml` devient un modèle à remplir :

- `variables.yaml` décrit les champs (type, caractère obligatoire, conditions d'affichage, valeurs par défaut), les valeurs calculées et les règles de cohérence.
- Dans `document.md` et les annexes, une donnée s'appelle par `{{champ}}` (filtres `|lettres` pour un montant en toutes lettres, `|nombre` pour un délai, `|label` pour le libellé d'un choix), une variante par `{% si champ = valeur %} … {% fin %}` (opérateurs `=`, `!=`, `dans a,b`), et le bloc de signatures par `@signatures(…)`.
- Le moteur commun est `templates/engine.cjs` : il produit le modèle imprimable (zones surlignées, variantes signalées) et, dans le référentiel, la convention remplie.
- Le générateur (`templates/generator.js`) produit le Word et le PDF dans le navigateur et conserve chaque dossier d'opération dans la base du référentiel.
- `content/referentiel.yaml` → `societe.rccm` : à renseigner une fois ; il est ensuite repris dans toutes les conventions.
