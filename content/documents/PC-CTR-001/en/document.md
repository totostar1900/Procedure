---
titre: "Arrangement and Placement Mandate Agreement"
resume: "Template agreement under which an issuer mandates Purpose Capital S.A. to structure a fundraising (shares, bonds or other securities), obtain COSUMAF approval (visa) for it and place it on the regional financial market."
diffusion: "Executive Management, Capital Markets Department, Sales Department, RCCI"
references:
  - ref: REG-01-22
    articles: "Public offering, authorised intermediaries, disclosure obligations"
  - ref: RG-COSUMAF-2023
    articles: "Identity of the arrangers and the lead manager in the information memorandum (Art. 131), mandate letter in the approval (visa) application file (Art. 155), ongoing disclosure"
  - ref: BVMAC-RM
    articles: "Admission to listing, centralisation, publication of results"
  - ref: DC-RG
    articles: "Book-entry registration, settlement"
  - ref: REG-02-24
    articles: "Due diligence on the issuer and subscribers"
  - ref: AUSCGIE
    articles: "Corporate authorisations for the issue, rights of shareholders and bondholders"
  - ref: AUS
    articles: "Creation of the security interests securing the loan"
  - ref: AUA
    articles: "Arbitration clause, CCJA arbitration"
historique:
  - version: "0.9"
    date: 2026-10-19
    objet: "Initial draft template, drafted using defined terms; each item of data is entered only once in the repository form"
    par: "Head of Capital Markets"
notes_redaction:
  - "Do not complete this template by hand. Use “Prepare an agreement” in the repository; the Word and PDF files are only produced once all required fields are completed and consistent."
  - "Have the template validated by the Company's legal counsel before its first use."
  - "Articles of the COSUMAF General Regulation of 23 May 2023 identified: Art. 131 (arrangers and lead manager in the information memorandum) and Art. 155 (mandate letter in the approval (visa) application file). Check against the official text the article on which the preamble is based (appointment of one or two brokerage firms, placement syndicate)."
  - "Firm underwriting and standby underwriting commitments fall under a separate agreement (PC-CTR-002) and the Company's own funds; they are not covered by this template."
  - "Check the VAT treatment and the tax regime applicable to the commissions and to the securities issued."
source: c4ba24de5adf1e93
---

**BETWEEN THE UNDERSIGNED:**

**{{emetteur_nom}}**, {% si emetteur_forme = autre %}{{emetteur_forme_autre}}{% fin %}{% si emetteur_forme != autre %}{{emetteur_forme}}{% fin %} with share capital of {{emetteur_capital|lettres}}, registered with the Trade and Personal Property Credit Register (RCCM) of {{emetteur_rccm_ville}} under number {{emetteur_rccm}}, whose registered office is at {{emetteur_siege}} ({{emetteur_pays}}), represented by {{emetteur_representant}}, acting in the capacity of {{emetteur_qualite}}, duly authorised for the purposes hereof,

*hereinafter “the Issuer”,*

**AND**

**Purpose Capital S.A.**, a public limited company (société anonyme) with a board of directors, with share capital of three hundred and seventeen million five hundred thousand CFA francs (FCFA 317,500,000), a brokerage firm (société de bourse) licensed by COSUMAF under number COSUMAF-SDB-01/2026, registered with the Trade and Personal Property Credit Register (RCCM) of Yaoundé under number {{pc_rccm}}, whose registered office is at Rue Joseph Essono Balla, Elig-Essono, Yaoundé (Cameroon), represented by its Chief Executive Officer, duly authorised for the purposes hereof,

*hereinafter “the Arranger” or “Purpose Capital”,*

hereinafter referred to together as the “Parties” and individually as a “Party”.

## Preamble

**Whereas** the Issuer, which operates in the following sector: {{emetteur_secteur}}, intends to raise funds on the Central African financial market on the terms set out in Article 1 and described in Appendix 1 (the “Transaction”);

**Whereas** the regulations of the regional financial market require the issuer to appoint one or two brokerage firms responsible for supervising and carrying out the placement, the appointed brokerage firm being entitled to form a placement syndicate with other brokerage firms and credit institutions;

**Whereas** Purpose Capital is a brokerage firm licensed by COSUMAF and authorised to carry on arrangement, issuer advisory and securities placement activities;

**Whereas** the Issuer wishes to entrust Purpose Capital with a mandate to arrange and place the Transaction, which Purpose Capital accepts on the terms set out below,

**IT IS HEREBY AGREED AS FOLLOWS:**

## Title I — Purpose and definitions

### Article 1 — Definitions

In this agreement, the terms below have the meanings given to them hereafter. They are capitalised throughout the remainder of the agreement and its appendices.

