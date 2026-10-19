---
id: PC-POL-PCA-001
titre: Plan de continuité d'activité
type: Politique
domaine: Risques
version: "0.9"
statut: Projet
confidentialite: Interne
proprietaire: Directeur Général
redige_par: Responsable de la conformité et du contrôle interne (RCCI)
verifie_par: Directeur Général
approuve_par: Conseil d'Administration
date_approbation:
date_effet:
prochaine_revue: 12 mois après adoption
diffusion: Tous les collaborateurs ; Administrateurs
public: false
resume: Comment Purpose Capital S.A. continue de servir ses clients quand quelque chose ne va pas — bureau inaccessible, coupure d'électricité ou d'internet, absence d'une personne clé, cyberattaque, défaillance d'un prestataire ou d'une infrastructure de marché. Le plan s'appuie sur le travail à distance, des délais de reprise réalistes et une petite cellule de crise.
references:
  - ref: RG-COSUMAF-2023
    articles: "Approche par les risques et rapport annuel de contrôle interne (art. 5) ; protection des intérêts des clients et de leurs avoirs"
  - ref: LOI-CM-2024-017
    articles: Sécurité des données personnelles et conduite à tenir en cas de violation
  - ref: OICV-PCA-2015
    articles: "Bonne pratique internationale : plan écrit, fonctions critiques, accès des clients à leurs avoirs, communication, tests et revue annuelle"
  - ref: BCBS-RO
    articles: "Bonne pratique internationale : résilience opérationnelle et tolérance aux interruptions"
  - ref: FINRA-4370
    articles: "Juridiction comparable : contenu minimal du plan de continuité d'une société de bourse"
  - ref: ISO-22301
    articles: "Norme internationale : analyse d'impact, stratégies de continuité, exercices et amélioration continue"
historique:
  - version: "0.9"
    date: 2026-10-19
    objet: Projet initial soumis au Conseil d'Administration
    par: RCCI
