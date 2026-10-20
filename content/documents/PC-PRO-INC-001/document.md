---
id: PC-PRO-INC-001
titre: Procédure de gestion des incidents et des plans d'actions correctifs
type: Procédure
domaine: Conformité
version: "0.9"
statut: Projet
confidentialite: Interne
proprietaire: Directeur Général
redige_par: Responsable de la conformité et du contrôle interne (RCCI)
verifie_par: Responsable de la conformité et du contrôle interne (RCCI)
approuve_par: Directeur Général
date_approbation:
date_effet:
prochaine_revue: 12 mois après adoption
diffusion: Tous les collaborateurs
public: false
resume: "Comment Purpose Capital S.A. déclare, qualifie, corrige et suit ses incidents et les constats de ses contrôles — déclaration le jour même, échelle de gravité, escalade, analyse des causes, plans d'actions vérifiés, registre unique et leçons tirées dans ses procédures."
references:
  - ref: RG-COSUMAF-2023
    articles: "Approche par les risques, cartographie et rapport annuel de contrôle interne transmis avant le 31 mars (art. 5) ; fonction de conformité et de contrôle interne (art. 13) ; conservation des documents pendant dix ans (art. 105)"
  - ref: REG-01-22
    articles: Organisation et obligations des intermédiaires du marché financier régional, dont la coopération avec la COSUMAF
  - ref: REG-02-24
    articles: Déclaration de soupçon à l'ANIF, confidentialité de la déclaration et interdiction d'avertir
  - ref: LOI-CM-2024-017
    articles: Sécurité des données et notification des violations de données personnelles à l'autorité de protection et aux personnes concernées
  - ref: CT-CM
    articles: Pouvoir disciplinaire de l'employeur, dans les limites duquel s'inscrit l'engagement de ne pas sanctionner l'erreur déclarée de bonne foi
  - ref: BCBS-RO
    articles: "Bonne pratique internationale : collecte des incidents et des pertes, analyse des causes, compte rendu à la direction et au conseil"
  - ref: COSO-2013
    articles: "Référentiel international : activités de pilotage, évaluation et communication des défaillances du contrôle interne (principes 16 et 17)"
  - ref: ISO-9001-DOC
    articles: "Bonne pratique internationale : même norme, § 10.2 (non-conformité et action corrective) et § 10.3 (amélioration continue)"
  - ref: ISO-31000
    articles: "Bonne pratique internationale : suivi, revue et amélioration du dispositif de management du risque"
historique:
  - version: "0.9"
    date: 2026-10-20
    objet: Projet initial
    par: RCCI
notes_redaction:
  - "La Direction a demandé une politique d'amélioration continue. Elle prend ici la forme concrète d'une procédure approuvée par le Directeur Général, qui précise l'article 28 de la Politique de gestion des risques et l'article 17 de la Charte du contrôle interne. Si le Conseil d'Administration souhaite approuver lui-même ces principes, l'article 4 peut être repris dans une politique ; à confirmer."
  - "Seuils de gravité (article 13 et Annexe 2) : 1 000 000 FCFA pour un incident significatif, repris de l'article 28 de la Politique de gestion des risques, et 10 000 000 FCFA pour un incident majeur, repris de la note d'impact 3 de sa grille de cotation (Annexe 3). À confirmer par le Directeur Général."
  - "La fiche de déclaration de l'Annexe 1 reprend et complète la fiche de l'Annexe 4 de la Politique de gestion des risques, et le registre de l'Annexe 3 réunit le registre des incidents et le tableau de suivi des recommandations de la Charte du contrôle interne (Annexe 3). À la prochaine révision de ces deux documents, leurs annexes devront renvoyer à la présente procédure pour éviter deux fiches et deux tableaux."
  - "Aucune disposition de la COSUMAF fixant un délai précis de notification des incidents par une société de bourse n'a été trouvée. La procédure applique la Procédure de reporting réglementaire (information sans délai, confirmation écrite sous 48 heures). À vérifier sur le texte officiel du Règlement général et les instructions de la COSUMAF."
  - "Le délai légal de notification d'une violation de données personnelles prévu par la loi n° 2024/017, et l'existence effective de l'autorité de protection, sont à vérifier avec le conseil juridique ; la procédure renvoie au délai légal sans le chiffrer."
  - "L'engagement de ne pas sanctionner une erreur déclarée de bonne foi (article 10) doit être cohérent avec le règlement intérieur et le pouvoir disciplinaire prévu par le Code du travail. À faire vérifier par le conseil juridique ou le conseil en droit social."
  - "La Politique de formation (PC-POL-FOR-001) est rédigée en parallèle : vérifier, à son adoption, la cohérence du renvoi de l'article 26."
  - "Choisir l'outil du registre unique (tableur partagé à accès restreint ou module du référentiel en ligne) et les droits d'accès. Vérifier aussi, dans le contrat d'assurance de responsabilité civile professionnelle, le délai de déclaration d'un sinistre à l'assureur, et l'ajouter à l'Annexe 2."
