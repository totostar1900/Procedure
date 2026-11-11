---
id: PC-CTR-004
titre: Convention d'ouverture de compte-titres
type: Modèle de contrat
domaine: Clientèle
version: '0.9'
statut: Projet
confidentialite: Interne
proprietaire: Directeur Général
redige_par: Directeur Général
verifie_par: Responsable de la conformité et du contrôle interne (RCCI)
approuve_par: Directeur Général
date_approbation: null
date_effet: null
prochaine_revue: 12 mois après adoption
diffusion: 'Direction Générale, Direction Commerciale, RCCI, opérations'
public: false
resume: 'Modèle de convention de compte-titres entre Purpose Capital S.A., teneur de compte, et le Client : ouverture et fonctionnement du compte, comptes particuliers et procuration, catégorisation des clients, ordres et leur transmission, conservation, tarification, fiscalité, résiliation.'
references:
  - ref: REG-01-22
    articles: 'Obligations des intermédiaires envers leurs clients, tenue de compte et conservation'
  - ref: RG-COSUMAF-2023
    articles: Identification et vérification des clients (art. 94 et 98) ; information des clients ; traitement des réclamations
  - ref: DC-RG
    articles: 'Inscription en compte, conservation et règlement-livraison des titres'
  - ref: REG-02-24
    articles: 'Vigilance à l''égard de la clientèle, conservation des documents pendant dix ans'
  - ref: LOI-CM-2024-017
    articles: Information des personnes et droits sur leurs données personnelles
  - ref: AUA
    articles: 'Arbitrage, si les Parties le choisissent'
historique:
  - version: '0.9'
    date: '2026-11-11'
    objet: 'Remplacement du texte par la convention de compte-titres (version transmise par la Direction), mise au format du référentiel'
    par: 'Directeur Général, RCCI'
  - version: '0.9'
    date: '2026-11-03'
    objet: mineur
    par: RCCI
  - version: '0.9'
    date: '2026-11-03'
    objet: mineur
    par: RCCI
  - version: '0.9'
    date: '2026-11-03'
    objet: mineur
    par: RCCI
  - version: '0.9'
    date: '2026-10-19'
    objet: 'Reprise de la convention du Guichet (version 2026-10-10), complétée par les articles 11 à 14 et rendue disponible pour les ouvertures hors du Guichet'
    par: Directeur Général
notes_redaction:
  - 'Texte en cours de remplacement par la convention de compte-titres transmise par la Direction (brouillon déposé le 4 novembre 2026, à reprendre par le RCCI). À sa publication, mettre à jour les passages « convention » du Guichet avec le nouveau texte, le même jour.'
  - 'Le formulaire sert aux ouvertures sur papier ou hors du Guichet. Dans le Guichet, la convention est remplie automatiquement à partir du dossier et acceptée électroniquement.'
  - Faire valider le modèle par le conseil juridique de la Société avant sa première utilisation.
---

**ENTRE LES SOUSSIGNÉS :**

**PURPOSE CAPITAL S.A.**, société anonyme au capital de trois cent dix-sept millions cinq cent mille francs CFA (317 500 000 FCFA), dont le siège social est situé à Elig-Essono, Rue Joseph Essono Balla, face Mahima, Yaoundé (Cameroun), immatriculée au registre du commerce de Yaoundé sous le numéro RC/YAO/2025/M/336, société de bourse agréée par la Commission de Surveillance du Marché Financier de l'Afrique Centrale sous le numéro COSUMAF-SDB-01/2026,

*ci-après dénommée « le Teneur de compte »,* représentée par son Directeur Général, dûment habilité(e) ;

**ET**

{% si titulaire_type = physique %}
Monsieur/Madame **{{titulaire_nom}}**, né(e) le {{naissance}}, de nationalité {{nationalite}}, titulaire de la pièce d'identité {{piece}}, profession : {{profession}}, adresse complète : {{adresse}}, {{ville}},
{% fin %}
{% si titulaire_type = morale %}
**{{titulaire_nom}}**, {{forme}}, immatriculée sous le numéro {{immatriculation}}, adresse complète : {{adresse}}, {{ville}},
{% fin %}
{% si titulaire_type = groupement %}
**{{titulaire_nom}}**, {{forme}}, {{immatriculation}}, adresse complète : {{adresse}}, {{ville}},
{% fin %}

*ci-après dénommé « le Client »,* représenté par :

{% si titulaire_type = physique %}
Monsieur/Madame ……………………………………………………………………………………………
{% fin %}
{% si titulaire_type = morale %}
Monsieur/Madame {{representant}}, en sa qualité de {{representant_qualite}}, dûment habilité(e) ;
{% fin %}
{% si titulaire_type = groupement %}
Monsieur/Madame {{representant}}, en sa qualité de {{representant_qualite}}, dûment habilité(e) ;
{% fin %}

Compte-titres n° **{{numero_compte}}**.

**IL A ÉTÉ CONVENU CE QUI SUIT :**

**Préambule**

Le Teneur de compte est une société de bourse qui gère pour le compte de ses Clients la tenue de compte et la conservation de titres et/ou les accompagne, par son expérience, dans la prise de décisions relatives aux questions d’investissements.

Le Client est une personne physique intéressée par les services de tenue de compte titres.

Le Client reconnaît avoir disposé des informations relatives à l’ouverture et au fonctionnement d’un compte titres.

Le Mandant certifie l’exactitude de l’ensemble des renseignements le concernant.

En conséquence, les parties se sont rapprochées à l'effet d'arrêter les termes, conditions et modalités de cette convention (ci-après, la « Convention »).

## Titre I — Objet et ouverture du compte

### Article 1 — Objet de la convention et réglementation applicable

#### 1.1 Objet de la Convention

La présente convention de compte-titres (ci-après “la Convention”) a pour objet de régir les relations entre Purpose Capital (ci-après “le Teneur de compte”) et le(s) titulaire(s) désigné(s) (ci-après “le Client”) relatives à l'ouverture et au fonctionnement d'un compte- titres.

#### 1.2 Réglementation applicable