notes_redaction:
  - "Remplace les exigences minimales de l'article 20 de la Politique de gestion des risques (PC-POL-RIS-001). Les délais de reprise retenus (ordres dans la demi-journée, reprise complète en un jour ouvré) sont cohérents avec cet article."
  - Convenir avec la BVMAC et le Dépositaire central de la procédure de secours applicable à un membre qui ne peut plus accéder à leurs systèmes (transmission des ordres, instructions de règlement), puis la reporter dans l'Annexe 2.
  - Choisir le site de repli ponctuel (espace de travail partagé ou salle d'affaires à Yaoundé) et, si possible, un point d'appui à Douala près de la BVMAC.
  - "Compléter l'annuaire de l'Annexe 3 et en remettre une copie papier à chaque membre de la cellule de crise avant l'entrée en vigueur."
---

## Titre I — Dispositions générales

### Article 1 — Objet

Le présent plan dit ce que fait Purpose Capital S.A. (la « Société ») pour continuer à servir ses clients lorsqu'un événement perturbe son activité, et pour revenir à la normale le plus vite possible.

Il a trois buts, dans cet ordre :

1. **protéger les personnes** : collaborateurs, clients et visiteurs ;
2. **protéger les clients** : leurs ordres, leurs avoirs, leurs données et leur information ;
3. **protéger la Société** : ses obligations envers la COSUMAF et le marché, ses données et sa réputation.

### Article 2 — Un plan à la mesure de la Société

La Société est une petite équipe dont les outils sont, pour l'essentiel, accessibles en ligne. Ses collaborateurs peuvent travailler à distance. Le plan en tire trois conséquences :

- **le bureau n'est pas indispensable** : la réponse par défaut à la plupart des perturbations est la poursuite du travail à distance ;
- **les personnes sont la principale fragilité** : chaque rôle clé a un suppléant formé et des accès prêts à l'emploi ;
- **le plan doit rester court et utilisable sous pression** : une fiche réflexe (Annexe 1), un tableau des activités essentielles (Annexe 2) et un annuaire (Annexe 3) suffisent à agir.

### Article 3 — Définitions

- **Perturbation** : événement qui empêche ou ralentit une activité de la Société, quelle qu'en soit la cause.
- **Crise** : perturbation qui menace une activité essentielle au-delà de son délai de reprise, touche plusieurs clients ou peut avoir un effet sur la réputation de la Société.
- **Activité essentielle** : activité dont l'interruption causerait rapidement un préjudice aux clients ou un manquement réglementaire.
- **Délai maximal d'interruption** : durée au-delà de laquelle l'interruption d'une activité essentielle devient inacceptable.
- **Perte de données admissible** : quantité maximale d'informations que la Société accepte de devoir reconstituer après un incident, exprimée en durée.
- **Mode dégradé** : façon de travailler temporaire, plus lente ou plus manuelle, qui permet de continuer une activité essentielle.

## Titre II — Ce qu'il faut protéger

### Article 4 — Activités essentielles et délais de reprise

Le tableau suivant fixe, pour chaque activité essentielle, le délai maximal d'interruption. Les solutions de secours et les moyens nécessaires figurent à l'Annexe 2.

| Activité | Délai maximal d'interruption | Pourquoi |
| --- | --- | --- |
| Informer les clients d'une perturbation et leur indiquer comment joindre la Société | 2 heures ouvrées | Les clients doivent savoir où s'adresser et ne pas agir à l'aveugle |
| Recevoir, horodater et transmettre les ordres des clients | Une demi-journée de bourse | Un ordre non transmis peut causer une perte au client |
| Suivre le règlement-livraison et répondre aux appels de la BVMAC et du Dépositaire central | 1 jour ouvré | Un défaut de règlement engage la Société vis-à-vis du marché |
| Permettre aux clients de connaître leurs avoirs et d'en disposer | 1 jour ouvré | Les avoirs appartiennent aux clients |
| Paiements aux clients et rapprochements des comptes | 2 jours ouvrés | Éviter les erreurs et les retards de paiement |
| Vigilance LBC/FT et filtrage des sanctions | Avant toute nouvelle opération concernée | Aucune entrée en relation ni opération inhabituelle sans les contrôles ; elles sont suspendues plutôt que faites sans contrôle |
| Déclarations à la COSUMAF, à l'ANIF et aux autorités | Selon l'échéance réglementaire | Une échéance manquée est un manquement |
| Conseil, opérations de levée de fonds, comptabilité, paie | 5 jours ouvrés | Activités importantes, mais qui peuvent attendre quelques jours |

### Article 5 — Perte de données admissible

- **Ordres et instructions des clients : aucune perte.** Tout ordre est enregistré dès sa réception. Si les systèmes sont indisponibles, il est consigné sur le registre de secours de l'Annexe 4 puis saisi dès le retour à la normale.
- **Documents et messagerie : un jour au plus.** Les sauvegardes sont au moins quotidiennes.
- **Comptabilité et dossiers clients : un jour au plus.**

### Article 6 — Ce dont dépendent les activités essentielles

Les activités essentielles reposent sur peu d'éléments, qui sont protégés en priorité :

- les **personnes** : Directeur Général, RCCI, responsable des opérations, et leurs suppléants ;
- les **outils en ligne** : messagerie et documents, outils de gestion des clients et des ordres, accès aux systèmes de la BVMAC et du Dépositaire central, banque en ligne ;
- les **postes de travail** portables et les téléphones professionnels ;
- l'**électricité** et l'**accès à internet** ;
- les **prestataires critiques**, suivis selon la Politique d'externalisation (PC-POL-EXT-001) ;
- les **infrastructures de marché et les banques**.

## Titre III — Situations prévues

### Article 7 — Principe

Le plan ne cherche pas à prévoir chaque événement. Il prévoit des **conséquences** : on ne peut plus utiliser le bureau, on n'a plus d'électricité ou d'internet, une personne manque, les données sont touchées, un partenaire est défaillant. Quelle qu'en soit la cause, la réponse est la même.

### Article 8 — Le bureau est inaccessible

Incendie, dégât des eaux, inondation, travaux, troubles dans le quartier, fermeture administrative ou simple impossibilité de s'y rendre.

- Chacun travaille depuis son domicile ou un autre lieu sûr, avec son poste portable et son téléphone professionnel.
- Les rendez-vous avec les clients se tiennent par visioconférence, par téléphone ou dans le lieu de repli ponctuel prévu à l'Annexe 3.
- Si l'indisponibilité dure plus de deux semaines, le Directeur Général décide d'une solution de locaux provisoires.

### Article 9 — Coupure d'électricité

- **Au bureau** : un groupe électrogène prend le relais. La réserve de carburant permet au moins une journée de travail ; le démarrage est vérifié chaque mois et l'entretien suivi selon le carnet du fournisseur. Le passage au groupe provoque une courte coupure : les postes portables continuent sur leur batterie, et le référent informatique s'assure que la connexion internet redémarre.
- **Au domicile** : chacun garde son téléphone et son poste portable chargés dès que le courant est disponible. Si la coupure empêche de travailler, le collaborateur rejoint le bureau ou un autre lieu alimenté.
- Si le groupe tombe en panne ou manque de carburant, les collaborateurs passent au travail à distance depuis un lieu alimenté.

### Article 10 — Coupure d'internet

Les coupures peuvent être locales (opérateur, câble du quartier) ou nationales (incident sur un câble sous-marin, restriction des réseaux).

- **Coupure locale** : le bureau dispose de deux accès indépendants, chez deux opérateurs différents. Chaque collaborateur dispose d'un forfait de données mobiles chez un opérateur différent de celui du bureau et peut partager la connexion de son téléphone.
- **Coupure nationale ou très étendue** : la voix et les SMS fonctionnent souvent encore. La Société informe les clients par SMS, reçoit leurs ordres par téléphone selon l'article 18, les consigne au registre de secours et applique la procédure de secours convenue avec la BVMAC. Elle n'utilise aucun moyen de connexion qui ne soit pas autorisé au Cameroun.

### Article 11 — Une personne clé est absente

Maladie, accident, voyage, épidémie, démission soudaine.

- Chaque rôle clé a un **suppléant désigné** à l'Annexe 2, formé et doté des accès nécessaires avant d'en avoir besoin.
- Les pouvoirs bancaires et les habilitations auprès de la BVMAC et du Dépositaire central sont organisés pour qu'aucune opération ne dépende d'une seule personne.
- Les mots de passe des comptes partagés et des comptes d'urgence sont conservés dans un coffre-fort numérique, avec un accès de secours placé sous la responsabilité du Directeur Général et du Président du Conseil d'Administration.
- Les procédures essentielles sont écrites : une personne compétente doit pouvoir les suivre sans formation préalable.

### Article 12 — Cyberattaque ou perte de données

Rançongiciel, piratage de messagerie, vol ou perte d'un ordinateur, suppression accidentelle.

1. **Isoler** : débrancher l'appareil touché du réseau, sans l'éteindre, et prévenir aussitôt le référent informatique et le prestataire informatique.
2. **Bloquer** : changer les mots de passe concernés et fermer les sessions ouvertes, depuis un appareil sain.
3. **Prévenir les fraudes** : alerter les banques et rappeler aux collaborateurs qu'aucun paiement ni aucune instruction reçue par messagerie n'est exécuté sans confirmation par un autre canal.
4. **Restaurer** depuis une sauvegarde saine, de préférence la copie conservée hors ligne.
5. **Informer** : si des données de clients sont touchées, la cellule de crise informe les clients concernés et l'autorité de protection des données dans les conditions prévues par la loi, et la COSUMAF lorsque l'incident est significatif.

La Société ne paie pas de rançon.

### Article 13 — Défaillance d'un prestataire

Le prestataire informatique, la messagerie en ligne ou un autre prestataire critique ne rend plus son service.

- La cellule de crise contacte le prestataire, obtient un délai de rétablissement et en informe les collaborateurs.
- Si le délai dépasse celui de l'activité essentielle concernée, elle applique la solution de secours de l'Annexe 2 puis, si nécessaire, la stratégie de sortie prévue par la Politique d'externalisation.

### Article 14 — Défaillance d'une infrastructure de marché ou d'une banque

La BVMAC, le Dépositaire central ou une banque de règlement interrompt son service.

- La Société suit les instructions de l'infrastructure et ne cherche jamais de solution hors des règles du marché.
- Elle informe ses clients que les ordres sont conservés et transmis dès la reprise, ou leur propose de les annuler.
- Elle conserve la preuve de la date et de l'heure de chaque ordre reçu pendant l'interruption.

### Article 15 — Événement de grande ampleur

Troubles graves, catastrophe naturelle, épidémie, restriction de circulation.

- La sécurité des personnes passe avant tout : personne ne se déplace vers le bureau ou vers un client si cela présente un risque.
- La Société passe au travail à distance et réduit son activité aux activités essentielles de l'article 4.
- La cellule de crise fait un point avec chaque collaborateur au moins une fois par jour.

## Titre IV — Ce qui est en place en permanence

### Article 16 — Mesures préventives

La continuité se prépare avant la crise. En permanence :

1. **Postes de travail** : chaque collaborateur dispose d'un ordinateur portable professionnel chiffré et d'un téléphone professionnel. Les documents de travail sont enregistrés dans l'espace de stockage en ligne de la Société, pas seulement sur le poste.
2. **Accès** : authentification à plusieurs facteurs sur tous les comptes, avec un second moyen d'authentification de secours enregistré.
3. **Sauvegardes** : au moins trois copies des données importantes, sur deux supports différents, dont une conservée hors ligne ou chez un autre fournisseur que le principal. La restauration est testée chaque trimestre.
4. **Connexion et énergie** : selon les articles 9 et 10.
5. **Dossier de crise** : l'annuaire de l'Annexe 3, la fiche réflexe de l'Annexe 1, le registre de secours de l'Annexe 4, et une copie des documents clés de la Société (agrément, statuts, pouvoirs bancaires, contrats critiques, polices d'assurance). Il est disponible en ligne, sur une clé USB chiffrée et en version papier chez chaque membre de la cellule de crise.
6. **Prestataires** : les contrats des prestataires critiques comportent des engagements de continuité, conformément à la Politique d'externalisation.
7. **Assurance** : la Société examine chaque année si ses polices couvrent les dommages aux locaux et au matériel, la perte d'exploitation et les incidents informatiques.

### Article 17 — Travail à distance

Le travail à distance est un mode de fonctionnement normal, pas seulement un mode de secours. Il obéit aux règles suivantes :

- seuls les équipements professionnels sont utilisés pour les données des clients ;
- les réseaux Wi-Fi publics ne sont pas utilisés ; on leur préfère la connexion partagée du téléphone ;
- les conversations confidentielles se tiennent hors de portée d'oreilles extérieures et l'écran n'est pas visible des tiers ;
- les documents papier contenant des données de clients ne sont pas emportés au domicile, sauf nécessité, et y sont rangés sous clé ;
- chaque collaborateur reste joignable aux heures de travail et signale sans délai toute difficulté de connexion.

### Article 18 — Réception des ordres en mode dégradé

Lorsque les canaux habituels sont indisponibles :

- un ordre reçu par téléphone n'est accepté qu'après identification du client selon la procédure habituelle et, pour un montant important, après rappel du client au numéro enregistré dans son dossier ;
- tout ordre est consigné immédiatement sur le registre de secours de l'Annexe 4, avec la date et l'heure de réception, puis confirmé au client par écrit dès que possible ;
- un ordre reçu sur une messagerie personnelle ou un canal non habituel n'est exécuté qu'après la même vérification ;
- toute demande de virement vers un compte nouveau ou modifié est refusée tant que la situation n'est pas revenue à la normale, sauf vérification renforcée par le RCCI.

### Article 19 — Accès des clients à leurs avoirs

Les titres des clients sont inscrits auprès du Dépositaire central ou de leur teneur de comptes, et leurs fonds sont déposés sur des comptes distincts de ceux de la Société. Même si la Société ne pouvait plus poursuivre son activité, les clients conservent leurs avoirs.

Le plan prévoit, à l'Annexe 1, le message à adresser aux clients pour leur indiquer comment accéder à leurs avoirs si la Société devait cesser durablement son activité, en lien avec la COSUMAF.

## Titre V — Organisation de crise

### Article 20 — Cellule de crise

La cellule de crise est volontairement réduite :

| Rôle | Titulaire | Suppléant |
| --- | --- | --- |
| Pilote : décide, coordonne, parle au nom de la Société | Directeur Général | RCCI |
| Clients, marché et opérations | Responsable des opérations | Un collaborateur désigné de la direction commerciale |
| Conformité, autorités, sécurité des données, registre de crise | RCCI | Directeur Général |
| Informatique et prestataires | Référent informatique interne | Prestataire informatique |

Le Président du Conseil d'Administration est informé dès l'activation de la cellule et reçoit un point au moins quotidien tant que la crise dure.

### Article 21 — Déclenchement

1. **Tout collaborateur** qui constate une perturbation prévient immédiatement le Directeur Général ou, à défaut, le RCCI, par téléphone.
2. **Le pilote évalue** la situation dans l'heure : quelles activités sont touchées, pour combien de temps, avec quel effet sur les clients.
3. **Il décide** :
   - **incident** : traité par les personnes concernées et déclaré selon la Politique de gestion des risques ;
   - **perturbation** : passage en mode dégradé pour les activités touchées ;
   - **crise** : activation de la cellule de crise et du présent plan.

Dans le doute, le pilote active la cellule de crise : il est plus facile de la désactiver que de rattraper le temps perdu.

### Article 22 — Conduite de la crise

La cellule de crise suit la fiche réflexe de l'Annexe 1. Elle :

- s'assure de la sécurité et de la disponibilité de chaque collaborateur ;
- décide des activités à maintenir, à suspendre ou à reporter ;
- tient un **journal de crise** : décisions, heure, auteur, informations reçues et transmises ;
- se réunit à heures fixes, à distance si nécessaire ;
- décide du retour à la normale.

### Article 23 — Communication

| Destinataire | Qui | Quand | Comment |
| --- | --- | --- | --- |
| Collaborateurs | Pilote | Dès l'activation, puis à chaque point | Appel téléphonique selon l'arbre d'appel, puis groupe de messagerie ; SMS si internet est coupé |
| Clients | Responsable des opérations | Dans les 2 heures ouvrées si les clients sont touchés | SMS, courriel, message sur le site et sur la ligne téléphonique |
| COSUMAF | RCCI, sur décision du pilote | Sans délai pour toute perturbation qui touche les clients ou le marché | Téléphone, puis écrit |
| BVMAC, Dépositaire central, banques | Responsable des opérations | Dès qu'une opération en cours est menacée | Selon leurs procédures |
| Autorité de protection des données | RCCI | En cas de violation de données personnelles, dans le délai légal | Écrit |
| Presse et public | Directeur Général uniquement | Si nécessaire | Message écrit validé |

Les messages aux clients sont factuels, brefs, et disent toujours ce que le client doit faire et comment joindre la Société. Des modèles figurent à l'Annexe 1.

### Article 24 — Retour à la normale et retour d'expérience

Avant de déclarer la fin de la crise, la cellule vérifie que :

- les ordres consignés en mode dégradé ont été saisis et rapprochés ;
- les données restaurées sont complètes ;
- les clients et les autorités informés ont reçu un message de fin de perturbation.

Dans les 30 jours, le RCCI rédige un retour d'expérience au moyen de l'Annexe 5 : ce qui s'est passé, ce qui a fonctionné, ce qui doit changer. Le plan est mis à jour en conséquence.

## Titre VI — Faire vivre le plan

### Article 25 — Exercices

| Exercice | Fréquence | Ce qu'on vérifie |
| --- | --- | --- |
| Arbre d'appel | Tous les six mois | Chacun est joignable en moins d'une heure, l'annuaire est à jour |
| Journée de travail à distance pour toute l'équipe | Chaque trimestre | Tous les outils et les activités essentielles fonctionnent hors du bureau |
| Restauration d'une sauvegarde | Chaque trimestre | Les données peuvent être récupérées, complètes et lisibles |
| Remplacement d'une personne clé | Une fois par an | Le suppléant réalise seul les opérations essentielles du titulaire |
| Exercice sur table, sur un scénario du titre III | Une fois par an | La cellule sait décider et communiquer ; les délais de l'article 4 sont tenables |

Chaque exercice donne lieu à une fiche de l'Annexe 5. Les défauts constatés sont suivis comme des plans d'action.

### Article 26 — Formation

Chaque nouveau collaborateur reçoit le présent plan à son arrivée et participe à l'exercice suivant. Les membres de la cellule de crise et leurs suppléants connaissent la fiche réflexe et savent où trouver le dossier de crise.

### Article 27 — Mise à jour

L'annuaire de l'Annexe 3 est vérifié chaque trimestre. Le plan est revu au moins une fois par an, et à chaque changement important : nouveaux locaux, nouvel outil ou prestataire critique, nouvelle activité, départ d'une personne clé, crise réelle.

Le RCCI présente chaque année au Conseil d'Administration le bilan des exercices, des incidents et des mises à jour. Ce bilan figure dans le rapport annuel de contrôle interne transmis à la COSUMAF.

## Titre VII — Dispositions finales

### Article 28 — Articulation avec les autres documents

Le présent plan remplace les exigences minimales de l'article 20 de la Politique de gestion des risques. Il s'applique avec la Politique d'externalisation et, dès son adoption, la Politique de sécurité des systèmes d'information.

### Article 29 — Entrée en vigueur

Le présent plan, adopté par le Conseil d'Administration lors de sa séance du ____________, entre en vigueur à compter du ____________.

<div class="signatures">
<p>Fait à Yaoundé, le ____________</p>
<div class="sig-row">
<div class="sig"><span>Le Président du Conseil d'Administration</span></div>
<div class="sig"><span>Le Directeur Général</span></div>
</div>
</div>