---

## Titre I — Dispositions générales

### Article 1 — Objet

La présente procédure dit comment Purpose Capital S.A. (la « Société ») apprend de ses erreurs : comment elle repère les incidents et les faiblesses de son organisation, les corrige, vérifie que la correction fonctionne et en tire des leçons durables.

C'est le moteur de l'amélioration continue de la Société. Un incident bien traité coûte une fois ; un incident mal traité revient. La procédure précise l'article 28 de la Politique de gestion des risques (PC-POL-RIS-001) pour les incidents, et l'article 17 de la Charte du contrôle interne et de la conformité (PC-COD-003) pour le suivi des recommandations. Elle ne les remplace pas.

### Article 2 — Champ d'application

La procédure s'applique :

- à tous les collaborateurs, y compris le Directeur Général, et aux administrateurs pour les faits dont ils ont connaissance ;
- aux prestataires, dans les conditions prévues par leur contrat, notamment le prestataire informatique ;
- à tous les incidents, quelle qu'en soit la cause, et à tous les constats issus des contrôles internes et externes, quelle qu'en soit l'origine.

### Article 3 — Définitions

- **Incident** : événement qui a causé, ou aurait pu causer, une perte, une erreur, une interruption ou un manquement. Il peut être :
  - **opérationnel** : erreur de saisie ou d'exécution, ordre mal transmis, paiement erroné, écart de rapprochement, document perdu ;
  - **de conformité** : manquement à la réglementation ou à une procédure interne, transmission tardive à la COSUMAF, dossier client incomplet ;
  - **informatique ou de cybersécurité** : panne, intrusion, hameçonnage réussi, perte ou fuite de données ;
  - **touchant un client** : tout incident qui affecte un client, ses avoirs, ses ordres ou ses données.
- **Incident évité de justesse** : erreur détectée et arrêtée avant de produire un effet. Il est déclaré comme un incident, car il révèle la même faiblesse.
- **Constat** : faiblesse relevée par un contrôle : contrôle permanent du RCCI, revue indépendante annuelle, commissaires aux comptes, inspection ou demande de la COSUMAF, analyse des réclamations, exercice du Plan de continuité d'activité, évaluation d'un prestataire.
- **Cause racine** : raison profonde pour laquelle l'incident s'est produit ou le constat existe ; si on la supprime, le problème ne se reproduit pas.
- **Action corrective** : action qui supprime la cause racine d'un incident ou d'un constat, pour qu'il ne se reproduise pas.
- **Action préventive** : action qui supprime la cause d'un problème qui ne s'est pas encore produit, mais que l'analyse a mis en évidence ailleurs.
- **Plan d'actions** : ensemble des actions décidées pour un incident ou un constat ; chaque action a un responsable, une échéance et une preuve de réalisation attendue.
- **Incident répété** : incident de même nature, ou ayant la même cause racine, qu'un incident survenu dans les douze mois précédents.

### Article 4 — Principes

1. **Tout se déclare** : un incident, même minime, même évité ou corrigé, est déclaré. Ce qui n'est pas déclaré ne peut être corrigé.
2. **Le client d'abord** : on protège le client et on corrige avant de chercher à expliquer.
3. **On cherche une cause, pas un coupable** : l'analyse vise l'organisation, les outils et les règles, non la personne.
4. **Un seul registre** : incidents et constats de toutes origines sont suivis dans un registre unique, selon une même échelle de gravité.
5. **Une action n'est close que sur preuve** : le RCCI vérifie la réalisation, puis l'efficacité.
6. **Chaque leçon change quelque chose** : une procédure, un contrôle, un outil ou une formation.
7. **Proportionnalité** : l'effort d'analyse est proportionné à la gravité ; un incident mineur isolé ne demande pas d'enquête.