La Convention est régie par le Règlement ministériel N°01/22/CEMAC/UMAC/CM/COSUMAF du 21 Juillet 2022 portant organisation et fonctionnement du Marché Financier de l’Afrique Centrale, et le règlement Général de la Commission de Surveillance du Marché Financier d’Afrique Centrale (COSUMAF) du 23 Mai 2023.

La Convention tient compte des articles 3 et suivants l’instruction n° 02-10 du 28 avril 2010 de la COSUMAF, relative à la convention d’ouverture de compte titres, qui précisent les clauses obligatoires devant figurer dans la convention d'ouverture de compte entre un teneur de compte titres et son Client ; de l’instruction COSUMAF n° 03- 15 du 10 décembre 2015 portant cahier de charges des teneurs de compte conservateurs.

La Convention tient également compte des précisions apportées par :

- le décret n° 2014/3763/PM du 13 novembre 2014 fixant les conditions d’application de la loi n° 2014/007 du 23 avril 2014 fixant les modalités de la dématérialisation des valeurs mobilières au Cameroun;
- du règlement 01/14/CEMAC-UMAC-CM/ du 25 avril 2014 portant institution d’un régime d’inscription en compte des valeurs mobilières et autres instruments financiers dans la CEMAC ;
- du règlement n° 04/CEMAC/UMAC/CM relatif au marché des titres de créances négociables de la CEMAC ;
- du Décret n° 2007/0457/PM du 4 avril 2007 modifiant et complétant certaines dispositions du décret n°94/611/pm du 30 décembre 1994 portant réglementation de l’émission et de la gestion des Effets Publics Négociables ;
- et toutes autres réglementations en vigueur.

### Article 2 — Conditions d'ouverture et de fonctionnement du compte-titres

#### 2.1 Définitions

**Le compte titres** est un compte qui accueille les dépôts de titres ou de valeurs mobilières sous leur forme immatérielle. Il obéit à une organisation et comptabilité spécifique et est indispensable à tout investisseur souhaitant faire des transactions sur des valeurs mobilières ou sur le marché financier. Il enregistre les transactions sur titres. Le compte titres est obligatoirement rattaché à un compte dans une banque ou dans un établissement de paiement. Cette information sera communiquée par le Client.

La tenue de comptes consiste d’une part, à enregistrer dans les livres du Teneur de compte, les écritures comptabilisant les différents mouvements et opérations sur valeurs mobilières et d’autre part, à conserver et administrer lesdits titres pour le compte du Client.

#### 2.2 Conditions générales d'ouverture de compte

Toute personne physique capable ou dûment représentée peut-être titulaire d'un compte-titres. Néanmoins, PURPOSE CAPITAL s’interdit l’ouverture d’un compte-titres sous anonymat et demeure libre de refuser l'ouverture d'un compte-titres sans avoir à motiver sa décision.

Le Teneur de compte ouvre un compte-titres après avoir opéré les vérifications nécessaires conformément aux dispositions légales et réglementaires en vigueur. La vérification de l'identité et du domicile du Client se fait sur présentation d'une pièce d'identité officielle portant signature (avec photographie) en cours de validité et d'un justificatif de domicile datant de moins de 3 mois.

Le cas échéant, devront être fournis préalablement à l'ouverture du compte-titres les documents officiels justifiant des pouvoirs du (ou des) représentant(s) légal (aux) ou judiciaire(s) du Client.

L'ouverture du compte-titres s'accompagne du dépôt d'un spécimen de signature du (ou des) titulaire(s) du compte et des personnes habilitées à le faire fonctionner, chez le Teneur de compte.

En plus des éléments suscités, l’ouverture du compte-titres requière la fourniture des éléments ci-après :

- Une photo 4x4 ;
- Un plan de localisation du domicile ;
- Une attestation d’immatriculation fiscale ;
- Un relevé d’identité bancaire.

Les dispositions ci-dessus sont applicables à tous les Co-titulaires d'un compte collectif. Tout mandataire ou représentant éventuellement désigné pour faire fonctionner le compte doit également justifier de son identité et de son domicile dans les mêmes conditions.

Le Teneur de compte conserve les références ou la copie des divers documents présentés.

Le compte-titres est obligatoirement associé à un compte espèces (Compte Courant) au nom du titulaire du compte-titres ou de l’un des co-titulaires le cas échéant sur lequel sont enregistrés les crédits et débits correspondant aux opérations effectuées sur le compte-titres. Le Client qui ouvre un compte-titres reconnaît expressément avoir pris connaissance et accepté les conditions du Teneur de compte.

Le compte-titres peut être un compte individuel, joint, indivis ou un compte en usufruit et nue-propriété, tel que défini à l'article 2.3 infra.

