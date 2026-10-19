---
id: PC-CTR-003
titre: Convention de syndicat de placement
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
resume: Modèle de convention par laquelle Purpose Capital S.A., chef de file d'une émission par appel public à l'épargne visée par la COSUMAF, associe une à trois sociétés de bourse ou banques au placement des titres — rôle du chef de file, engagements des membres, centralisation, allocation, rétrocession des commissions.
references:
  - ref: REG-01-22
    articles: Appel public à l'épargne, intermédiaires habilités au placement
  - ref: RG-COSUMAF-2023
    articles: "Identité des arrangeurs et du chef de file dans le document d'information (art. 131) ; dossier de visa (art. 155) ; information et commercialisation des émissions"
  - ref: BVMAC-RM
    articles: Centralisation, publication des résultats, admission à la cote
  - ref: DC-RG
    articles: Inscription en compte, règlement-livraison
  - ref: REG-02-24
    articles: Vigilance à l'égard des souscripteurs, responsabilité de chaque intermédiaire
  - ref: AUA
    articles: Clause compromissoire, arbitrage CCJA
  - ref: ICMA-AGREEMENT
    articles: "Pratique internationale : convention entre chef de file et membres du syndicat (rôles, engagements, restrictions de vente)"
historique:
  - version: "0.9"
    date: 2026-10-20
    objet: Projet initial de modèle, rempli par formulaire, articulé avec la convention de mandat PC-CTR-001
    par: Directeur des Marchés de Capitaux
notes_redaction:
  - Ne pas compléter ce modèle à la main. Utiliser « Préparer une convention » dans le référentiel ; le Word et le PDF ne sont produits que lorsque tous les champs requis sont renseignés et cohérents.
  - "Le modèle couvre un placement « au mieux » (obligation de moyens). Si un membre prend un engagement ferme ou de garantie, utiliser en complément la convention de prise ferme et de garantie de bonne fin (PC-CTR-002)."
  - Vérifier sur le Règlement général de la COSUMAF l'article qui permet à la société de bourse désignée par l'émetteur de constituer un syndicat de placement avec d'autres sociétés de bourse et établissements de crédit, et le citer au préambule.
  - "Confirmer avec les membres le circuit des fonds : virement des fonds collectés sur le Compte de centralisation au plus tard le jour ouvré suivant leur réception, ou centralisation directe par les souscripteurs."
  - Faire valider le modèle par le conseil juridique de la Société avant sa première utilisation.
---

**ENTRE LES SOUSSIGNÉS :**

**Purpose Capital S.A.**, société anonyme avec conseil d'administration au capital de trois cent dix-sept millions cinq cent mille francs CFA (317 500 000 FCFA), société de bourse agréée par la COSUMAF sous le numéro COSUMAF-SDB-01/2026, immatriculée au Registre du Commerce et du Crédit Mobilier de Yaoundé sous le numéro {{pc_rccm}}, dont le siège social est situé Rue Joseph Essono Balla, Elig-Essono, Yaoundé (Cameroun), représentée par son Directeur Général, dûment habilité aux fins des présentes,

*ci-après « le Chef de file » ou « Purpose Capital »,*

**ET**

**{{membre1_nom}}**, {{membre1_type}} sous le numéro {{membre1_agrement}}, dont le siège social est situé {{membre1_siege}}, représentée par {{membre1_representant}}, dûment habilité aux fins des présentes,

{% si nb_membres dans deux,trois %}
**{{membre2_nom}}**, {{membre2_type}} sous le numéro {{membre2_agrement}}, dont le siège social est situé {{membre2_siege}}, représentée par {{membre2_representant}}, dûment habilité aux fins des présentes,
{% fin %}

{% si nb_membres = trois %}
**{{membre3_nom}}**, {{membre3_type}} sous le numéro {{membre3_agrement}}, dont le siège social est situé {{membre3_siege}}, représentée par {{membre3_representant}}, dûment habilité aux fins des présentes,
{% fin %}

*ci-après {% si nb_membres = un %}« le Membre »{% fin %}{% si nb_membres != un %}ensemble « les Membres » et individuellement « un Membre »{% fin %},*

le Chef de file et {% si nb_membres = un %}le Membre{% fin %}{% si nb_membres != un %}les Membres{% fin %} étant ci-après désignés ensemble les « Parties ».

## Préambule

**Considérant que** {{emetteur_nom}} (l'« Émetteur »), dont le siège est situé au {{emetteur_pays}}, a confié à Purpose Capital, par convention du {{date_mandat}}, un mandat d'arrangeur et de chef de file du placement d'une émission de {% si titres_nature = autres %}{{titres_autre}}{% fin %}{% si titres_nature != autres %}{{titres_nature}}{% fin %} par appel public à l'épargne d'un montant de {{montant|lettres}} (l'« Opération ») ;