### Article 5 — Articulation avec les autres documents

La présente procédure organise le circuit commun ; les règles propres à chaque matière restent dans leur document.

| Sujet | Document qui fait foi |
| --- | --- |
| Appétence, limites, cartographie des risques | Politique de gestion des risques (PC-POL-RIS-001) |
| Plan de contrôle, cotation des constats, revue indépendante | Charte du contrôle interne et de la conformité (PC-COD-003) |
| Soupçon de blanchiment, gel des avoirs | Politique LBC/FT (PC-POL-LBC-001) |
| Incident de sécurité informatique, violation de données | Politique de sécurité des systèmes d'information (PC-POL-SSI-001) |
| Crise et interruption d'activité | Plan de continuité d'activité (PC-POL-PCA-001) |
| Notifications à la COSUMAF | Procédure de reporting réglementaire (PC-PRO-REP-001) |
| Écarts sur les avoirs des clients | Procédure de ségrégation et de rapprochement des avoirs clients (PC-PRO-SEG-001) |
| Réclamations et réparation des clients | Procédure de traitement des réclamations (PC-PRO-REC-001) |
| Défaillance d'un prestataire | Politique d'externalisation (PC-POL-EXT-001) |
| Alerte éthique | Code de bonne conduite (PC-COD-001), article 47 |

## Titre II — Rôles

### Article 6 — Qui fait quoi

| Fonction | Rôle |
| --- | --- |
| Tout collaborateur | Prend les mesures immédiates à sa portée ; déclare l'incident le jour même ; participe à l'analyse des causes ; réalise les actions dont il est responsable |
| Directeur ou responsable du service concerné | Vérifie les mesures immédiates ; propose le plan d'actions de son domaine ; rend compte de l'avancement des actions |
| RCCI | Enregistre et qualifie ; déclenche l'escalade ; conduit ou fait conduire l'analyse des causes ; tient le registre unique ; vérifie la réalisation et l'efficacité des actions ; rend compte |
| Directeur Général | Décide des mesures et des moyens pour les incidents significatifs et majeurs ; valide les plans d'actions ; décide des notifications aux autorités et des réparations ; préside la revue mensuelle |
| Président du Conseil d'Administration | Est informé des incidents significatifs et majeurs ; informe le Conseil ; traite les incidents qui mettent en cause le Directeur Général |
| Conseil d'Administration | Examine chaque trimestre le rapport de l'Annexe 5 ; décide des suites des incidents majeurs qui le justifient |
| Prestataire informatique | Signale sans délai tout incident sur les systèmes qu'il gère ; participe à l'analyse ; réalise les actions prévues à son contrat |

### Article 7 — Lorsque le RCCI ou le Directeur Général est en cause

Personne ne qualifie, n'analyse ni ne clôt un incident dans lequel il est personnellement en cause.

- Si l'incident met en cause le RCCI, ou si le RCCI est responsable d'une action, le Directeur Général qualifie l'incident ou vérifie l'action.
- Si l'incident met en cause le Directeur Général, le RCCI en informe directement le Président du Conseil d'Administration, qui décide des suites.

## Titre III — Détecter et déclarer

### Article 8 — D'où viennent les incidents et les constats

Le registre unique est alimenté par :

- les **incidents déclarés** par les collaborateurs et les prestataires ;
- les **constats des contrôles permanents** du RCCI (fiches de contrôle de la Charte du contrôle interne, Annexe 2) ;
- les **recommandations de la revue indépendante annuelle** et des **commissaires aux comptes** ;
- les **constats et injonctions de la COSUMAF**, à la suite d'une inspection, d'une demande ou d'une transmission ;
- l'**analyse trimestrielle des réclamations** (PC-PRO-REC-001, article 16) ;
- les **retours d'expérience** du Plan de continuité d'activité, après une crise ou un exercice ;
- les **avis de la BVMAC et du Dépositaire central** signalant une anomalie imputable à la Société.

### Article 9 — Déclaration d'un incident