**Transaction terms**

- **Transaction**: the issue {% si mode_placement = ape %}by way of public offering{% fin %}{% si mode_placement = prive %}by way of private placement{% fin %} of {% si titres_nature = autres %}{{titres_autre}}{% fin %}{% si titres_nature != autres %}{{titres_nature}}{% fin %} by the Issuer, the indicative features of which are set out in Appendix 1;
- **Securities**: the financial securities issued as part of the Transaction, with a unit nominal value of {{nominal}};
- **Transaction Amount**: {{montant|lettres}};
- **Minimum Subscription Threshold**: {{seuil|lettres}}, being the minimum amount of subscriptions below which the Transaction is deemed not to have been completed;
- **Centralisation Account**: the account opened in the name of {{compte_titulaire}} with {{compte_banque}}, into which the funds paid by subscribers are centralised;
- **Subscription Period**: the period during which investors may subscribe for the Securities, as set in the Information Memorandum;
- **Settlement Date**: the date on which the Securities are credited to securities accounts and the funds are paid to the Issuer, as set in the Information Memorandum.

**General terms**

- **COSUMAF**: Commission de Surveillance du Marché Financier de l'Afrique Centrale (Central African Financial Market Supervisory Commission);
- **BVMAC**: Bourse des Valeurs Mobilières de l'Afrique Centrale (Central African Stock Exchange);
- **Central Securities Depository**: the single central securities depository of the regional financial market;
- **Information Memorandum**: the prospectus submitted to COSUMAF for approval (visa), including its supplementary and corrective notes;
- **Placement Syndicate**: the group of brokerage firms and credit institutions formed by the Arranger to place the Securities;
- **Material Adverse Event**: any event that significantly affects the financial position, business or prospects of the Issuer, or the conditions of the regional financial market.

In the event of any discrepancy between Appendix 1 and the Information Memorandum approved by COSUMAF, the latter prevails.

### Article 2 — Purpose

The Issuer entrusts Purpose Capital, which accepts, with a mandate as **arranger** and **lead manager of the placement** of the Transaction. This mandate covers:

1. the financial structuring of the Transaction;
2. the preparation of the Information Memorandum and of the application file for COSUMAF approval (visa);
3. the organisation and conduct of the placement of the Securities, either alone or within a Placement Syndicate;
4. the centralisation of subscriptions, the allocation of the Securities and the coordination of settlement{% si admission = oui %}; and{% fin %}{% si admission = non %}.{% fin %}
{% si admission = oui %}
5. the preparation of the application file for admission of the Securities to listing on the BVMAC.
{% fin %}

### Article 3 — Exclusivity

{% si exclusivite = exclusif %}
For the term of the agreement, the Issuer undertakes not to entrust any third party with an assignment having the same purpose, and refers to the Arranger any approach received from investors or intermediaries in connection with the Transaction.
{% fin %}

{% si exclusivite = coarrangement %}
The Issuer appoints {{coarrangeur}} as co-arranger. The allocation of tasks and commissions between the co-arrangers is set out in an amendment signed by all three parties. The Issuer undertakes not to entrust any other third party with an assignment having the same purpose for the term of the agreement.
{% fin %}

### Article 4 — Term

The agreement takes effect on signature and expires on the earlier of the following dates: (i) delivery of the closing report provided for in Article 11; (ii) expiry of a period of {{validite_mois|nombre}} months following its signature if COSUMAF approval (visa) has not been obtained, unless extended in writing.

## Title II — Tasks and undertakings of the Arranger

### Article 5 — Structuring phase

The Arranger:

- analyses the Issuer's financing needs and proposes the structure of the Transaction (type of Securities, amount, maturity, rate or price, amortisation profile, guarantees and security, tranches);
- carries out financial due diligence on the Issuer, on the basis of the documents listed in Appendix 3;
- recommends, where appropriate, the use of a rating agency, a guarantor or a representative of the body of bondholders;
- draws up, together with the Issuer, the indicative timetable for the Transaction (Appendix 2).

### Article 6 — Regulatory phase

The Arranger:

- drafts the Information Memorandum together with the Issuer and its advisers, on the basis of the information provided by the Issuer;
- prepares and files the application for COSUMAF approval (visa), follows it up and coordinates the responses to the regulator's comments;
- coordinates the parties involved: statutory auditors, legal counsel, rating agency, guarantor, Central Securities Depository and BVMAC{% si admission = oui %};{% fin %}{% si admission = non %}.{% fin %}
{% si admission = oui %}
- prepares the application file for admission to listing on the BVMAC.
{% fin %}

No information, advertising or communication document relating to the Transaction may be distributed before COSUMAF approval (visa) has been obtained and, in the case of promotional documents, without the prior validation of the Arranger.