**Considérant que** la réglementation du marché financier de l'Afrique centrale permet à la société de bourse désignée par l'émetteur de constituer, pour le placement, un syndicat avec d'autres sociétés de bourse et établissements de crédit ;

**Considérant que** Purpose Capital souhaite associer {% si nb_membres = un %}le Membre{% fin %}{% si nb_membres != un %}les Membres{% fin %} au placement de l'Opération afin d'en élargir la diffusion auprès des investisseurs de la CEMAC, ce que {% si nb_membres = un %}le Membre accepte{% fin %}{% si nb_membres != un %}les Membres acceptent{% fin %} dans les termes ci-après,

**IL A ÉTÉ CONVENU CE QUI SUIT :**

## Titre I — Objet et définitions

### Article 1 — Définitions

Dans la présente convention, les termes ci-dessous ont le sens qui leur est donné ci-après. Ils sont employés avec une majuscule dans le reste de la convention et de ses annexes.

- **Titres** : les titres financiers émis dans le cadre de l'Opération, d'une valeur nominale unitaire de {{nominal}} et d'un prix d'émission de {{prix_emission}} ;
- **Document d'information** : le prospectus de l'Opération visé par la COSUMAF sous le numéro {{visa_ref}}, y compris ses notes complémentaires et rectificatives ;
- **Période de souscription** : du {{souscription_debut}} au {{souscription_fin}} inclus, sauf prorogation ou clôture anticipée publiée dans les conditions du Document d'information ;
- **Date de règlement-livraison** : le {{date_reglement}}, ou toute autre date fixée dans le Document d'information ;
- **Compte de centralisation** : le compte n° {{compte_numero}} ouvert auprès de {{compte_banque}}, sur lequel sont centralisés les fonds versés par l'ensemble des souscripteurs ;
- **Syndicat** : le groupement formé par le Chef de file et {% si nb_membres = un %}le Membre{% fin %}{% si nb_membres != un %}les Membres{% fin %} pour le placement des Titres ;
- **Souscription valable** : une souscription reçue pendant la Période de souscription, au moyen du bulletin prévu par le Document d'information, complète, signée, couverte par des fonds effectivement reçus et pour laquelle les mesures de vigilance ont été accomplies.

### Article 2 — Objet

La convention organise la participation {% si nb_membres = un %}du Membre{% fin %}{% si nb_membres != un %}des Membres{% fin %} au placement des Titres : rôle du Chef de file, engagements de chaque Membre, circuit des souscriptions et des fonds, allocation et rémunération.

Chaque Membre place les Titres auprès de sa propre clientèle et des investisseurs qu'il démarche, **en son nom et sous sa responsabilité**, dans le respect du Document d'information. Il n'agit pas au nom de l'Émetteur ni au nom du Chef de file.

### Article 3 — Nature de l'engagement

Les Membres et le Chef de file sont tenus d'une **obligation de moyens** : chacun déploie ses meilleurs efforts pour placer les Titres, sans garantir un montant de souscriptions. Les quotas de l'Annexe 1 sont indicatifs ; ils servent à organiser la commercialisation et ne constituent ni un plafond ni un engagement ferme.

Aucun Membre ne s'engage à souscrire ou à faire souscrire les Titres non placés. Un tel engagement ne peut résulter que d'une convention distincte de prise ferme ou de garantie de bonne fin.

### Article 4 — Prise d'effet

La convention prend effet à sa signature. Aucun placement ne peut toutefois commencer avant l'obtention du visa de la COSUMAF sur le Document d'information et l'ouverture de la Période de souscription.

## Titre II — Rôle du Chef de file

### Article 5 — Missions du Chef de file

Le Chef de file :

1. remet à chaque Membre le Document d'information visé, le bulletin de souscription, le calendrier de l'Annexe 2 et les documents promotionnels autorisés ;
2. tient l'état consolidé des souscriptions du Syndicat, à partir des états transmis par les Membres ;
3. centralise les fonds sur le Compte de centralisation et rapproche chaque jour les fonds reçus des souscriptions déclarées ;
4. informe les Membres de l'évolution des souscriptions, de toute prorogation ou clôture anticipée et de tout fait nouveau affectant l'Opération ;
5. arrête, avec l'Émetteur, l'allocation des Titres et la notifie à chaque Membre ;
6. coordonne le règlement-livraison avec le Dépositaire central et, le cas échéant, l'admission à la cote de la BVMAC ;
7. publie les résultats de l'Opération dans les conditions prévues par la réglementation et transmet à la COSUMAF les informations requises.

### Article 6 — Interlocuteur unique

Le Chef de file est le seul interlocuteur de l'Émetteur, de la COSUMAF, de la BVMAC et du Dépositaire central pour l'Opération. Un Membre qui reçoit une demande de l'un d'eux la transmet sans délai au Chef de file.