Tout collaborateur qui découvre un incident le déclare au RCCI **le jour même de sa découverte, et au plus tard dans les 24 heures**, au moyen de la fiche de l'Annexe 1. Un courriel reprenant les rubriques de la fiche suffit dans un premier temps.

Lorsque l'incident est en cours ou paraît grave (client touché, fraude, attaque informatique, avoirs des clients en cause), il prévient d'abord le RCCI et le Directeur Général **par téléphone, immédiatement**, puis remplit la fiche.

Deux cas particuliers :

- un **incident de sécurité informatique** est aussi signalé immédiatement au référent informatique, selon l'article 20 de la Politique de sécurité des systèmes d'information ; la fiche de cette politique peut tenir lieu de fiche de l'Annexe 1 ;
- un **soupçon de blanchiment ou de financement du terrorisme** ne se déclare pas sur la fiche de l'Annexe 1. Il est signalé au responsable LBC/FT selon l'article 23 de la Politique LBC/FT. Le registre unique n'en garde aucune trace nominative ; seule une défaillance du dispositif (contrôle non fait, alerte non traitée) y est inscrite, sans mention du soupçon.

Le collaborateur déclare ce qu'il sait au moment où il le sait. Il n'attend pas d'avoir tout compris, ni d'avoir corrigé.

### Article 10 — Une culture de la déclaration

Un collaborateur qui déclare spontanément et de bonne foi une erreur qu'il a commise **n'est pas sanctionné pour cette erreur**, conformément à l'article 30 de la Politique de gestion des risques. Seuls sont des fautes, au sens de l'article 49 du Code de bonne conduite :

- la dissimulation d'un incident ou le retard volontaire à le déclarer ;
- la destruction ou la modification de preuves ;
- la faute intentionnelle, la fraude ou la négligence grave et répétée malgré les rappels.

Le Directeur Général et le RCCI montrent l'exemple en déclarant leurs propres erreurs. Un collaborateur qui craint de déclarer un fait qui met en cause un supérieur, ou qui veut rester anonyme, utilise le dispositif d'alerte de l'article 47 du Code de bonne conduite.

### Article 11 — Enregistrement des constats

Le RCCI inscrit au registre unique chaque constat et chaque recommandation :

- **dès la fiche de contrôle arrêtée**, pour ses propres contrôles ;
- **dans les cinq jours ouvrés** suivant la réception du rapport définitif, pour la revue indépendante, les commissaires aux comptes et la COSUMAF.

Un rapport qui contient plusieurs recommandations donne une ligne par recommandation. Les constats sont cotés selon l'article 16 de la Charte du contrôle interne ; un constat ou une injonction de la COSUMAF est coté au moins « significatif ».

## Titre IV — Qualifier et réagir

### Article 12 — Mesures immédiates

Avant toute analyse, la personne qui découvre l'incident et son responsable :

1. **arrêtent** ce qui peut aggraver la situation : ordre suspendu, paiement bloqué, accès coupé ;
2. **protègent les clients** : un client ne supporte jamais seul les conséquences d'une erreur de la Société ;
3. **conservent les preuves** : ordres, courriels, journaux, captures d'écran ; rien n'est effacé ni « nettoyé » ;
4. **corrigent** ce qui peut l'être tout de suite, avec un double regard ;
5. **notent** l'heure et la nature de chaque mesure sur la fiche de l'Annexe 1.

Lorsque l'incident interrompt une activité essentielle, le Directeur Général apprécie le déclenchement du Plan de continuité d'activité.

### Article 13 — Échelle de gravité

Le RCCI qualifie l'incident **au plus tard le jour ouvré suivant la déclaration**, et immédiatement s'il paraît majeur. Il applique la grille de l'Annexe 2.