### Article 7 — Placement phase

The Arranger:

- designs the marketing strategy and organises presentations to investors;
- forms the Placement Syndicate, where applicable, and coordinates its members under a separate agreement;
- places the Securities with its clients and with targeted investors, in compliance with its information and suitability obligations;
- centralises the subscription forms and the funds in the Centralisation Account, and keeps a daily record of subscriptions;
- proposes to the Issuer the allocation rules, as set in the Information Memorandum, and applies them fairly in the event of oversubscription;
- coordinates the settlement of the Securities with the Central Securities Depository.

### Article 8 — Nature of the placement commitment

The Arranger is bound by a **best-efforts obligation** (obligation de moyens). It undertakes to use its best efforts to place the Securities, without guaranteeing the amount that will be subscribed.

Any firm underwriting or standby underwriting commitment, whether in whole or in part, may arise only from a separate agreement, approved by the Chief Executive Officer after obtaining the opinion of the RCCI and in compliance with the prudential standards applicable to the Company.

## Title III — Undertakings of the Issuer

### Article 9 — Information and cooperation

The Issuer:

- provides the Arranger, within the deadlines of the timetable, with all the documents and information listed in Appendix 3, together with any information required for the proper performance of the mandate;
- warrants that this information is accurate, complete and fair, and informs the Arranger without delay of any new fact likely to alter it;
- gives the Arranger and its advisers reasonable access to its senior management, its statutory auditors and its premises;
- obtains in good time the authorisations of its corporate bodies required by the OHADA Uniform Act on Commercial Companies and Economic Interest Groups and by its articles of association;
- complies, after the Transaction, with its ongoing and periodic disclosure obligations towards COSUMAF, the BVMAC and the holders of the Securities.

### Article 10 — Representations and warranties

The Issuer represents and warrants to the Arranger, on signature and on the Settlement Date:

1. that it is duly incorporated and has the capacity and authorisations required to enter into the agreement and carry out the Transaction;
2. that its financial statements for the last {{nb_exercices|nombre}} financial years give a true and fair view of its position and have been certified by its statutory auditors;
3. that no undisclosed dispute, proceedings or commitment is likely to significantly affect the Transaction or its ability to meet its obligations under the Securities;
4. that it is up to date with its tax and social security obligations;
5. that the Information Memorandum contains no omission or inaccuracy likely to mislead investors.

The Issuer remains solely responsible for the content of the Information Memorandum vis-à-vis investors and the authorities.

### Article 11 — Funds raised

The funds paid by subscribers are centralised in the Centralisation Account, which is separate from the Arranger's own accounts. They may not be used before the Settlement Date.

If the Minimum Subscription Threshold has not been reached at the close of the Subscription Period, the Transaction is cancelled. The funds are returned to subscribers free of charge within {{delai_restitution|nombre}} business days.

Within {{delai_rapport|nombre}} business days following the Settlement Date, the Arranger delivers to the Issuer a closing report setting out the amount subscribed, the breakdown of subscribers, the allocation applied and the statement of commissions.

## Title IV — Remuneration and expenses

### Article 12 — Commissions

In consideration for its services, the Arranger receives the following commissions, detailed in Appendix 4:

- a flat-rate **arrangement commission** of {{com_arrangement|lettres}}, payable as to {{com_arr_part}} on signature and as to the balance upon obtaining COSUMAF approval (visa);
- a **placement commission** of {{com_placement}} of the amounts actually subscribed and paid up, payable on the Settlement Date{% si com_succes = oui %};{% fin %}{% si com_succes = non %}{% si admission = oui %};{% fin %}{% si admission = non %}.{% fin %}{% fin %}
{% si com_succes = oui %}
- a **success commission** of {{com_succes_taux}} of the amount placed in excess of {{com_succes_seuil|lettres}}, payable on the Settlement Date{% si admission = oui %};{% fin %}{% si admission = non %}.{% fin %}
{% fin %}
{% si admission = oui %}
- a **listing commission** of {{com_admission}}, payable on the date of admission to listing.
{% fin %}

The commissions are stated exclusive of taxes. Each commission is invoiced separately. They may not be set off against other sums and may not be deducted from the funds raised without the prior written consent of the Issuer.

### Article 13 — Transaction expenses

The following are borne by the Issuer, whether or not advanced by the Arranger: the fees and charges of COSUMAF, the BVMAC and the Central Securities Depository; the fees of legal counsel, statutory auditors and the rating agency; printing, publication and investor presentation costs. Any expense exceeding {{seuil_frais}} advanced by the Arranger is subject to the Issuer's prior consent and is reimbursed on presentation of supporting documents.