Le Teneur de compte doit par ailleurs être informé de tout changement dans la situation du Client (changement d'état civil, régime matrimonial, capacité juridique…) et de tout élément susceptible d'affecter le fonctionnement du compte-titres (adresse, numéros de téléphone…). A défaut d'une telle information, le Teneur de compte considérera comme exactes les informations dont elle dispose.

Les éléments d'identification du compte-titres figurent sur le formulaire d'ouverture du compte-titres.

#### 2.3 Dispositions spécifiques à certaines natures de compte-titres

#### 2.3.1 Compte-titres joint

Le compte-titres joint permet à chaque Co-titulaire de faire, séparément, toutes opérations sur ce compte-titres.

Les Co-titulaires sont tenus solidairement vis-à-vis du Teneur de compte de l'exécution de tous engagements portant la signature de l'un d'entre eux.

Sans accord du (ou des) autre(s) Co-titulaire(s), il peut être mis fin à la situation de compte-titres joint par désolidarisation d'un des Co-titulaires, par lettre recommandée avec accusé de réception adressée au Teneur de compte. Cette désolidarisation a pour effet la transformation, après réception de la lettre recommandée avec accusé de réception, du compte-titres joint en compte- titres indivis (voir ci-après).

Chaque Co-titulaire reste néanmoins tenu solidairement pour les opérations effectuées avant cette désolidarisation.

Un compte-titres joint ne peut être ouvert avec une personne morale, un mineur non émancipé ou un majeur protégé.

#### 2.3.2 Compte-titres indivis

Le compte-titres indivis est un compte qui est ouvert au nom de plusieurs Co-indivisaires et qui requiert, tant pour son ouverture que pour son fonctionnement, la signature conjointe de tous les Co-indivisaires, sauf procuration donnée à l'un d'eux ou à un tiers ou mandat réciproque.

Les Co-indivisaires sont tenus solidairement de leurs engagements vis-à-vis de PURPOSE CAPITAL.

#### 2.3.3 Compte-titres en usufruit et nue-propriété

Le compte-titres en nue-propriété est un compte en démembrement de propriété où le capital appartient au nu- propriétaire et les revenus des titres sont versés sur un compte espèces ouvert au nom de l'usufruitier.

Les ordres, actes de disposition (notamment les ordres d'achat et de vente ou les ordres de transfert ou de virement) doivent être signés par l'usufruitier et le nu-propriétaire, sauf s'il existe une procuration donnée à l'un d'eux ou mandat réciproque. Les actes d'administration courante pourront être faits à la seule initiative de l'usufruitier.

Seul le nu-propriétaire, en sa qualité d'actionnaire, peut exercer les droits attachés à sa qualité d'actionnaire (notamment exercer l'option du paiement de dividendes en actions proposée par l'assemblée des actionnaires). L'usufruitier est seul responsable d'avertir le nu-propriétaire pour lui permettre d'exercer ses droits.

L'usufruitier bénéficie du paiement du dividende et des fruits des titres.

En cas de cession, remboursement, amortissement des titres, le capital est versé sur le compte espèces du nu-propriétaire qui a l'entière responsabilité du réemploi des sommes provenant des titres cédés, remboursés ou amortis.

#### 2.3.4 Compte-titres de mineurs

L'ouverture d'un compte-titres au nom d'un mineur ainsi que les opérations sur le compte-titres sont réalisées par le(s) représentant(s) légal(aux), seul(s) responsable(s) de la régularité du fonctionnement du compte.

#### 2.3.5 Compte-titres de majeurs protégés

L'ouverture et le fonctionnement des compte-titres ouverts aux majeurs protégés sont soumis au régime de protection ordonné par l'autorité judiciaire (sauvegarde de justice, administration légale sous contrôle judiciaire, curatelle, tutelle…).

L'ouverture du compte-titres ne peut se faire que sur présentation de l’ordonnance du juge des tutelles et dans les conditions définies dans la décision de justice. Le compte fonctionnera en conséquence selon le régime de protection ordonné et selon les modalités fixées par l'autorité judiciaire.

En cas de survenance d'une mesure de protection en cours de vie du compte-titres, il appartient au représentant du Client, devenu majeur protégé, d'informer le teneur de compte de la mesure de mise en protection sur présentation de la pièce justificative (copie de la décision de justice).

#### 2.4 Titres nominatifs administrés

Les titres nominatifs administrés sont des titres financiers individualisés inscrits dans les registres de la société émettrice sous le nom de leur détenteur qui en confie par ailleurs leur administration à son intermédiaire financier habituel.

A cet effet, le (ou les) titulaires(s) du compte donne(nt) mandat par la présente Convention à PURPOSE CAPITAL qui accepte d'administrer ses titres financiers nominatifs dont les inscriptions figurent en compte chez les émetteurs et seront reproduites à son (ou leurs) compte(s)-titres ouvert(s) dans les livres de PURPOSE CAPITAL.

En vertu de ce mandat, le teneur de compte effectuera tous les actes d'administration, pour le compte du (ou des) Client(s) et notamment l'encaissement des produits (revenus, dividendes...).

En revanche, les actes de disposition, notamment l'exercice des droits aux augmentations de capital, les règlements titres ou espèces, sont effectués sur instruction expresse et préalable du (ou des) Client(s). Le (ou les) Client(s) pourra(ont) se prévaloir de son (leur) acceptation tacite pour certaines opérations conformément aux usages en vigueur. Le teneur de compte avise le (ou les) Client(s) des opérations qui affectent le compte-titres. Les relevés de portefeuille et les comptes rendus d'opérations sont envoyés selon les modalités prévues à l'article 11 « Informations » de la présente Convention.

Les droits pécuniaires (dividendes, attribution d'actions gratuites...) attachés aux titres nominatifs administrés peuvent être exercés indifféremment par les Co-titulaires dans le cas d'un compte-titres joint.

Les droits extra-pécuniaires (participation et vote aux assemblées générales des actionnaires...) attachés à ces titres financiers sont exercés par le Co-titulaire premier nommé dans l'intitulé du compte-titres.

S'agissant de titres financiers faisant l'objet d'une inscription directe chez l'émetteur, le Client reconnaît avoir été informé des risques liés notamment à la mauvaise exécution par l'émetteur des instructions sur ces titres, sur des potentielles difficultés de reconnaissance des droits du Client, dont le Teneur de compte ne pourra pas être tenue responsable, et des erreurs de valorisation concernant ces titres.

Le mandat d'administration peut être dénoncé à tout moment et sans aucun préavis par l'une ou l'autre partie, par lettre recommandée avec accusé de réception et prendra effet à réception de la lettre.

Cette dénonciation entraîne la clôture immédiate du compte-titres.

#### 2.5 La procuration

Le Client peut par écrit et pour une durée indéterminée, donner procuration à une ou plusieurs personne(s) physique(s) capable(s) et non interdite(s) bancaire(s) ou judiciaire(s) (ci-après dénommé le « Mandataire ») afin d'effectuer, en son nom pour son compte et sous son entière responsabilité, toutes opérations sur son compte-titres, à l'exception de la clôture.

Le Client s'engage à informer personnellement son (ou ses) mandataire(s) des termes de la Convention.

La procuration sera donnée par acte séparé précisant la nature des opérations pouvant être effectuées par le mandataire. Dans le cas d'un compte-titres joint, la signature de tous les Co-titulaires sera exigée.

Dans ce dernier cas, la (ou les) personne(s) choisie(s) doit(vent) également être autorisée(s) à faire fonctionner le compte espèces associé.

Le Mandataire désigné doit justifier de son identité et de son domicile, et présenter à ce titre :

- un document officiel d'identité probant en cours de validité comportant sa photographie,
- un justificatif de domicile datant de moins de 3 mois,
- déposer un spécimen de sa signature et être approuvé par le teneur de compte.

En cas de refus de l’approbation du Mandataire, le Teneur de compte en informera le Client par écrit et par tout moyen dans les meilleurs délais.

Les opérations effectuées par le Mandataire, dans le cadre des pouvoirs que le Client lui a confiés, engagent l'entière responsabilité du Client.

Le Mandataire d'un Compte collectif doit être désigné d'un commun accord par écrit par tous les Co-titulaires du compte-titres.

Cette procuration prend fin que le compte-titres soit individuel ou collectif, dans les cas suivants :

- révocation de la procuration par le Client,
- renonciation à la procuration par le Mandataire,
- décès ou incapacité du Client ou du Mandataire,
- changement d'un des titulaires d'un compte joint ou indivis ou transformation en compte individuel,
- Clôture du compte-titres.

Dans tous les cas, le Client ou le cas échéant le Mandataire doit notifier le Teneur de compte de la survenance de l'une des situations listées ci-dessus, par pli recommandé avec accusé de réception.

La révocation ou la renonciation prendra effet à la date de réception du courrier par le bureau de poste gestionnaire ou le Centre financier sous réserve des opérations en cours.

Le Client qui révoque par écrit une procuration doit en informer simultanément son Mandataire et, le cas échéant, s'engage à en justifier auprès d’PURPOSE CAPITAL.

### Article 3 — Catégorisation et classification des clients

#### 3.1 Catégorisation et changement de catégorie des Clients

Le Client est informé par le Teneur de compte, sur l’attestation de domiciliation de compte titres, de sa catégorisation en qualité d’“Investisseur qualifié”, ou “Investisseur non qualifié”.

#### 3.1.1 Définition des catégories de Clients

Le règlement général de la COSUMAF distingue deux grandes catégories de Clients :

#### 3.1.1.1 Les Clients dits « Investisseurs non qualifiés »

Ces Clients bénéficient du niveau de protection le plus élevé, selon les dispositions légales et réglementaires.

#### 3.1.1.2 Les Clients dits « investisseurs qualifiés »

L’investisseur qualifié s’entend de la personne ou l’entité disposant des compétences et des moyens nécessaires pour appréhender les risques inhérents aux opérations sur valeurs mobilières ou autres produits de placement.

Il possède l'expérience, les connaissances et la compétence nécessaires pour prendre ses propres décisions d'investissement et évaluer correctement les risques encourus.

Le Règlement ministériel N°01/22/CEMAC/UMAC/CM/COSUMAF du 21 Juillet 2022 portant organisation et fonctionnement du Marché Financier de l’Afrique Centrale en son article 89 dispose que :

Sont notamment considérés comme investisseurs qualifiés :

- les établissements de crédit et autres intermédiaires ou établissements financiers agréés ou réglementés ;
- les organismes de placement collectif ainsi que leurs sociétés de gestion ;
- les entreprises d’assurance et de réassurance ;
- les sociétés de groupe d’assurance ;
- les mutuelles et unions de mutuelles ;
- les institutions de prévoyance ;
- les caisses de retraite et autres organismes publics ou privés de dépôt et de gestion de fonds ;
- les organismes de financement du développement ;
- les sociétés de bourse et autres intermédiaires de marché agréés ;
- les fonds d’investissement.

Les Clients dits "Investisseurs qualifiés" sont présumés posséder l'expérience et les connaissances nécessaires pour comprendre les risques inhérents aux instruments, transactions ou services pour lesquels ils sont catégorisés comme tel.

#### 3.1.2 Changement de catégorie

Le Client s'engage à informer PURPOSE CAPITAL de tout changement susceptible de modifier sa catégorisation. Le Client peut demander à changer de catégorie pour se placer soit sous un régime plus protecteur soit pour renoncer à une partie des protections dont il bénéficie. La demande de changement de catégorie doit être adressée par courrier au Teneur de compte qui se réserve le droit de la refuser.

#### 3.2 Classification des Clients

En considération des informations que lui a communiquées le Client, notamment sur sa situation financière, son expérience, et ses connaissances en matière financière, le teneur de compte détermine la classification dont le Client relève.

En l'absence d'information concernant la situation financière, les objectifs, l'expérience et la connaissance en matière financière du Client, le teneur de compte doit s'abstenir de fournir le service de conseil en investissement et catégorise d'office le Client en "Investisseur non qualifié". Dans le cadre du service de réception et transmission d'ordres pour le compte de tiers, le Teneur de compte informe le Client qu'il n'est pas tenue d'évaluer le caractère approprié du service ou de l'instrument financier. L'ordre transmis par le Client, de sa propre initiative, relève de l'exécution simple.

## Titre II — Titres, marchés et ordres

### Article 4 — Classification et forme des titres financiers inscriptibles en compte

#### 4.1 Classification des titres financiers

au sens de l’article 6 du Règlement ministériel N°01/22/CEMAC/UMAC/CM/COSUMAF du 21 Juillet 2022 portant organisation et fonctionnement du Marché Financier de l’Afrique Centrale :

Ce sont principalement :

- les valeurs mobilières ;
- les effets publics négociable issus de la titrisation de la dette intérieure d’un ou de plusieurs Etats membre de la CEMAC ;
- titres de créances négociables supervisés par la BEAC ;
- les Sukuks et les titres financiers assimilés.

#### 4.2 La forme des titres financiers

Les titres financiers recouvrent la forme soit de titres au porteur soit de titres nominatifs.

Conformément aux dispositions de l’article 7 du règlement 01/14/CEMAC-UMAC-CM/ du 25 avril 2014, lorsque les titres ou instruments financiers sont inscrits dans un compte titres tenu par un intermédiaire financier agrée, ils sont dits « au porteur ».

Conformément aux dispositions de l’article 8 du règlement 01/14/CEMAC-UMAC-CM/ du 25 avril 2014, lorsque les titres ou instruments financiers sont inscrits dans un compte titres tenu par la personne morale émettrice, ils sont dits « nominatifs ».

Les titres nominatifs administrés par les personnes morales émettrices sont dits « nominatifs purs »

Les titres nominatifs administrés, en vertu d’un mandat, par un intermédiaire financier agrée, sont dits « nominatifs administrés ».

### Article 5 — Les marchés

Le Teneur de compte réalise les transactions sur les titres financiers (marché des actions et des obligations) admis aux négociations sur le Marché Financier d’Afrique Centrale, sur le Marché des titres publics de la CEMAC et sur le marché privé (titres de créances négociable et actions nominatives).

### Article 6 — Les ordres

Les ordres de bourse et opérations sur OPCVM sont exprimés en francs CFA.

#### 6.1 Couvertures des ordres

Un ordre d’achat n’est valable, c’est-à-dire, accepté par le « teneur de compte », que si le « Client » constitue préalablement dans le compte espèces de PURPOSE CAPITAL, une provision espèces suffisante pour couvrir l’opération qu’il envisage.

Cette provision est fonction des quantités demandées et du prix unitaire des titres demandés.

Le « Client » ne peut vendre que les Titres qu’il détient effectivement sous bonne date de valeur, et n’acheter des titres qu’à hauteur de sa limite d’autorisation ou de la provision espèces qu’il aura préalablement constituée.

En cas d’absence de provision, le « Teneur de compte » ne peut être mis en cause pour non traitement et exécution de l’ordre. Tout ordre régulièrement enregistré et exécuté par le « Teneur de compte » ne pourra plus être contesté par le « Client ».

#### 6.2 Mentions obligatoires sur les ordres du « Client »

Tout ordre d’achat ou de vente de titres doit comporter les informations suivantes sous peine de nullité :

- la désignation du titre objet de la transaction,
- le nombre de titres,
- le titre objet de la transaction,
- le sens de l’opération,
- le prix ou la fourchette de prix,
- la durée de validité de l’ordre,
- l’identité complète du donneur d’ordre,
- la date de dépôt de l’ordre,
- la signature du Client,
- les numéros de comptes espèces et titres du « Client ».

#### 6.3 Les types d’ordre

#### 6.3.1 L'ordre “à cours limité”

Il s'agit d'un ordre par lequel le donneur d'ordre (le Client), acheteur, fixe le prix maximal qu'il est disposé à payer ou par lequel le donneur d'ordre, vendeur, fixe le prix minimal auquel il accepte de céder ses titres. Ce type d'ordre présente l'intérêt de permettre la maîtrise du prix d'exécution mais le donneur d'ordre n'a pas la garantie d'avoir son ordre exécuté dans son intégralité. Ce type d'ordre peut en effet être exécuté partiellement, voire ne pas être exécuté.

#### 6.3.2 L'ordre “au marché”

Il n'est assorti d'aucune limite et peut faire l'objet d'une exécution partielle. L’ordre au marché est exécuté au maximum de la quantité immédiatement disponible, son solde restant en carnet. Si un ordre au marché ne trouve pas de contrepartie, il reste aussi en carnet jusqu’à son exécution ou son annulation soit par le Client, soit du fait de l’atteinte de sa limite de validité. En séance, l'ordre “au marché” est exécuté totalement ou partiellement selon les possibilités offertes sur la feuille de marché.

#### 6.4 Le prix de l’ordre

Le prix de l’ordre est exprimé à la pièce ou en pourcentage du nominal.

#### 6.5 La taille de l’ordre

Le volume d’un ordre s’exprime par une quantité de titres ou par un montant.

#### 6.6 Ordres sur titres

Tous les ordres d’achat ou de vente de titres déposés auprès du Teneur de compte sont négociés au comptant et exécutés conformément aux dispositions prévues par le prospectus complet ou, à défaut, la notice d'information.

Le prospectus simplifié ou la notice d'information, est remis préalablement à toute souscription.

### Article 7 — Transmission des ordres

#### 7.1 Modalités de transmission des ordres

Le « Client » titulaire d’un compte titres peut passer des ordres d’achat ou de vente auprès des guichets du « teneur de compte ». Pour cela, il doit remplir ‘’le formulaire d’ordre’’ mis à sa disposition par le Teneur de compte et le signer. Le Client peut opter pour tout autre mode de transmission mis à sa disposition par le teneur de compte (Internet, téléphone via les services en ligne sous réserve d'authentification).

Le Client assume la responsabilité de tout mode de transmission d'ordres convenus avec le teneur de compte et décharge cette dernière des conséquences pouvant résulter de l'utilisation de ce(s) moyen(s) de communication choisi(s) par le Client pour transmettre son ordre.

Les ordres par téléphone sont admis s’ils sont passés à partir d’une ligne privée dont le numéro est communiqué au « Teneur de compte » lors de la signature de la présente convention. Pour cela, le « Client » devra toujours décliner ce numéro à chaque ordre passé par téléphone au teneur de compte. Les ordres passés par téléphone doivent être confirmés par un formulaire d’ordre dûment remplie et signée par le « Client ».

Le Teneur de compte peut à tout moment ne plus accepter certains modes de passation d'ordre, sous réserve d'en avoir préalablement informé par tous moyens le Client, notamment lorsqu'un litige est survenu sur ces modes de transmission. Le Client est expressément informé du fait que la transmission de l'ordre en vue de son exécution ne préjuge pas de son exécution. Le teneur de compte n'acceptera pas les ordres dont les conditions d'exécution ne seraient pas conformes à la réglementation en vigueur ou bien s'avèreraient incompatibles avec les conditions de marchés.

Le Client décharge le Teneur de compte des conséquences pouvant résulter de l'utilisation de tout autre mode de transmission des ordres que ceux prévus dans la Convention.

Le Teneur de compte peut fixer des limites d'intervention selon la nature de l'opération et en fonction de chaque type de titre financier et du marché concerné. Ces limites sont opposables de plein droit au Client. Tout ordre transmis qui franchirait ces limites pourrait ne pas être exécuté. Dans le cas où l'ordre n'aurait pas pu être transmis, le Teneur de compte fait ses meilleurs efforts pour informer le Client. L'ordre qui n'a pas pu être transmis est réputé expiré. Il appartient au Client d'émettre, le cas échéant, un nouvel ordre.

L'ordre peut n'être exécuté que partiellement. A défaut d'instructions expresses du Client, tout commencement d'exécution partielle engage le Client.

Lorsqu'un ordre du Client présentera un caractère inhabituel en fonction de sa nature, de ses modalités, du marché ou de son montant, le Teneur de compte, préalablement au traitement de l'ordre et à son exécution, avertira le Client de cette situation, qui lui fournira les informations utiles à sa compréhension de l'opération envisagée et des risques qui y sont attachés. Après avoir pris connaissance de ces informations, le Client pourra alors confirmer son ordre. Le Client peut transmettre des ordres à son initiative en exécution simple.

Chaque ordre doit être dûment complété de l'ensemble des rubriques nécessaires à sa transmission et à sa bonne exécution sur le marché tel que précisé à l’article 5.2 de la présente convention.

Il doit également être daté et signé par le Client (ou son représentant légal ou son mandataire) avant sa transmission sur le marché.

En l'absence de ces rubriques, le Teneur de compte n'est pas tenu de transmettre l'ordre. Tout ordre exécuté ne peut être annulé.

Compte tenu des aléas pouvant intervenir lors de la transmission des ordres par correspondance ou par télécopie, le Teneur de compte ne saurait être tenu responsable du défaut d'exécution ou de l'exécution tardive des ordres transmis.

L'ordre est adressé au teneur de compte sous la seule responsabilité du Client. L'attention du Client est spécifiquement attirée sur la possibilité de délai dont la durée est imprévisible entre le moment où il émet l'ordre et celui auquel PURPOSE CAPITAL reçoit ce même ordre.

Dans tous les cas, les éléments attestant de la passation de ces ordres par le Client et de leur conformité avec les écritures du teneur de compte font foi.

Le Teneur de compte se réserve la possibilité, dans l'intérêt du Client, et lorsqu'elle n'a pas la qualité d'établissement placeur, de refuser la réception transmission d'ordre de certaines émissions d'emprunts obligataires sur le marché primaire.

Le Client a la faculté de demander l'annulation de son ordre après sa transmission. Cette demande ne pourra toutefois être prise en compte que dans la mesure où l'ordre n'est pas exécuté. Le Teneur de compte traitera cette demande d'annulation dans les meilleurs délais. Les frais d'annulation seront à la charge du Client. Tout ordre exécuté malgré une demande d'annulation tardive sera inscrit sur le compte- titres du Client.

#### 7.2 Durée de validité des ordres

a) validité “jour” : dans ce cas, l'ordre n'est exécutable que pendant la journée de négociation en cours et sera d'office retiré du marché s'il n'a pas été exécuté.

b) validité “à date déterminée” : l'ordre reste présent sur le marché, tant qu'il n'a pas été exécuté et jusqu'à la date indiquée par le donneur d'ordre. Cette date ne pourra pas dépasser 365 jours civils.

Si le donneur d'ordre omet d'indiquer une validité, la validité “jour” est appliquée d'office à son ordre.

En cas de non-exécution d'un ordre au jour d'expiration de sa validité, un nouvel ordre est nécessaire pour le renouveler même si les conditions d'exécution sont identiques.

En cas de détachement d'un droit de souscription ou d'attribution, les ordres non exécutés sont automatiquement retirés du marché et doivent par conséquent être renouvelés par les donneurs d'ordre. Il en est de même, sauf exception, dans le cas des suspensions de cotation. Lors du détachement d'un dividende, les ordres non exécutés restent présents sur le marché mais leur limite est abaissée du montant du dividende net.

## Titre III — Conservation, responsabilités et information

### Article 8 — Conservation des titres

En tant que Teneur de compte conservateur, PURPOSE CAPITAL assure la garde de l'ensemble des titres financiers inscrits en compte et accomplit notamment, à cet effet, l'encaissement des dividendes ou des coupons et l'amortissement ou le remboursement des titres financiers.

Le teneur de compte conservera et restituera les titres financiers déposés sur simple demande du Client, sous réserve des indisponibilités provenant des mises en garantie (nantissement, etc.) ou de droits que pourraient faire valoir des tiers.

Les titres financiers inscrits en compte ne peuvent faire l'objet d'utilisation par le Teneur de compte sauf accord préalable et exprès du Client.

Pour les titres financiers qu'elle a en conservation, le Teneur de compte s'oblige à respecter les règles de place relatives à la conservation des titres notamment celles définies dans l’instruction COSUMAF n° 03-15 du 10 décembre 2015 portant cahier de charges des teneurs de compte conservateurs.

Pour les titres financiers étrangers, négociés sur des marchés étrangers, le Teneur de compte est autorisé expressément par le Client à fournir aux conservateurs étrangers tous les renseignements utiles. Le Teneur de compte se réserve toutefois le droit de refuser l'inscription en compte et la négociation des titres financiers émis et conservés à l'étranger.

### Article 9 — Responsabilités du Teneur de compte

Le Teneur de compte agit conformément aux usages, règles de l'art et pratiques de la profession de société de bourse, dans le respect des lois et règlements en vigueur.

Le Teneur de compte n'est soumis qu'à une obligation de moyen et sa responsabilité ne pourra être engagée que sur la base d'une faute grave prouvée par le Client. Seuls les dommages directs subis par le Client pourront alors donner lieu à une éventuelle indemnisation. Le Teneur de compte n'est pas responsable des pertes d’opportunités pouvant résulter des choix ou omissions du Client. Dans le cadre de la présente Convention, la responsabilité du Teneur de compte ne saurait être engagée dans les cas suivants sans que cette liste soit exhaustive :

- tout évènement relevant de la force majeure,
- tout incident de fonctionnement sur les lieux d'exécution, conflit social, grève ou suppression de cotation,
- en cas de défaillance de l'entreprise de marché sur lequel le Teneur de compte intervient à la demande du Client.

### Article 10 — Risques engendrés par les opérations sur titres financiers

Le Client reconnaît avoir pris connaissance de la réglementation et du fonctionnement des marchés sur lesquels il effectue des transactions. Il reconnaît également être conscient des risques inhérents à ces transactions, de leur caractère spéculatif et des risques de perte du capital investi.

Le Client reconnaît également le fait qu'il doit se tenir informé personnellement de tout événement affectant la vie de toute société émettrice de titres en dépôt et susceptible d'influer sur la valeur de ces titres comme par exemple le redressement ou la liquidation judiciaire de la société émettrice, le Teneur de compte n'assume aucune obligation d'information à cet égard.

### Article 11 — Informations

- Périodicité des relevés de compte titres : le « Teneur de compte » informera le « Client » ou son mandataire de la situation de son portefeuille par l’envoi d’un relevé de compte mensuel, récapitulant l’ensemble des opérations et mouvements intervenus sur le compte au cours du mois.
- Informations relatives à l’exécution des ordres : à chaque transaction valablement exécutée, le « Teneur de compte » envoie au « Client » ou à son mandataire au plus tard deux (2) jours ouvrés suivant le dénouement effectif de l’opération, un « avis d’opéré » l’informant de l’exécution de son ordre et des termes de cette exécution.
- Les informations relatives aux allocations de titres à la suite d’une opération de souscription sur le marché primaire, sont notifiées au « Client » ou à son mandataire par un avis d’opéré s’il s’agit du marché monétaire, et une attestation de propriété de titres pour les autres marchés.

Dans le cas où le compte-titres est ouvert au nom de plusieurs titulaires (compte-titres indivis, joint entre tiers), les avis d'opérations et les relevés de portefeuille sont adressés au premier co-titulaire nommé dans l'intitulé du compte-titres ou à la personne désignée pour recevoir ces informations.

Dans le cas où le Client ne recevrait pas ces documents dans les délais habituels, il lui appartient d'en informer le Teneur de compte dans les meilleurs délais.

## Titre IV — Dispositions diverses

### Article 12 — Autres dispositions

Le Teneur de compte sollicite du Client toutes instructions utiles à l'accomplissement des formalités facultatives afférentes à ses droits pécuniaires. Faute d'instruction précise dans les délais requis, le Teneur de compte est habilité à prendre toutes mesures dans l'intérêt du Client, notamment la vente en bourse desdits droits, sans que celles-ci puissent engager la responsabilité du Teneur de compte. Dans tous les cas, Le Teneur de compte agira dans le cadre d'une obligation de moyen dans l'intérêt premier de ses Clients.

#### 12.1 Transfert du compte-titres

Le Client peut demander le transfert de son compte-titres vers un autre teneur de compte. Ce transfert est effectué dès lors que le règlement de toute somme due, en vertu des présentes, au teneur de compte a été normalement acquitté.

Les frais de transfert sont à la charge du Client.

Il est expressément convenu que, durant la période de transfert, le Client ne pourra pas confier d'opération d'achat (souscription) ou de vente (rachat) de titres.

#### 12.2 Réclamations/Contestations

Les réclamations concernant un ordre de bourse ou d'OPCVM doivent être formulées par écrit au Teneur de compte avec accusé de réception dans les deux jours qui suivent la réception de l’avis d’opération. Passé ce délai, l'opération est présumée acceptée par le Client.

Toute autre réclamation pourra seulement être acceptée par écrit dans un délai d'un mois après réception du relevé de portefeuille.

### Article 13 — Tarification

Le « Client » est informé que la gestion du compte-titres est soumise à une tarification.

Des droits de garde seront facturés au Client à la perception des revenus sur chaque titre. Ces droits de garde sont calculés par titre, sur une base annuelle de 365 jours, en fonction du volume de titres détenus, et au prorata de la durée de vie du titre dans le portefeuille.

La passation d'ordres de bourse donne lieu à la perception d'une commission perçue par le Teneur de compte, calculée sur le volume de la transaction envisagée.

Le Client déclare avoir pris connaissance des conditions tarifaires du Teneur de compte annexées à la présente convention et l’autorise à prélever sur son compte l’ensemble des frais et commissions, quelle qu’en soit la nature figurant dans les conditions tarifaires.

Toute modification de tarif sera portée préalablement à la connaissance du Client.

### Article 14 — Fiscalité

La fiscalité applicable sur les produits du portefeuille titres du Client est celle de son pays de résidence.

### Article 15 — Obligations de Purpose Capital

#### 15.1 Secret professionnel

Le Teneur de compte est tenu au secret professionnel. Toutefois, ce secret peut être levé dans les cas prévus par la loi, notamment à l'égard des autorités de contrôle, de l'administration fiscale et des autorités pénales.

De même, en matière de lutte contre le blanchiment des capitaux et de financement du terrorisme, le Teneur de compte est tenu de transmettre aux entreprises du groupe auquel elle appartient des informations couvertes par le secret professionnel.

De convention expresse, le Client autorise PURPOSE CAPITAL à communiquer toute information utile le concernant à toute personne physique ou morale contribuant à la réalisation des prestations prévues par la Convention ou qui pourrait y être ultérieurement rattachées, notamment aux prestataires de services pour l'exécution des travaux sous traités et/ou aux sociétés du groupe pour leur utilisation aux fins d'étude et de gestion des dossiers, de prospections commerciales et/ou d'autres études statistiques.

#### 15.2 Lutte contre le blanchiment des capitaux et le financement du terrorisme

Le teneur de compte est soumis à une obligation de vigilance et d’information, en raison des dispositions législatives et réglementaires relatives à la lutte contre le blanchiment de capitaux et le financement du terrorisme.

#### 15.3 Surveillance des opérations sur titres financiers

Le Teneur de compte est soumis à une obligation de vigilance et d'information, en application des dispositions législatives et réglementaires relatives au blanchiment des capitaux et le financement du terrorisme en Afrique Centrale. Le Teneur de compte doit notamment déclarer aux Autorités compétentes les opérations de Clients qui sont susceptibles de relever d'une intention de blanchiment, conformément aux dispositions de l’article 106 du règlement général de la Commission de Surveillance du Marché Financier d’Afrique Centrale (COSUMAF) du 23 Mai 2023.

### Article 16 — Modification de la convention

L'évolution des textes législatifs ou réglementaires peut modifier les clauses de la Convention. Dans ce cas, les modifications prendront effet à la date d'application de ces mesures sans intervention particulière du Teneur de compte à l'égard du Client sauf dispositions légales ou réglementaires particulières.

Le Teneur de compte se réserve également le droit de modifier les clauses, d'en ajouter ou d'en supprimer. Les clauses de la Convention modifiées à la seule initiative du Teneur de compte seront préalablement portées à la connaissance du Client, par tous moyens, deux mois avant leur entrée en vigueur.

L'acceptation de ces nouvelles conditions résultera de la continuité du fonctionnement du compte-titres et de la poursuite, sans réserve, des relations du Client avec le Teneur de compte.

### Article 17 — Durée et résiliation de la convention

Cette Convention est conclue pour une durée indéterminée. Elle peut être résiliée à tout moment par chacune des parties dans les conditions ci-après exposées.

En tout état de cause, en cas d'inexécution par le Client ou le Teneur de compte de ses engagements, la Convention peut être résiliée de plein droit sans mise en demeure à l'initiative de l'autre partie.

La résiliation de la Convention entraîne de plein droit la clôture du compte-titres et la résiliation des services qui lui sont rattachés.

Cependant, les ordres ou transactions en cours à cette date seront exécutés conformément à la Convention.

Le Client est toutefois avisé, que toute demande de clôture de compte titres (qu'elle soit initialisée par lui ou par le Teneur de compte) entraîne le blocage du compte-titres concerné ce qui ne permet plus au Client de passer de nouveaux ordres.

En cas de résiliation de la Convention, le Client devra indiquer à PURPOSE CAPITAL, les coordonnées du compte-titres vers lequel les titres devront être transférés.

#### 17.1 Résiliation à l'initiative du Teneur de compte

La résiliation par le Teneur de compte s'effectuera moyennant un préavis de trente jours calendaires et l'envoi préalable d'une lettre recommandée avec accusé de réception.

Un compte-titres sans titres, pendant une durée d'un an, est clôturé sans préavis.

#### 17.2 Résiliation à l'initiative du Client

La résiliation prend effet dès réception de la demande écrite du Client. Les titres financiers seront soient liquidés sur instruction du Client soient virés au compte-titres que le Client a indiqué.

#### 17.3 Décès du Client

Le décès du Client titulaire d’un compte-titres individuel n’entraîne pas la clôture du compte-titres mais son blocage.

Ledit blocage intervient dès réception d'un avis de décès ou de toute information crédible attestant du décès du titulaire du compte-titres.

La clôture du compte-titres n’intervient qu’après réception par le Teneur de compte des instructions formelles des ayants droit ou de leurs représentants légaux à l’issue de l’opération de liquidation de la succession.

Les héritiers, légataires ou toute personne habilitée à agir pour la succession devront fournir au Teneur de Compte tous les documents requis pour établir leur qualité et leurs droits.

Le Teneur de Compte ne saurait être tenu responsable des conséquences fiscales découlant de la succession.

#### 17.3.1 Cas particulier du décès d'un des co-titulaires d'un compte-titres joint

En cas de décès de l’un des co-titulaires, le compte-titres ne sera pas bloqué, il continuera de fonctionner sous la signature du survivant ou de l’un ou l’autre des survivants. Si la solidarité active permet au survivant, en cas de décès de l’un des co-titulaires, d’appréhender l’actif qui figure au compte-titres, il convient de préciser que le survivant (ou les survivants) est (sont) seul(s) comptable(s) de cet actif vis-à-vis des héritiers du défunt ou de leur notaire et qu’il(s) doit (doivent) leur rendre des comptes.

Le co-titulaire survivant ne peut exercer les droits extra-pécuniaires attachés aux titres que s'il est le premier nommé dans l'intitulé du compte titres ou s'il a été spécialement désigné à cet effet.

L'opposition écrite à la poursuite du fonctionnement du compte-titres sous la signature de l'un ou l'autre des survivants de la part d'un ayant droit du titulaire décédé justifiant de sa qualité ou du notaire chargé de la succession, produira les mêmes effets que la dénonciation de solidarité, le compte-titres sera transformé en compte- titres indivis.

#### 17.3.2 Cas d'un compte-titres indivis

Le décès de l'un des co-indivisaires entraîne le blocage du compte. Le déblocage est effectué à l'issue des opérations de liquidation de la succession.

Dans tous les cas, les co-indivisaires doivent maintenir au crédit de leur Compte espèces associé, une provision suffisante et disponible permettant le règlement des opérations de débit en cours.

### Article 18 — Droit applicable et langue de communication

La Convention est soumise au droit OHADA et à la réglementation CEMAC et la langue de communication entre le Client et PURPOSE CAPITAL ainsi que celle employée dans les documents et informations communiquées au Client est le Français y compris les informations précontractuelles.

Tous les litiges nés de l’interprétation du présent contrat, seront tranchés par les tribunaux dans le ressort duquel le Teneur de compte à son siège.

<div class="signatures">
<p>Fait en {{nb_exemplaires|nombre}} exemplaires à {{lieu_signature}}, le {{date_signature}}.</p>
<div class="sig-row">
<div class="sig"><span>Le Client¹ — « lu et approuvé »</span></div>
<div class="sig"><span>Pour le Teneur de compte, le Directeur Général</span></div>
</div>
</div>

¹ Faire précéder la signature de la mention « lu et approuvé ».