| Gravité | Critères (il suffit d'un seul) |
| --- | --- |
| Mineur | Aucun client touché, ou erreur corrigée le jour même sans effet pour lui ; perte inférieure à 1 000 000 FCFA ; écart à une procédure interne sans manquement réglementaire ; incident évité de justesse sans potentiel grave |
| Significatif | Un client touché (erreur d'exécution, retard de paiement, information inexacte) ; perte de 1 000 000 FCFA à moins de 10 000 000 FCFA ; manquement réglementaire, par exemple transmission tardive à la COSUMAF ou dossier client incomplet ; interruption d'un service de plus d'une demi-journée ; données compromises sans diffusion avérée ; incident évité de justesse qui aurait été majeur ; incident mineur répété |
| Majeur | Perte de 10 000 000 FCFA ou plus, ou perte qui rapproche les fonds propres de leur seuil d'alerte ; perte pour plusieurs clients ou écart inexpliqué sur les avoirs des clients ; fraude avérée, interne ou externe ; cyberattaque réussie ou violation de données de clients ; interruption des services aux clients de plus d'un jour ouvré ; manquement susceptible de sanction de la COSUMAF ou de mise en cause de l'agrément ; mise en cause publique de la Société ; incident impliquant un dirigeant ; incident significatif répété |

Un incident significatif ou majeur est un « incident significatif » au sens de l'article 28 de la Politique de gestion des risques. En cas de doute entre deux niveaux, le RCCI retient le plus élevé ; il peut revoir la cotation à la baisse lorsque les faits sont établis, en l'indiquant au registre.

### Article 14 — Escalade

| Gravité | Qui est informé | Délai | Par quel moyen |
| --- | --- | --- | --- |
| Mineur | Responsable du service concerné | À l'enregistrement | Registre ; point à la revue mensuelle |
| Significatif | Directeur Général, puis Président du Conseil d'Administration | Dans les 24 heures suivant la découverte | Courriel du RCCI résumant les faits, les mesures prises et les risques |
| Majeur | Directeur Général et Président du Conseil d'Administration | Immédiatement par téléphone ; note écrite le jour même | Téléphone, puis note du RCCI |
| Majeur | Administrateurs | Dans les 5 jours ouvrés | Note du Directeur Général ; réunion du Conseil si le Président le juge nécessaire |

Ces délais reprennent l'article 27 de la Politique de gestion des risques. Chaque information est datée dans le registre.

### Article 15 — Notifications aux autorités et aux tiers

Le RCCI examine, pour chaque incident significatif ou majeur, si une autorité ou un tiers doit être informé, à l'aide de l'Annexe 4 de la Procédure de reporting réglementaire. Le Directeur Général décide, ou, s'il est en cause, le Président du Conseil d'Administration. Le RCCI prépare la notification et en conserve la preuve.

| Destinataire | Quand | Règle applicable |
| --- | --- | --- |
| COSUMAF | Incident significatif touchant les clients ou le marché : écart sur les avoirs des clients, fraude, cyberattaque, interruption prolongée ; litige important | Sans délai, confirmation écrite sous 48 heures (PC-PRO-REP-001, article 13) |
| ANIF | Soupçon de blanchiment ou de financement du terrorisme ; gel d'avoirs | Par le seul responsable LBC/FT, selon la Politique LBC/FT ; jamais par ce circuit |
| Autorité de protection des données et personnes concernées | Violation de données personnelles | Dans le délai légal, selon la Politique de sécurité des systèmes d'information (article 20) |
| BVMAC, Dépositaire central | Défaillance de règlement-livraison, incident de membre | Selon leurs règles |
| Assureur | Sinistre couvert par l'assurance de responsabilité civile professionnelle ou contre la fraude | Dans le délai prévu au contrat |

En cas de doute, la Société informe la COSUMAF : une information inutile ne coûte rien, une information manquée peut coûter l'agrément.

### Article 16 — Clients touchés

Lorsqu'un client est touché, la Société l'informe par écrit, sans attendre qu'il réclame, de ce qui s'est passé, de ce qui a été corrigé et de ce qui lui est proposé.

La réparation suit l'article 11 de la Procédure de traitement des réclamations, et les pouvoirs de décision son article 13. La réparation n'attend pas la fin de l'analyse des causes. Si le client conteste, sa demande est traitée comme une réclamation.

## Titre V — Analyser et corriger

### Article 17 — Analyse des causes

Une analyse des causes est obligatoire pour :

- tout incident significatif ou majeur ;
- tout incident répété, même mineur ;
- tout constat coté majeur ou significatif.

Elle est menée par le RCCI avec les personnes concernées, en une courte réunion. Elle est terminée, avec le plan d'actions, **dans les 5 jours ouvrés** pour un incident ou un constat majeur, **dans les 10 jours ouvrés** pour un incident ou un constat significatif.

La méthode est celle des **« cinq pourquoi »** : partir du fait constaté et demander « pourquoi ? » jusqu'à trouver une cause sur laquelle la Société peut agir, en général après trois à cinq questions. Chaque réponse s'appuie sur un fait vérifié. L'analyse s'arrête sur une cause d'organisation, d'outil ou de règle, non sur « erreur humaine » : si une personne s'est trompée, on se demande pourquoi le dispositif ne l'a pas arrêtée.

La fiche de l'Annexe 4 est utilisée. Elle classe la cause racine dans l'une des catégories suivantes : procédure absente ou inadaptée ; contrôle absent ou inefficace ; outil ou système ; compétence ou information ; charge de travail ou organisation ; prestataire ; événement extérieur.

### Article 18 — Plan d'actions

Le plan d'actions comprend des actions correctives et, si l'analyse le montre, des actions préventives sur d'autres activités exposées à la même cause. Chaque action précise :

- **quoi** : une action concrète et vérifiable (« ajouter un contrôle de concordance du numéro de compte avant transmission », et non « être plus vigilant ») ;
- **qui** : un responsable désigné par sa fonction ;
- **quand** : une échéance ;
- **quelle preuve** : le document qui montrera que l'action est faite (procédure révisée, capture du paramétrage, liste de présence, fiche de contrôle).

Les échéances suivent l'article 16 de la Charte du contrôle interne, appliqué aussi aux incidents :

| Gravité | Plan d'actions | Correction |
| --- | --- | --- |
| Majeur | Sous 5 jours ouvrés | Sous 1 mois |
| Significatif | Sous 10 jours ouvrés | Sous 3 mois |
| Mineur | Si nécessaire | Sous 6 mois |

Le Directeur Général valide le plan d'actions des incidents et constats significatifs et majeurs, et alloue les moyens nécessaires. Pour un constat de la COSUMAF, l'échéance qu'elle fixe s'impose si elle est plus courte.

### Article 19 — Suivi et report d'échéance

Le responsable de chaque action en rend compte au RCCI à l'échéance, ou plus tôt s'il prévoit un retard.

Une échéance ne peut être reportée qu'une fois, par décision motivée du Directeur Général inscrite au registre. Le report d'une action liée à un incident ou à un constat majeur, ou à un constat de la COSUMAF, est porté à la connaissance du Président du Conseil d'Administration.

Les actions en retard sont examinées à chaque revue mensuelle ; celles qui ont plus de trois mois de retard sont présentées au Conseil d'Administration, conformément à l'article 17 de la Charte du contrôle interne.

### Article 20 — Clôture et vérification de l'efficacité

Une action est **réalisée** lorsque son responsable a remis la preuve prévue et que le RCCI l'a vérifiée. Le RCCI date et vise la clôture dans le registre.

Pour les incidents et constats significatifs et majeurs, le RCCI vérifie aussi l'**efficacité** de l'action, trois mois environ après sa réalisation : test sur un échantillon d'opérations, contrôle inscrit au plan de contrôle annuel, ou constat que l'incident ne s'est pas reproduit. Si l'action n'est pas efficace, la ligne est rouverte et une nouvelle analyse est menée.

Un incident ou un constat n'est clos que lorsque toutes ses actions sont réalisées et, s'il y a lieu, jugées efficaces.

## Titre VI — Registre et compte rendu

### Article 21 — Registre unique

Le RCCI tient le registre des incidents et des plans d'actions selon le modèle de l'Annexe 3. Ce registre unique rassemble le registre des incidents prévu par la Politique de gestion des risques et le tableau de suivi des recommandations prévu par la Charte du contrôle interne.

- Chaque incident reçoit un numéro INC-année-numéro ; chaque constat un numéro CST-année-numéro ; chaque action une lettre (INC-2027-004-a, -b…).
- Le registre est tenu sous forme électronique ; le RCCI y écrit, le Directeur Général et les membres du comité des risques et de la conformité le consultent.
- Les fiches de déclaration, d'analyse et les preuves de réalisation sont classées dans un dossier par numéro.
- Le registre et les dossiers sont conservés **dix ans** après la clôture, et communiqués à la COSUMAF sur demande.

### Article 22 — Revue mensuelle

Le comité des risques et de la conformité, réunion mensuelle de direction prévue par la Politique de gestion des risques et la Charte du contrôle interne, consacre un point de son ordre du jour au registre. Le RCCI y présente :

- les incidents et constats nouveaux du mois, avec leur gravité ;
- l'état des plans d'actions : ouverts, réalisés, en retard ;
- les actions à clore et les vérifications d'efficacité ;
- les incidents répétés et les leçons à partager.

Les décisions (validation d'un plan, report d'échéance, moyens alloués) sont consignées au procès-verbal de la réunion et reportées dans le registre.

### Article 23 — Rapport trimestriel au Conseil d'Administration

Chaque trimestre, le RCCI établit le rapport de l'Annexe 5, validé par le Directeur Général. Il est intégré au tableau de bord trimestriel présenté au Conseil d'Administration (Charte du contrôle interne, article 24 ; Politique de gestion des risques, article 29). Le Conseil peut demander des explications sur tout incident ou toute action en retard ; ses décisions figurent au procès-verbal de la séance.

### Article 24 — Synthèse annuelle

Chaque année, le RCCI fait la synthèse du registre :

- dans le **rapport annuel de contrôle interne**, transmis à la COSUMAF avant le 31 mars, aux rubriques prévues par le plan de l'Annexe 4 de la Charte du contrôle interne : constats et mesures prises, incidents ayant touché des clients, incidents informatiques, contrôles externes et suivi des recommandations ;
- dans la **mise à jour de la cartographie des risques** (Politique de gestion des risques, article 9) : chaque risque lié à un incident significatif ou majeur de l'année est recoté, et un risque révélé par un incident mais absent de la cartographie y est ajouté. Un incident majeur entraîne la mise à jour de la cartographie sans attendre la revue annuelle.

## Titre VII — Tirer les leçons

### Article 25 — Mise à jour des documents

Lorsque l'analyse montre qu'une règle est absente, imprécise ou inadaptée, le plan d'actions prévoit la modification du document concerné. Le RCCI enregistre la demande selon l'article 8 de la Procédure de maîtrise documentaire (PC-PRO-GOV-001), avec le numéro de l'incident ou du constat, et l'échéance de l'action s'applique à la publication du document révisé.

### Article 26 — Formation et partage

Lorsque la cause tient à un manque de compétence ou d'information, le plan d'actions prévoit une formation ou une sensibilisation, inscrite au plan de formation selon la Politique de formation (PC-POL-FOR-001). La preuve de réalisation est la liste de présence ou l'attestation de lecture.

Les leçons utiles à tous sont partagées sans nommer personne : par un point à la revue mensuelle, par un court message aux collaborateurs concernés, et chaque année lors de la formation obligatoire prévue par la Charte du contrôle interne (article 21).

### Article 27 — Indicateurs

Le RCCI suit les indicateurs suivants, présentés chaque trimestre dans le rapport de l'Annexe 5.

| Indicateur | Cible |
| --- | --- |
| Incidents déclarés, par gravité | Pas de cible : un nombre élevé d'incidents mineurs déclarés est le signe d'une bonne culture de déclaration |
| Incidents déclarés dans les 24 heures | 100 % |
| Analyses de causes terminées dans le délai | 100 % |
| Actions ouvertes | Suivi de la tendance |
| Actions en retard | 0 |
| Actions en retard de plus de trois mois | 0 |
| Incidents répétés | 0 |
| Actions jugées efficaces lors de la vérification | 90 % au moins |
| Incidents découverts par un tiers (client, COSUMAF, BVMAC) avant d'avoir été déclarés en interne | 0 |

## Titre VIII — Dispositions finales

### Article 28 — Contrôle

Le RCCI contrôle chaque trimestre que les incidents connus par d'autres sources (réclamations, rapprochements, journaux informatiques, courriers des autorités) figurent bien au registre.

Comme le RCCI tient lui-même le registre et vérifie les actions, la revue indépendante annuelle (Charte du contrôle interne, article 18) examine un échantillon d'incidents et d'actions closes, et le respect des délais de la présente procédure.

### Article 29 — Entrée en vigueur

La présente procédure entre en vigueur à la date de son approbation, indiquée dans la fiche de maîtrise documentaire. Elle est revue chaque année.
