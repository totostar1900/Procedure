---
id: PC-CTR-002
titre: Convention de prise ferme et de garantie de bonne fin
type: Modèle de contrat
domaine: Marchés de capitaux
version: "0.9"
statut: Projet
confidentialite: Interne
proprietaire: Directeur des Marchés de Capitaux
redige_par: Directeur des Marchés de Capitaux
verifie_par: Responsable de la conformité et du contrôle interne (RCCI)
approuve_par: Directeur Général
date_approbation:
date_effet:
prochaine_revue: 12 mois après adoption
diffusion: Direction Générale, Direction des Marchés de Capitaux, RCCI
public: false
resume: Modèle de convention par laquelle Purpose Capital S.A. s'engage envers un émetteur, en complément du mandat d'arrangement et de placement, soit à souscrire elle-même les titres (prise ferme), soit à souscrire le solde non placé à la clôture (garantie de bonne fin), dans la limite d'un montant garanti et sous conditions suspensives.
references:
  - ref: REG-01-22
    articles: Appel public à l'épargne, intermédiaires habilités, garantie de placement
  - ref: RG-COSUMAF-2023
    articles: "Identité des garants dans le document d'information (art. 131) ; normes prudentielles des sociétés de bourse (art. 11) ; information permanente"
  - ref: BVMAC-RM
    articles: Admission à la cote, centralisation, publication des résultats
  - ref: DC-RG
    articles: Inscription en compte, règlement-livraison
  - ref: AUSCGIE
    articles: Autorisations sociales d'émission, droits des actionnaires et des obligataires
  - ref: AUA
    articles: Arbitrage, Cour Commune de Justice et d'Arbitrage
  - ref: OICV-PRINCIPES
    articles: "Bonne pratique internationale : gestion des risques et des conflits d'intérêts des intermédiaires dans les opérations de placement"
historique:
  - version: "0.9"
    date: 2026-10-20
    objet: Projet initial de modèle, articulé avec la convention de mandat PC-CTR-001 ; chaque donnée est saisie une seule fois dans le formulaire du référentiel
    par: Directeur des Marchés de Capitaux
notes_redaction:
  - Ne pas compléter ce modèle à la main. Utiliser « Préparer une convention » dans le référentiel ; le formulaire calcule l'engagement de la Société en pourcentage de ses fonds propres et signale les seuils de la Politique de gestion des risques (alerte à 15 %, accord préalable du Conseil d'Administration au-delà de 25 %).
  - Faire valider le modèle par le conseil juridique de la Société avant sa première utilisation, en particulier les clauses de résiliation pour événement de marché, d'indemnisation et le traitement fiscal de la commission de garantie.
  - "Vérifier si les normes prudentielles de la COSUMAF imposent une couverture en fonds propres spécifique des engagements de garantie, ou une information préalable de la COSUMAF ; les limites internes de PC-POL-RIS-001 s'appliquent en attendant."
  - Une prise ferme ou une garantie conclue alors que la Société est aussi arrangeur crée un conflit d'intérêts dans l'allocation et la revente des Titres ; appliquer la Politique de gestion des conflits d'intérêts (PC-POL-CI-001).
---

**ENTRE LES SOUSSIGNÉS :**

**{{emetteur_nom}}**, {% si emetteur_forme = autre %}{{emetteur_forme_autre}}{% fin %}{% si emetteur_forme != autre %}{{emetteur_forme}}{% fin %} au capital de {{emetteur_capital|lettres}}, immatriculée au Registre du Commerce et du Crédit Mobilier de {{emetteur_rccm_ville}} sous le numéro {{emetteur_rccm}}, dont le siège social est situé {{emetteur_siege}} ({{emetteur_pays}}), représentée par {{emetteur_representant}}, en sa qualité de {{emetteur_qualite}}, dûment habilité aux fins des présentes,

*ci-après « l'Émetteur »,*

**ET**

**Purpose Capital S.A.**, société anonyme avec conseil d'administration au capital de trois cent dix-sept millions cinq cent mille francs CFA (317 500 000 FCFA), société de bourse agréée par la COSUMAF sous le numéro COSUMAF-SDB-01/2026, immatriculée au Registre du Commerce et du Crédit Mobilier de Yaoundé sous le numéro {{pc_rccm}}, dont le siège social est situé Rue Joseph Essono Balla, Elig-Essono, Yaoundé (Cameroun), représentée par son Directeur Général, dûment habilité aux fins des présentes,

*ci-après « le Garant » ou « Purpose Capital »,*

ci-après désignées ensemble les « Parties » et individuellement une « Partie ».

## Préambule

