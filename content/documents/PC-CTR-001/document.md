---
id: PC-CTR-001
titre: Convention de mandat d'arrangement et de placement
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
diffusion: Direction Générale, Direction des Marchés de Capitaux, Direction Commerciale, RCCI
public: false
resume: Modèle de convention par laquelle un émetteur mandate Purpose Capital S.A. pour structurer, faire viser par la COSUMAF et placer une levée de fonds (actions, obligations ou autres titres) sur le marché financier régional.
references:
  - ref: REG-01-22
    articles: Appel public à l'épargne, intermédiaires habilités, obligations d'information
  - ref: RG-COSUMAF-2023
    articles: Identité des arrangeurs et du chef de file dans le document d'information (art. 131), lettre de mandat dans le dossier de visa (art. 155), information permanente
  - ref: BVMAC-RM
    articles: Admission à la cote, centralisation, publication des résultats
  - ref: DC-RG
    articles: Inscription en compte, règlement-livraison
  - ref: REG-02-24
    articles: Vigilance à l'égard de l'émetteur et des souscripteurs
  - ref: AUSCGIE
    articles: Autorisations sociales d'émission, droits des actionnaires et des obligataires
  - ref: AUS
    articles: Constitution des garanties de l'emprunt
  - ref: AUA
    articles: Clause compromissoire, arbitrage CCJA
historique:
  - version: "0.9"
    date: 2026-10-19
    objet: Projet initial de modèle, rédigé en termes définis ; chaque donnée est saisie une seule fois dans le formulaire du référentiel
    par: Directeur des Marchés de Capitaux
notes_redaction:
  - Ne pas compléter ce modèle à la main. Utiliser « Préparer une convention » dans le référentiel ; le Word et le PDF ne sont produits que lorsque tous les champs requis sont renseignés et cohérents.
  - Faire valider le modèle par le conseil juridique de la Société avant sa première utilisation.
  - "Articles du Règlement général COSUMAF du 23 mai 2023 identifiés : art. 131 (arrangeurs et chef de file dans le document d'information) et art. 155 (lettre de mandat dans le dossier de visa). Vérifier sur le texte officiel l'article fondant le préambule (désignation d'une ou deux sociétés de bourse, syndicat de placement)."
  - La prise ferme et la garantie de bonne fin relèvent d'une convention distincte (PC-CTR-002) et des fonds propres de la Société ; elles ne sont pas couvertes par ce modèle.
  - Vérifier le traitement de la TVA et le régime fiscal applicable aux commissions et aux titres émis.
---

**ENTRE LES SOUSSIGNÉS :**

**{{emetteur_nom}}**, {% si emetteur_forme = autre %}{{emetteur_forme_autre}}{% fin %}{% si emetteur_forme != autre %}{{emetteur_forme}}{% fin %} au capital de {{emetteur_capital|lettres}}, immatriculée au Registre du Commerce et du Crédit Mobilier de {{emetteur_rccm_ville}} sous le numéro {{emetteur_rccm}}, dont le siège social est situé {{emetteur_siege}} ({{emetteur_pays}}), représentée par {{emetteur_representant}}, en sa qualité de {{emetteur_qualite}}, dûment habilité aux fins des présentes,

*ci-après « l'Émetteur »,*

**ET**

**Purpose Capital S.A.**, société anonyme avec conseil d'administration au capital de trois cent dix-sept millions cinq cent mille francs CFA (317 500 000 FCFA), société de bourse agréée par la COSUMAF sous le numéro COSUMAF-SDB-01/2026, immatriculée au Registre du Commerce et du Crédit Mobilier de Yaoundé sous le numéro {{pc_rccm}}, dont le siège social est situé Rue Joseph Essono Balla, Elig-Essono, Yaoundé (Cameroun), représentée par son Directeur Général, dûment habilité aux fins des présentes,

*ci-après « l'Arrangeur » ou « Purpose Capital »,*

ci-après désignées ensemble les « Parties » et individuellement une « Partie ».

## Préambule