## Titre III — Engagements des Membres

### Article 7 — Placement

Chaque Membre :

- ne commercialise les Titres que pendant la Période de souscription et sur la base du seul Document d'information visé ;
- remet à chaque souscripteur le Document d'information ou son résumé et l'informe des risques de l'investissement ;
- s'assure, pour ses clients, que la souscription est adaptée à leur profil, selon ses propres règles ;
- n'accepte que des souscriptions valables, sur le bulletin prévu par le Document d'information ;
- ne promet aucun avantage, rendement ou allocation non prévu par le Document d'information.

### Article 8 — Communication

Aucun Membre ne diffuse de document, de publicité ou d'information relatif à l'Opération autre que ceux remis par le Chef de file, sans l'accord écrit préalable de celui-ci. Aucune information n'est communiquée avant l'obtention du visa de la COSUMAF.

### Article 9 — Restrictions de placement

Les Titres sont placés exclusivement dans les pays de la CEMAC, auprès des catégories d'investisseurs prévues par le Document d'information. Un Membre ne les propose pas dans un pays dont la réglementation l'interdit ou subordonne l'offre à une autorisation non obtenue.

### Article 10 — Connaissance des souscripteurs

Chaque Membre applique à ses souscripteurs les mesures de vigilance prévues par le Règlement CEMAC n° 02/24 : identification et vérification de l'identité, bénéficiaires effectifs, origine des fonds, filtrage des listes de sanctions. Il en reste seul responsable et conserve les pièces pendant dix ans. Il communique au Chef de file, sur demande, les informations nécessaires à l'accomplissement de ses propres obligations ou aux demandes des autorités.

Un Membre refuse toute souscription dont l'origine des fonds n'est pas justifiée. Il ne transmet au Chef de file aucune souscription d'une personne visée par une mesure de gel.

### Article 11 — Transmission des souscriptions et des fonds

Chaque Membre :

1. transmet au Chef de file, chaque jour ouvré de la Période de souscription avant {{heure_etat}}, l'état de ses souscriptions selon le modèle de l'Annexe 3, même lorsqu'il n'a reçu aucune souscription ;
2. vire les fonds reçus de ses souscripteurs sur le Compte de centralisation dans un délai de {{delai_fonds|nombre}} jour(s) ouvré(s) suivant leur réception, avec la référence de l'état correspondant ;
3. remet l'état définitif de ses souscriptions, accompagné des bulletins, dans un délai de {{delai_cloture|nombre}} jour(s) ouvré(s) suivant la clôture de la Période de souscription ;
4. tient les fonds de ses souscripteurs, jusqu'à leur virement, sur un compte distinct de ses fonds propres.

Une souscription ou des fonds transmis après les délais fixés par le calendrier de l'Annexe 2 peuvent être refusés par le Chef de file.

## Titre IV — Allocation, règlement et restitution

### Article 12 — Allocation

Si le total des souscriptions valables ne dépasse pas le Montant de l'Opération, chaque souscription est servie intégralement.

En cas de sursouscription, les Titres sont alloués {{allocation}}. La même règle s'applique à toutes les souscriptions, quel que soit le membre du Syndicat qui les a reçues. Le Chef de file ne peut favoriser ni ses propres clients, ni ses collaborateurs, ni un Membre.

Le Chef de file notifie à chaque Membre l'allocation de ses souscripteurs au plus tard la veille de la Date de règlement-livraison.

### Article 13 — Règlement-livraison

À la Date de règlement-livraison, les Titres alloués sont inscrits en compte au nom des souscripteurs, par l'intermédiaire du Membre qui tient leur compte, conformément aux règles du Dépositaire central. Chaque Membre adresse un avis d'opéré à ses souscripteurs.

### Article 14 — Restitution

Les fonds correspondant aux souscriptions non servies ou réduites sont restitués aux souscripteurs, sans frais, dans un délai de {{delai_restitution|nombre}} jours ouvrés suivant la notification de l'allocation, par l'intermédiaire du Membre qui les a reçus. Si l'Opération est annulée, notamment faute d'atteindre le seuil de réussite prévu par le Document d'information, la totalité des fonds est restituée dans le même délai.

## Titre V — Rémunération

### Article 15 — Commissions

Purpose Capital perçoit de l'Émetteur une commission de placement de {{com_placement}} des montants souscrits et libérés. Sur cette commission, elle verse à chaque Membre une **commission de placement rétrocédée** de {{com_retro}} des montants souscrits par l'intermédiaire de ce Membre, effectivement alloués et libérés, selon le barème de l'Annexe 4.