**Considérant que**, par une convention de mandat d'arrangement et de placement du {{date_mandat}} (la « Convention de mandat »), l'Émetteur a confié à Purpose Capital l'arrangement et le placement d'une émission de {% si titres_nature = autres %}{{titres_autre}}{% fin %}{% si titres_nature != autres %}{{titres_nature}}{% fin %} d'un montant de {{montant|lettres}} (l'« Opération ») ;

**Considérant que** la Convention de mandat ne comporte qu'une obligation de moyens et réserve toute prise ferme ou garantie de bonne fin à une convention distincte ;

**Considérant que** l'Émetteur souhaite s'assurer que tout ou partie de l'Opération sera souscrite, et que Purpose Capital accepte de prendre cet engagement sur ses fonds propres, dans les limites et aux conditions ci-après,

**IL A ÉTÉ CONVENU CE QUI SUIT :**

## Titre I — Objet et définitions

### Article 1 — Définitions

Les termes définis dans la Convention de mandat ont le même sens dans la présente convention. En outre :

- **Montant garanti** : {{montant_garanti|lettres}}, soit {{nb_titres_garantis}} Titres au Prix de souscription ;
- **Prix de souscription** : {{prix}} par Titre, égal au prix d'émission fixé dans le Document d'information ;
- **Clôture** : la clôture de la Période de souscription, prévue le {{souscription_fin}} ;
- **Solde non souscrit** : la différence, si elle est positive, entre le Montant de l'Opération et le montant des souscriptions valablement reçues et libérées à la Clôture, hors souscriptions du Garant au titre de la présente convention ;
- **Date de règlement-livraison** : le {{date_reglement}}, ou toute autre date fixée dans le Document d'information ;
- **Date limite** : le {{date_limite}}, date à laquelle toutes les conditions suspensives doivent être réalisées ;
- **Événement de marché** : l'un des événements énumérés à l'article 15.

### Article 2 — Objet

Par la présente convention, le Garant prend envers l'Émetteur un engagement de **{{engagement}}** portant sur le Montant garanti, dans les conditions définies au Titre II.

### Article 3 — Articulation avec la Convention de mandat

La Convention de mandat reste en vigueur. La présente convention la complète, sans la modifier, sur la seule question de la souscription des Titres par le Garant. En cas de contradiction sur ce point, la présente convention prévaut.

La fin de la Convention de mandat, pour quelque cause que ce soit, met fin de plein droit à la présente convention, sauf si les Titres ont déjà été réglés.

## Titre II — Engagement du Garant

### Article 4 — Nature de l'engagement

{% si engagement = bonne_fin %}
Le Garant s'engage à souscrire, au Prix de souscription, les Titres correspondant au Solde non souscrit, dans la limite du Montant garanti. Il ne souscrit rien si les souscriptions reçues à la Clôture atteignent le Montant de l'Opération.

Le placement auprès des investisseurs se poursuit dans les conditions de la Convention de mandat ; le Garant n'intervient qu'à la Clôture, pour le solde.
{% fin %}
{% si engagement = prise_ferme %}
Le Garant s'engage à souscrire, au Prix de souscription, la totalité des Titres correspondant au Montant garanti, à la Date de règlement-livraison, quel que soit le résultat du placement auprès des investisseurs.

Il peut ensuite céder ces Titres aux investisseurs, pendant la Période de souscription ou après, dans les conditions de l'article 8. Le risque de ne pas les revendre, ou de les revendre à un prix inférieur, est à sa charge.
{% fin %}

L'engagement du Garant est irrévocable sous réserve des conditions suspensives du Titre III et des cas de résiliation du Titre VI.

### Article 5 — Montant et part de l'Opération garantie

Le Montant garanti représente {{ratio_garanti}} du Montant de l'Opération. L'engagement du Garant ne peut en aucun cas dépasser ce montant, majoré, le cas échéant, des intérêts courus dus par lui en cas de retard.

{% si syndicat = syndicat %}
Le Montant garanti est assumé par un syndicat de garantie. La part de Purpose Capital est de {{part_pc}}, soit un engagement maximal de {{engagement_pc|lettres}}. Les autres membres du syndicat et leur part sont : {{cogarants}}.

Les engagements des membres du syndicat sont **conjoints et non solidaires** : chaque membre ne répond que de sa part. Purpose Capital coordonne le syndicat ; une convention de syndicat (PC-CTR-003) fixe les relations entre ses membres. La défaillance d'un membre n'augmente pas la part des autres, sauf accord écrit de leur part.
{% fin %}

### Article 6 — Mise en jeu et règlement

{% si engagement = bonne_fin %}
1. Au plus tard le jour ouvré suivant la Clôture, le Garant établit, sur la base de l'état de centralisation, le décompte du Solde non souscrit selon le modèle de l'Annexe 4, et le notifie à l'Émetteur.
2. Le Garant souscrit les Titres correspondants et verse leur prix sur le compte de centralisation dans un délai de {{delai_paiement|nombre}} jours ouvrés suivant la Clôture et, au plus tard, à la Date de règlement-livraison.
3. Les Titres souscrits par le Garant lui sont livrés à la Date de règlement-livraison, en même temps que ceux des autres souscripteurs.