**Considérant que** l'Émetteur, qui exerce son activité dans le secteur suivant : {{emetteur_secteur}}, envisage de lever des fonds sur le marché financier de l'Afrique centrale dans les conditions définies à l'article 1 et décrites à l'Annexe 1 (l'« Opération ») ;

**Considérant que** la réglementation du marché financier régional impose à l'émetteur de désigner une ou deux sociétés de bourse chargées d'assurer la supervision et l'exécution des opérations de placement, la société de bourse désignée pouvant constituer un syndicat de placement avec d'autres sociétés de bourse et établissements de crédit ;

**Considérant que** Purpose Capital est une société de bourse agréée par la COSUMAF, habilitée à exercer les activités d'arrangement, de conseil aux émetteurs et de placement de titres ;

**Considérant que** l'Émetteur souhaite confier à Purpose Capital le mandat d'arranger et de placer l'Opération, ce que Purpose Capital accepte dans les termes ci-après,

**IL A ÉTÉ CONVENU CE QUI SUIT :**

## Titre I — Objet et définitions

### Article 1 — Définitions

Dans la présente convention, les termes ci-dessous ont le sens qui leur est donné ci-après. Ils sont employés avec une majuscule dans le reste de la convention et de ses annexes.

**Termes de l'Opération**

- **Opération** : l'émission {% si mode_placement = ape %}par appel public à l'épargne{% fin %}{% si mode_placement = prive %}par placement privé{% fin %} de {% si titres_nature = autres %}{{titres_autre}}{% fin %}{% si titres_nature != autres %}{{titres_nature}}{% fin %} par l'Émetteur, dont les caractéristiques indicatives figurent à l'Annexe 1 ;
- **Titres** : les titres financiers émis dans le cadre de l'Opération, d'une valeur nominale unitaire de {{nominal}} ;
- **Montant de l'Opération** : {{montant|lettres}} ;
- **Seuil de réussite** : {{seuil|lettres}}, montant minimal de souscriptions en dessous duquel l'Opération est réputée non réalisée ;
- **Compte de centralisation** : le compte ouvert au nom {{compte_titulaire}} auprès de {{compte_banque}}, sur lequel sont centralisés les fonds versés par les souscripteurs ;
- **Période de souscription** : la période durant laquelle les investisseurs peuvent souscrire aux Titres, fixée dans le Document d'information ;
- **Date de règlement-livraison** : la date à laquelle les Titres sont inscrits en compte et les fonds versés à l'Émetteur, fixée dans le Document d'information.

**Termes généraux**

- **COSUMAF** : Commission de Surveillance du Marché Financier de l'Afrique Centrale ;
- **BVMAC** : Bourse des Valeurs Mobilières de l'Afrique Centrale ;
- **Dépositaire central** : le dépositaire central unique du marché financier régional ;
- **Document d'information** : le prospectus soumis au visa de la COSUMAF, y compris ses notes complémentaires et rectificatives ;
- **Syndicat de placement** : le groupement de sociétés de bourse et d'établissements de crédit constitué par l'Arrangeur pour placer les Titres ;
- **Événement défavorable significatif** : tout événement affectant de manière significative la situation financière, l'activité ou les perspectives de l'Émetteur, ou les conditions du marché financier régional.

En cas de divergence entre l'Annexe 1 et le Document d'information visé par la COSUMAF, ce dernier prévaut.

### Article 2 — Objet

L'Émetteur confie à Purpose Capital, qui l'accepte, un mandat d'**arrangeur** et de **chef de file du placement** de l'Opération. Ce mandat couvre :

1. la structuration financière de l'Opération ;
2. la préparation du Document d'information et du dossier de demande de visa auprès de la COSUMAF ;
3. l'organisation et la conduite du placement des Titres, seul ou au sein d'un Syndicat de placement ;
4. la centralisation des souscriptions, l'allocation des Titres et la coordination du règlement-livraison{% si admission = oui %} ;{% fin %}{% si admission = non %}.{% fin %}
{% si admission = oui %}
5. la préparation du dossier d'admission des Titres à la cote de la BVMAC.
{% fin %}

### Article 3 — Exclusivité

{% si exclusivite = exclusif %}
Pendant la durée de la convention, l'Émetteur s'interdit de confier à un tiers une mission ayant le même objet, et oriente vers l'Arrangeur toute sollicitation reçue d'investisseurs ou d'intermédiaires au titre de l'Opération.
{% fin %}

{% si exclusivite = coarrangement %}
L'Émetteur désigne {{coarrangeur}} en qualité de co-arrangeur. La répartition des missions et des commissions entre co-arrangeurs fait l'objet d'un avenant signé par les trois parties. L'Émetteur s'interdit de confier à tout autre tiers une mission ayant le même objet pendant la durée de la convention.
{% fin %}

### Article 4 — Durée

La convention prend effet à sa signature et expire à la plus proche des dates suivantes : (i) la remise du rapport de clôture prévu à l'article 11 ; (ii) l'expiration d'un délai de {{validite_mois|nombre}} mois suivant sa signature si le visa de la COSUMAF n'a pas été obtenu, sauf prorogation écrite.

## Titre II — Missions et engagements de l'Arrangeur

### Article 5 — Phase de structuration

L'Arrangeur :

- analyse les besoins de financement de l'Émetteur et propose la structure de l'Opération (nature des Titres, montant, maturité, taux ou prix, profil d'amortissement, garanties, tranches) ;
- conduit les diligences financières sur l'Émetteur, sur la base des documents listés à l'Annexe 3 ;
- recommande, le cas échéant, le recours à une agence de notation, à un garant ou à un représentant de la masse des obligataires ;
- établit, avec l'Émetteur, le calendrier indicatif de l'Opération (Annexe 2).

### Article 6 — Phase réglementaire

L'Arrangeur :

- rédige le Document d'information avec l'Émetteur et ses conseils, sur la base des informations fournies par l'Émetteur ;
- constitue et dépose le dossier de demande de visa auprès de la COSUMAF, en assure le suivi et coordonne les réponses aux observations du régulateur ;
- coordonne les intervenants : commissaires aux comptes, conseils juridiques, agence de notation, garant, Dépositaire central et BVMAC{% si admission = oui %} ;{% fin %}{% si admission = non %}.{% fin %}
{% si admission = oui %}
- prépare le dossier d'admission à la cote de la BVMAC.
{% fin %}

Aucun document d'information, de publicité ou de communication relatif à l'Opération n'est diffusé avant l'obtention du visa de la COSUMAF et, pour les documents promotionnels, sans la validation préalable de l'Arrangeur.

### Article 7 — Phase de placement

L'Arrangeur :

- élabore la stratégie de commercialisation et organise les présentations aux investisseurs ;
- constitue, s'il y a lieu, le Syndicat de placement et en coordonne les membres par convention séparée ;
- place les Titres auprès de sa clientèle et des investisseurs ciblés, dans le respect de ses obligations d'information et d'adéquation ;
- centralise les bulletins de souscription et les fonds sur le Compte de centralisation, et tient l'état quotidien des souscriptions ;
- propose à l'Émetteur les règles d'allocation, fixées dans le Document d'information, et les applique de façon équitable en cas de sursouscription ;
- coordonne avec le Dépositaire central le règlement-livraison des Titres.

### Article 8 — Nature de l'engagement de placement

L'Arrangeur est tenu d'une **obligation de moyens**. Il s'engage à déployer ses meilleurs efforts pour placer les Titres, sans garantir le montant qui sera souscrit.

Toute prise ferme ou garantie de bonne fin, totale ou partielle, ne peut résulter que d'une convention distincte, approuvée par le Directeur Général après avis du RCCI et dans le respect des normes prudentielles applicables à la Société.

## Titre III — Engagements de l'Émetteur

### Article 9 — Information et coopération

L'Émetteur :

- remet à l'Arrangeur, dans les délais du calendrier, l'ensemble des documents et informations listés à l'Annexe 3, ainsi que toute information nécessaire à la bonne exécution du mandat ;
- garantit que ces informations sont exactes, complètes et sincères, et informe sans délai l'Arrangeur de tout fait nouveau susceptible de les modifier ;
- donne à l'Arrangeur et à ses conseils un accès raisonnable à ses dirigeants, à ses commissaires aux comptes et à ses locaux ;
- obtient en temps utile les autorisations de ses organes sociaux requises par l'Acte uniforme OHADA relatif au droit des sociétés commerciales et du GIE et par ses statuts ;
- respecte, après l'Opération, ses obligations d'information permanente et périodique à l'égard de la COSUMAF, de la BVMAC et des porteurs de Titres.

### Article 10 — Déclarations et garanties

L'Émetteur déclare et garantit à l'Arrangeur, à la signature et à la Date de règlement-livraison :

1. qu'il est régulièrement constitué et dispose de la capacité et des autorisations nécessaires pour conclure la convention et réaliser l'Opération ;
2. que ses états financiers des {{nb_exercices|nombre}} derniers exercices donnent une image fidèle de sa situation et ont été certifiés par ses commissaires aux comptes ;
3. qu'aucun litige, procédure ou engagement non révélé n'est susceptible d'affecter significativement l'Opération ou sa capacité à honorer les Titres ;
4. qu'il est à jour de ses obligations fiscales et sociales ;
5. que le Document d'information ne contient aucune omission ou inexactitude de nature à induire les investisseurs en erreur.

L'Émetteur reste seul responsable du contenu du Document d'information à l'égard des investisseurs et des autorités.

### Article 11 — Fonds levés

Les fonds versés par les souscripteurs sont centralisés sur le Compte de centralisation, distinct des comptes propres de l'Arrangeur. Ils ne peuvent être utilisés avant la Date de règlement-livraison.

Si le Seuil de réussite n'est pas atteint à la clôture de la Période de souscription, l'Opération est annulée. Les fonds sont restitués aux souscripteurs sans frais dans un délai de {{delai_restitution|nombre}} jours ouvrés.

Dans un délai de {{delai_rapport|nombre}} jours ouvrés suivant la Date de règlement-livraison, l'Arrangeur remet à l'Émetteur un rapport de clôture indiquant le montant souscrit, la répartition des souscripteurs, l'allocation retenue et le décompte des commissions.

## Titre IV — Rémunération et frais

### Article 12 — Commissions

En contrepartie de ses services, l'Arrangeur perçoit les commissions suivantes, détaillées à l'Annexe 4 :

- une **commission d'arrangement** forfaitaire de {{com_arrangement|lettres}}, exigible à hauteur de {{com_arr_part}} à la signature et pour le solde à l'obtention du visa de la COSUMAF ;
- une **commission de placement** de {{com_placement}} des montants effectivement souscrits et libérés, exigible à la Date de règlement-livraison{% si com_succes = oui %} ;{% fin %}{% si com_succes = non %}{% si admission = oui %} ;{% fin %}{% si admission = non %}.{% fin %}{% fin %}
{% si com_succes = oui %}
- une **commission de succès** de {{com_succes_taux}} du montant placé au-delà de {{com_succes_seuil|lettres}}, exigible à la Date de règlement-livraison{% si admission = oui %} ;{% fin %}{% si admission = non %}.{% fin %}
{% fin %}
{% si admission = oui %}
- une **commission d'admission à la cote** de {{com_admission}}, exigible à la date d'admission.
{% fin %}

Les commissions s'entendent hors taxes. Chaque commission fait l'objet d'une facture distincte. Elles ne se compensent pas avec d'autres sommes et ne peuvent être déduites des fonds levés sans l'accord écrit préalable de l'Émetteur.

### Article 13 — Frais de l'Opération

Sont à la charge de l'Émetteur, qu'ils soient avancés ou non par l'Arrangeur : les droits et redevances de la COSUMAF, de la BVMAC et du Dépositaire central ; les honoraires des conseils juridiques, des commissaires aux comptes et de l'agence de notation ; les frais d'impression, de publication et de présentation aux investisseurs. Tout frais supérieur à {{seuil_frais}} avancé par l'Arrangeur est soumis à l'accord préalable de l'Émetteur et remboursé sur justificatif.

## Titre V — Conformité

### Article 14 — Confidentialité et information privilégiée

Chaque Partie garde confidentielles les informations reçues de l'autre au titre de la convention, sauf communication exigée par la loi, par une autorité de régulation ou nécessaire à l'exécution du mandat.

Les informations relatives à l'Opération constituent, jusqu'à leur publication, des informations privilégiées. L'Arrangeur inscrit les personnes y ayant accès sur une liste d'initiés et applique les règles de séparation des fonctions prévues par son Code de bonne conduite (PC-COD-001). L'Émetteur tient sa propre liste d'initiés et la communique à l'Arrangeur sur demande.

### Article 15 — Conflits d'intérêts

L'Arrangeur a déclaré à l'Émetteur, avant la signature, les liens capitalistiques, mandats ou relations d'affaires susceptibles de créer un conflit d'intérêts dans l'exécution du mandat : {{conflits}}. Tout conflit survenant en cours de mandat est porté sans délai à la connaissance de l'Émetteur.

### Article 16 — Lutte contre le blanchiment et le financement du terrorisme

L'Émetteur fournit à l'Arrangeur les éléments d'identification de la société, de ses dirigeants et de ses bénéficiaires effectifs requis par le Règlement CEMAC n° 02/24 du 20 décembre 2024. L'Arrangeur applique aux souscripteurs les mesures de vigilance prévues par ce texte et peut refuser toute souscription dont l'origine des fonds n'est pas justifiée. Ces obligations ne peuvent être levées par accord des Parties.

## Titre VI — Responsabilité et fin de la convention

### Article 17 — Responsabilité et indemnisation

L'Arrangeur répond des fautes commises dans l'exécution de ses missions. Il n'est pas responsable du contenu des informations fournies par l'Émetteur, ni de l'issue du placement.

L'Émetteur indemnise l'Arrangeur de toute perte, réclamation ou sanction résultant d'une inexactitude ou d'une omission dans les informations qu'il a fournies, ou d'un manquement à ses déclarations et garanties.

Sauf faute lourde ou dolosive, la responsabilité de l'Arrangeur est limitée au montant des commissions perçues au titre de la convention.

### Article 18 — Conditions de réalisation

Le lancement de la Période de souscription est subordonné à la réalisation des conditions suivantes :

1. obtention du visa de la COSUMAF sur le Document d'information ;
2. adoption des résolutions sociales autorisant l'émission ;
3. constitution des garanties prévues à l'Annexe 1, conformément à l'Acte uniforme OHADA portant organisation des sûretés ;
4. absence d'Événement défavorable significatif ;
5. paiement de la part de la commission d'arrangement exigible à la signature.

### Article 19 — Suspension et résiliation

L'Arrangeur peut suspendre l'exécution du mandat ou proposer le report de l'Opération en cas d'Événement défavorable significatif, après en avoir informé l'Émetteur par écrit.

Chaque Partie peut résilier la convention par lettre recommandée avec accusé de réception en cas de manquement grave de l'autre Partie non réparé dans un délai de {{delai_mise_en_demeure|nombre}} jours suivant mise en demeure.

En cas de résiliation par l'Émetteur hors manquement de l'Arrangeur, ou d'abandon de l'Opération par l'Émetteur, la commission d'arrangement reste acquise en totalité et les frais engagés sont remboursés. Si l'Émetteur réalise une opération de même objet dans les {{delai_tail|nombre}} mois suivant la résiliation, la commission de placement est due à l'Arrangeur comme si celui-ci avait placé l'Opération.

### Article 20 — Force majeure

Aucune Partie n'est responsable d'un retard ou d'une inexécution résultant d'un cas de force majeure. La Partie qui l'invoque en informe l'autre sans délai. Si l'empêchement dure plus de {{delai_force_majeure|nombre}} jours, chaque Partie peut résilier la convention sans indemnité, les commissions déjà exigibles restant dues.

## Titre VII — Dispositions finales

### Article 21 — Droit applicable

La convention est régie par le droit communautaire de la CEMAC, les Actes uniformes OHADA et, pour le surplus, le droit {{droit}}.

### Article 22 — Règlement des différends

Les Parties recherchent d'abord une solution amiable pendant {{delai_amiable|nombre}} jours. Elles peuvent recourir à la médiation de la COSUMAF.

{% si litiges = arbitrage %}
À défaut d'accord, le différend est tranché par voie d'arbitrage sous l'égide de la Cour Commune de Justice et d'Arbitrage (CCJA) de l'OHADA, par {{arbitres}}, à {{lieu_arbitrage}}, en langue française.
{% fin %}

{% si litiges = juridictions %}
À défaut d'accord, le différend est soumis aux juridictions compétentes de {{juridiction_ville}}.
{% fin %}

### Article 23 — Notifications

Les notifications sont faites par écrit, par lettre remise contre décharge, par lettre recommandée avec accusé de réception ou par courrier électronique confirmé, aux adresses indiquées en tête des présentes ou à toute autre adresse notifiée par la suite.

### Article 24 — Dispositions diverses

La convention et ses annexes expriment l'intégralité de l'accord des Parties sur son objet. Elle ne peut être modifiée que par avenant écrit signé des deux Parties. Aucune Partie ne peut la céder sans l'accord écrit de l'autre. La nullité d'une clause n'affecte pas les autres. Les annexes font partie intégrante de la convention.

Fait à {{lieu_signature}}, le {{date_signature}}, en {{nb_exemplaires|nombre}} exemplaires originaux.

@signatures(Pour l'Émetteur | {{emetteur_representant}}, {{emetteur_qualite}} ; Pour Purpose Capital S.A. | Le Directeur Général)