Les commissions sont payées dans un délai de {{delai_paiement|nombre}} jours ouvrés suivant leur encaissement par Purpose Capital, sur facture du Membre. Elles s'entendent hors taxes. Chaque commission fait l'objet d'une facture et d'un paiement distincts ; elles ne se compensent pas avec d'autres sommes.

Aucune commission n'est due sur une souscription non valable, non servie ou non libérée, ni si l'Opération est annulée.

### Article 16 — Frais

Chaque Partie supporte ses propres frais de commercialisation. Les frais de l'Opération sont à la charge de l'Émetteur dans les conditions de la convention de mandat.

## Titre VI — Conformité et responsabilité

### Article 17 — Confidentialité et information privilégiée

Chaque Partie garde confidentielles les informations reçues au titre de l'Opération, sauf communication exigée par la loi ou par une autorité. Jusqu'à leur publication, les informations relatives à l'Opération constituent des informations privilégiées : chaque Partie tient la liste des personnes qui y ont accès et la communique au Chef de file sur demande. Aucune Partie, aucun de ses dirigeants ni de ses collaborateurs n'intervient sur les titres de l'Émetteur en utilisant ces informations.

### Article 18 — Conflits d'intérêts

Chaque Membre déclare au Chef de file, avant la signature, ses liens avec l'Émetteur susceptibles de créer un conflit d'intérêts, et informe ses souscripteurs de ceux qui les concernent. Les souscriptions pour compte propre d'une Partie, de ses dirigeants ou de ses collaborateurs ne sont servies qu'après celles des clients, selon la Politique de gestion des conflits d'intérêts du Chef de file.

### Article 19 — Responsabilité

Chaque Partie répond de ses propres fautes et de celles de ses collaborateurs. Un Membre indemnise le Chef de file de toute perte, réclamation ou sanction résultant du non-respect de ses engagements, notamment en matière de vigilance, de communication ou de transmission des souscriptions et des fonds. Le Chef de file ne répond pas du contenu du Document d'information, qui relève de la responsabilité de l'Émetteur.

Il n'existe aucune solidarité entre les Parties. La convention ne crée entre elles ni société ni mandat réciproque.

### Article 20 — Retrait et exclusion

Un Membre peut se retirer du Syndicat avant l'ouverture de la Période de souscription, par écrit. Le Chef de file peut exclure un Membre qui manque gravement à ses engagements, après mise en demeure restée sans effet pendant deux jours ouvrés ; le Membre exclu transmet sans délai les souscriptions et les fonds reçus.

### Article 21 — Fin de la convention

La convention prend fin au paiement de la dernière commission due, ou à la restitution des fonds en cas d'annulation de l'Opération. Les articles 10, 17 et 19 survivent à son terme.

## Titre VII — Dispositions finales

### Article 22 — Droit applicable

La convention est régie par le droit communautaire de la CEMAC, les Actes uniformes OHADA et, pour le surplus, le droit camerounais.

### Article 23 — Règlement des différends

Les Parties recherchent d'abord une solution amiable pendant {{delai_amiable|nombre}} jours. Elles peuvent recourir à la médiation de la COSUMAF.

{% si litiges = arbitrage %}
À défaut d'accord, le différend est tranché par voie d'arbitrage sous l'égide de la Cour Commune de Justice et d'Arbitrage (CCJA) de l'OHADA, par {{arbitres}}, à {{lieu_arbitrage}}, en langue française.
{% fin %}

{% si litiges = juridictions %}
À défaut d'accord, le différend est soumis aux juridictions compétentes de {{juridiction_ville}}.
{% fin %}

### Article 24 — Dispositions diverses

Les notifications sont faites par écrit, par lettre remise contre décharge ou par courrier électronique confirmé, aux adresses indiquées en tête des présentes. La convention et ses annexes expriment l'intégralité de l'accord des Parties ; elle ne peut être modifiée que par avenant signé de toutes les Parties ni cédée sans leur accord. Les annexes en font partie intégrante.

Fait à {{lieu_signature}}, le {{date_signature}}, en {{nb_exemplaires|nombre}} exemplaires originaux.

{% si nb_membres = un %}
@signatures(Pour Purpose Capital S.A. | Le Directeur Général ; Pour {{membre1_nom}} | {{membre1_representant}})
{% fin %}
{% si nb_membres = deux %}
@signatures(Pour Purpose Capital S.A. | Le Directeur Général ; Pour {{membre1_nom}} | {{membre1_representant}} ; Pour {{membre2_nom}} | {{membre2_representant}})
{% fin %}
{% si nb_membres = trois %}
@signatures(Pour Purpose Capital S.A. | Le Directeur Général ; Pour {{membre1_nom}} | {{membre1_representant}})

@signatures(Pour {{membre2_nom}} | {{membre2_representant}} ; Pour {{membre3_nom}} | {{membre3_representant}})
{% fin %}