Les souscriptions du Garant ne sont jamais servies avant celles des investisseurs. En cas de sursouscription, le Garant ne souscrit aucun Titre au titre de la présente convention.
{% fin %}
{% si engagement = prise_ferme %}
1. À la Date de règlement-livraison, le Garant verse le prix des Titres correspondant au Montant garanti sur le compte de centralisation, et les Titres lui sont livrés.
2. Les souscriptions recueillies auprès des investisseurs pour ces Titres sont servies par cession du Garant, au Prix de souscription, à la même date ou à une date ultérieure.
3. Le Garant établit le décompte de l'Annexe 4 et le remet à l'Émetteur dans les cinq jours ouvrés suivant la Date de règlement-livraison.
{% fin %}

### Article 7 — Fonds propres du Garant

À la date de la signature, l'engagement maximal de Purpose Capital représente {{ratio_fp}} de ses fonds propres arrêtés au {{date_fonds_propres}}. Purpose Capital déclare avoir obtenu les autorisations internes requises par sa Politique de gestion des risques ; accord du Conseil d'Administration : {{accord_conseil}}.

Purpose Capital maintient, jusqu'à la Date de règlement-livraison, des ressources disponibles suffisantes pour honorer son engagement.

### Article 8 — Titres détenus par le Garant

Les Titres souscrits par le Garant sont inscrits à son compte propre, distinct des comptes de ses clients. Le Garant peut les conserver ou les céder librement, dans le respect des règles du marché et de sa Politique de gestion des conflits d'intérêts :

- les ordres de ses clients sont toujours servis avant toute cession ou acquisition pour son compte propre ;
- il n'utilise aucune information privilégiée relative à l'Émetteur ;
- il informe l'Émetteur, à sa demande, du nombre de Titres qu'il détient.

## Titre III — Conditions suspensives

### Article 9 — Conditions

L'engagement du Garant est subordonné à la réalisation, au plus tard à la Date limite, et au maintien jusqu'à la Date de règlement-livraison, des conditions suivantes, détaillées à l'Annexe 2 :

1. obtention du visa de la COSUMAF sur le Document d'information, sans modification significative des termes de l'Opération non acceptée par le Garant ;
2. adoption des résolutions sociales de l'Émetteur autorisant l'émission ;
3. remise des documents de closing de l'Annexe 2, notamment l'avis juridique sur la validité de l'émission et les attestations des commissaires aux comptes ;
4. exactitude des déclarations et garanties de l'Émetteur, confirmée par le certificat de l'Annexe 3 ;
5. absence d'Événement défavorable significatif au sens de la Convention de mandat ;
6. paiement des sommes exigibles au titre de la Convention de mandat.

Le Garant peut renoncer par écrit à tout ou partie de ces conditions, à l'exception de la première.

### Article 10 — Défaut de réalisation

Si une condition n'est pas réalisée à la Date limite, et sauf renonciation du Garant, la présente convention devient caduque de plein droit, sans indemnité de part ni d'autre. Lorsque la condition non réalisée dépend de l'Émetteur, la moitié de la commission de garantie reste due, comme prévu à l'article 14.

## Titre IV — Engagements de l'Émetteur

### Article 11 — Déclarations et garanties

L'Émetteur réitère au profit du Garant les déclarations et garanties de la Convention de mandat. Il déclare en outre, à la signature, à la Clôture et à la Date de règlement-livraison :

1. que le Document d'information est exact, complet et ne contient aucune omission de nature à induire les investisseurs en erreur ;
2. qu'aucun fait nouveau significatif n'est survenu depuis le visa sans avoir fait l'objet d'une note complémentaire ;
3. que l'émission et la présente convention ne contreviennent à aucun engagement, statut ou décision qui le lie ;
4. que les Titres, une fois émis, seront valablement émis, entièrement libérés et librement cessibles.

Il remet à la Date de règlement-livraison le certificat de l'Annexe 3.

### Article 12 — Engagements

L'Émetteur s'engage :

- à informer immédiatement le Garant de tout fait susceptible de rendre inexacte une déclaration ou de constituer un Événement défavorable significatif ;
- à n'émettre, sans l'accord écrit du Garant, aucun titre de même nature pendant {{lockup_mois|nombre}} mois suivant la Date de règlement-livraison ;
- à affecter les fonds levés à l'utilisation annoncée dans le Document d'information ;
- à remplir ses obligations d'information à l'égard de la COSUMAF, de la BVMAC et des porteurs.

### Article 13 — Indemnisation