## Title V — Compliance

### Article 14 — Confidentiality and inside information

Each Party keeps confidential the information received from the other under the agreement, save where disclosure is required by law or by a regulatory authority, or is necessary for the performance of the mandate.

Information relating to the Transaction constitutes inside information until it is made public. The Arranger enters the persons having access to it on an insider list and applies the rules on segregation of functions laid down in its Code of Conduct (PC-COD-001). The Issuer keeps its own insider list and provides it to the Arranger on request.

### Article 15 — Conflicts of interest

Before signature, the Arranger disclosed to the Issuer the shareholding links, mandates or business relationships likely to create a conflict of interest in the performance of the mandate: {{conflits}}. Any conflict arising during the mandate is brought to the Issuer's attention without delay.

### Article 16 — Anti-money laundering and counter-terrorist financing

The Issuer provides the Arranger with the identification details of the company, its senior management and its beneficial owners required by CEMAC Regulation No. 02/24 of 20 December 2024. The Arranger applies to subscribers the due diligence measures provided for by that text and may refuse any subscription where the origin of the funds has not been substantiated. These obligations may not be waived by agreement between the Parties.

## Title VI — Liability and termination of the agreement

### Article 17 — Liability and indemnification

The Arranger is liable for any fault committed in the performance of its tasks. It is not liable for the content of the information provided by the Issuer, nor for the outcome of the placement.

The Issuer indemnifies the Arranger against any loss, claim or sanction resulting from an inaccuracy or omission in the information it has provided, or from a breach of its representations and warranties.

Save in the event of gross negligence or wilful misconduct, the Arranger's liability is limited to the amount of the commissions received under the agreement.

### Article 18 — Conditions precedent

The opening of the Subscription Period is subject to the fulfilment of the following conditions:

1. COSUMAF approval (visa) of the Information Memorandum having been obtained;
2. the corporate resolutions authorising the issue having been adopted;
3. the guarantees and security provided for in Appendix 1 having been created, in accordance with the OHADA Uniform Act Organising Securities;
4. the absence of any Material Adverse Event;
5. payment of the portion of the arrangement commission payable on signature.

### Article 19 — Suspension and termination

The Arranger may suspend the performance of the mandate or propose the postponement of the Transaction in the event of a Material Adverse Event, after having informed the Issuer in writing.

Either Party may terminate the agreement by registered letter with acknowledgement of receipt in the event of a serious breach by the other Party that has not been remedied within {{delai_mise_en_demeure|nombre}} days following formal notice.

In the event of termination by the Issuer other than for breach by the Arranger, or of abandonment of the Transaction by the Issuer, the arrangement commission remains fully earned and the expenses incurred are reimbursed. If the Issuer carries out a transaction with the same purpose within {{delai_tail|nombre}} months following termination, the placement commission is due to the Arranger as if the Arranger had placed the Transaction.

### Article 20 — Force majeure

Neither Party is liable for any delay or failure to perform resulting from an event of force majeure. The Party invoking it informs the other without delay. If the impediment lasts more than {{delai_force_majeure|nombre}} days, either Party may terminate the agreement without compensation, any commissions already payable remaining due.

## Title VII — Final provisions

### Article 21 — Governing law

The agreement is governed by CEMAC Community law, the OHADA Uniform Acts and, for all other matters, {{droit}} law.

### Article 22 — Dispute resolution

The Parties first seek an amicable settlement for {{delai_amiable|nombre}} days. They may have recourse to mediation by COSUMAF.

{% si litiges = arbitrage %}
Failing agreement, the dispute is settled by arbitration under the auspices of the OHADA Common Court of Justice and Arbitration (CCJA), by {{arbitres}}, seated in {{lieu_arbitrage}}, in the French language.
{% fin %}

{% si litiges = juridictions %}
Failing agreement, the dispute is submitted to the competent courts of {{juridiction_ville}}.
{% fin %}

### Article 23 — Notices

Notices are given in writing, by letter delivered against receipt, by registered letter with acknowledgement of receipt or by confirmed email, to the addresses set out at the head of this agreement or to any other address subsequently notified.

### Article 24 — Miscellaneous

The agreement and its appendices constitute the entire agreement of the Parties on its subject matter. It may be amended only by a written amendment signed by both Parties. Neither Party may assign it without the written consent of the other. The invalidity of any clause does not affect the other clauses. The appendices form an integral part of the agreement.

Done at {{lieu_signature}}, on {{date_signature}}, in {{nb_exemplaires|nombre}} original counterparts.

@signatures(For the Issuer | {{emetteur_representant}}, {{emetteur_qualite}} ; For Purpose Capital S.A. | The Chief Executive Officer)