L'Émetteur indemnise le Garant, ses dirigeants et ses collaborateurs de toute perte, réclamation, frais de défense ou sanction résultant :

- d'une inexactitude ou d'une omission du Document d'information ou des informations fournies par l'Émetteur ;
- d'un manquement de l'Émetteur à ses déclarations, garanties ou engagements.

Cette indemnisation n'est pas due en cas de faute lourde ou dolosive du Garant, ou pour les informations fournies par le Garant lui-même. Elle survit à la fin de la convention pendant cinq ans.

## Titre V — Rémunération

### Article 14 — Commission de garantie

En contrepartie de son engagement, le Garant perçoit une **commission de garantie** de {{com_garantie}} du Montant garanti, soit {{com_garantie_montant|lettres}} hors taxes{% si syndicat = syndicat %}, répartie entre les membres du syndicat selon leur part{% fin %}.

La commission rémunère l'engagement pris, qu'il soit ou non mis en jeu. Elle est exigible à la Date de règlement-livraison. Si l'Opération est abandonnée par l'Émetteur après le visa, ou si la convention est résiliée pour un manquement de l'Émetteur, la moitié de la commission reste due.

La commission fait l'objet d'une facture distincte des commissions de la Convention de mandat. Elle ne se compense pas avec le prix des Titres souscrits par le Garant.

## Titre VI — Résiliation

### Article 15 — Faculté de résiliation du Garant

Le Garant peut résilier la présente convention par notification écrite, à tout moment avant le versement du prix des Titres qu'il souscrit, lorsque survient l'un des événements suivants :

1. une suspension générale des négociations à la BVMAC, ou une interruption du règlement-livraison par le Dépositaire central, de plus d'un jour de bourse ;
2. un événement politique, économique, financier ou sécuritaire majeur, dans la CEMAC ou dans le pays de l'Émetteur, qui rend, de l'avis raisonnable du Garant, la réalisation de l'Opération impossible ou gravement compromise ;
3. un Événement défavorable significatif affectant l'Émetteur ;
4. l'inexactitude d'une déclaration ou le manquement à un engagement de l'Émetteur ;
5. une décision d'une autorité suspendant ou retirant le visa.

Avant de résilier, le Garant consulte l'Émetteur, si les délais le permettent, pour rechercher un report de l'Opération.

### Article 16 — Force majeure

Aucune Partie n'est responsable d'une inexécution résultant d'un cas de force majeure. Si l'empêchement dure plus de {{delai_force_majeure|nombre}} jours, chaque Partie peut résilier la convention sans indemnité.

### Article 17 — Effets de la résiliation

La résiliation libère le Garant de son engagement de souscription. Elle ne remet pas en cause les Titres déjà réglés, l'indemnisation de l'article 13 ni la commission due en application de l'article 14. Elle n'affecte pas la Convention de mandat, sauf décision contraire des Parties.

## Titre VII — Dispositions finales

### Article 18 — Confidentialité, conflits d'intérêts et vigilance

Les articles 14 à 16 de la Convention de mandat (confidentialité et information privilégiée, conflits d'intérêts, lutte contre le blanchiment et le financement du terrorisme) s'appliquent à la présente convention.

### Article 19 — Droit applicable

La convention est régie par le droit communautaire de la CEMAC, les Actes uniformes OHADA et, pour le surplus, le droit {{droit}}.

### Article 20 — Règlement des différends

Les Parties recherchent d'abord une solution amiable pendant {{delai_amiable|nombre}} jours. Elles peuvent recourir à la médiation de la COSUMAF.

{% si litiges = arbitrage %}
À défaut d'accord, le différend est tranché par voie d'arbitrage sous l'égide de la Cour Commune de Justice et d'Arbitrage (CCJA) de l'OHADA, par {{arbitres}}, à {{lieu_arbitrage}}, en langue française.
{% fin %}

{% si litiges = juridictions %}
À défaut d'accord, le différend est soumis aux juridictions compétentes de {{juridiction_ville}}.
{% fin %}

### Article 21 — Dispositions diverses

Les notifications sont faites par écrit, par lettre remise contre décharge, par lettre recommandée avec accusé de réception ou par courrier électronique confirmé. La convention et ses annexes expriment l'intégralité de l'accord des Parties sur son objet ; elle ne peut être modifiée que par avenant écrit signé des deux Parties, ni cédée sans l'accord écrit de l'autre Partie. La nullité d'une clause n'affecte pas les autres. Les annexes font partie intégrante de la convention.

Fait à {{lieu_signature}}, le {{date_signature}}, en {{nb_exemplaires|nombre}} exemplaires originaux.

@signatures(Pour l'Émetteur | {{emetteur_representant}}, {{emetteur_qualite}} ; Pour Purpose Capital S.A. | Le Directeur Général)
