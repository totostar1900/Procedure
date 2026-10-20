---
titre: "Placement Syndicate Agreement"
resume: "Template agreement under which Purpose Capital S.A., as lead manager of a public offering approved (visa) by COSUMAF, associates one to three brokerage firms or banks with the placement of the securities — role of the lead manager, members' undertakings, centralisation, allocation, retrocession of commissions."
diffusion: "Executive Management, Capital Markets Department, Sales Department, RCCI"
references:
  - ref: REG-01-22
    articles: "Public offering, intermediaries authorised to place securities"
  - ref: RG-COSUMAF-2023
    articles: "Identity of the arrangers and the lead manager in the information memorandum (Art. 131); approval (visa) application file (Art. 155); disclosure and marketing of issues"
  - ref: BVMAC-RM
    articles: "Centralisation, publication of results, admission to listing"
  - ref: DC-RG
    articles: "Book-entry registration, settlement"
  - ref: REG-02-24
    articles: "Due diligence on subscribers, responsibility of each intermediary"
  - ref: AUA
    articles: "Arbitration clause, CCJA arbitration"
  - ref: ICMA-AGREEMENT
    articles: "International practice: agreement between the lead manager and the syndicate members (roles, undertakings, selling restrictions)"
historique:
  - version: "0.9"
    date: 2026-10-20
    objet: "Initial draft template, completed via a form, aligned with the mandate agreement PC-CTR-001"
    par: "Head of Capital Markets"
notes_redaction:
  - "Do not complete this template by hand. Use \"Prepare an agreement\" in the repository; the Word and PDF files are only produced once all required fields are completed and consistent."
  - "The template covers a \"best efforts\" placement (obligation of means). If a member gives a firm or underwriting commitment, also use the firm underwriting and standby underwriting commitment agreement (PC-CTR-002)."
  - "Check in the COSUMAF General Regulation which article allows the brokerage firm appointed by the issuer to form a placement syndicate with other brokerage firms and credit institutions, and cite it in the preamble."
  - "Confirm the flow of funds with the members: transfer of the funds collected to the Centralisation Account no later than the business day following their receipt, or direct centralisation by the subscribers."
  - "Have the template validated by the Company's legal counsel before its first use."
source: ba072a9b7edfae4e
---

**BETWEEN THE UNDERSIGNED:**

**Purpose Capital S.A.**, a public limited company (société anonyme) with a Board of Directors, with a share capital of three hundred and seventeen million five hundred thousand CFA francs (FCFA 317,500,000), a brokerage firm (société de bourse) licensed by COSUMAF under number COSUMAF-SDB-01/2026, registered with the Trade and Personal Property Credit Register (RCCM) of Yaoundé under number {{pc_rccm}}, whose registered office is at Rue Joseph Essono Balla, Elig-Essono, Yaoundé (Cameroon), represented by its Chief Executive Officer, duly authorised for the purposes hereof,

*hereinafter "the Lead Manager" or "Purpose Capital",*

**AND**

**{{membre1_nom}}**, {{membre1_type}} under number {{membre1_agrement}}, whose registered office is at {{membre1_siege}}, represented by {{membre1_representant}}, duly authorised for the purposes hereof,

{% si nb_membres dans deux,trois %}
**{{membre2_nom}}**, {{membre2_type}} under number {{membre2_agrement}}, whose registered office is at {{membre2_siege}}, represented by {{membre2_representant}}, duly authorised for the purposes hereof,
{% fin %}

{% si nb_membres = trois %}
**{{membre3_nom}}**, {{membre3_type}} under number {{membre3_agrement}}, whose registered office is at {{membre3_siege}}, represented by {{membre3_representant}}, duly authorised for the purposes hereof,
{% fin %}

*hereinafter {% si nb_membres = un %}"the Member"{% fin %}{% si nb_membres != un %}together "the Members" and individually "a Member"{% fin %},*

the Lead Manager and {% si nb_membres = un %}the Member{% fin %}{% si nb_membres != un %}the Members{% fin %} being hereinafter together referred to as the "Parties".

## Preamble

**Whereas** {{emetteur_nom}} (the "Issuer"), whose registered office is in {{emetteur_pays}}, has, by an agreement dated {{date_mandat}}, appointed Purpose Capital as arranger and lead manager for the placement of a public offering of {% si titres_nature = autres %}{{titres_autre}}{% fin %}{% si titres_nature != autres %}{{titres_nature}}{% fin %} in an amount of {{montant|lettres}} (the "Offering");

**Whereas** the regulations of the Central African financial market allow the brokerage firm appointed by the issuer to form, for the purposes of the placement, a syndicate with other brokerage firms and credit institutions;

**Whereas** Purpose Capital wishes to associate {% si nb_membres = un %}the Member{% fin %}{% si nb_membres != un %}the Members{% fin %} with the placement of the Offering in order to broaden its distribution to investors in the CEMAC, which {% si nb_membres = un %}the Member accepts{% fin %}{% si nb_membres != un %}the Members accept{% fin %} on the terms set out below,

**IT HAS BEEN AGREED AS FOLLOWS:**

## Title I — Purpose and definitions

### Article 1 — Definitions

In this agreement, the terms below have the meanings given to them hereafter. They are written with a capital letter throughout the agreement and its appendices.

- **Securities**: the financial securities issued as part of the Offering, with a unit nominal value of {{nominal}} and an issue price of {{prix_emission}};
- **Information Memorandum**: the prospectus for the Offering approved (visa) by COSUMAF under number {{visa_ref}}, including its supplementary and corrective notes;
- **Subscription Period**: from {{souscription_debut}} to {{souscription_fin}} inclusive, unless extended or closed early by announcement published in accordance with the Information Memorandum;
- **Settlement Date**: {{date_reglement}}, or any other date set in the Information Memorandum;
- **Centralisation Account**: account no. {{compte_numero}} held with {{compte_banque}}, into which the funds paid by all subscribers are centralised;
- **Syndicate**: the group formed by the Lead Manager and {% si nb_membres = un %}the Member{% fin %}{% si nb_membres != un %}the Members{% fin %} for the placement of the Securities;
- **Valid Subscription**: a subscription received during the Subscription Period, using the subscription form provided for in the Information Memorandum, which is complete, signed and covered by funds actually received, and for which the due diligence measures have been carried out.

### Article 2 — Purpose

This agreement governs the participation of {% si nb_membres = un %}the Member{% fin %}{% si nb_membres != un %}the Members{% fin %} in the placement of the Securities: role of the Lead Manager, undertakings of each Member, flow of subscriptions and funds, allocation and remuneration.

Each Member places the Securities with its own clients and with the investors it approaches, **in its own name and under its own responsibility**, in accordance with the Information Memorandum. It does not act in the name of the Issuer or in the name of the Lead Manager.

### Article 3 — Nature of the commitment

The Members and the Lead Manager are bound by an **obligation of means**: each uses its best efforts to place the Securities, without guaranteeing any amount of subscriptions. The quotas in Appendix 1 are indicative; they serve to organise the marketing and constitute neither a ceiling nor a firm commitment.

No Member undertakes to subscribe, or to procure subscribers, for Securities that have not been placed. Such a commitment may only arise from a separate firm underwriting or standby underwriting commitment agreement.

### Article 4 — Effective date

This agreement takes effect upon its signature. However, no placement may begin before COSUMAF approval (visa) of the Information Memorandum has been obtained and the Subscription Period has opened.

## Title II — Role of the Lead Manager

### Article 5 — Duties of the Lead Manager

The Lead Manager:

1. provides each Member with the approved Information Memorandum, the subscription form, the timetable in Appendix 2 and the authorised promotional documents;
2. keeps the consolidated statement of the Syndicate's subscriptions, based on the statements sent by the Members;
3. centralises the funds in the Centralisation Account and reconciles, each day, the funds received against the subscriptions reported;
4. informs the Members of the progress of subscriptions, of any extension or early closure and of any new development affecting the Offering;
5. determines, together with the Issuer, the allocation of the Securities and notifies it to each Member;
6. coordinates settlement with the Central Securities Depository and, where applicable, admission to listing on the BVMAC;
7. publishes the results of the Offering as provided for by the regulations and sends COSUMAF the required information.

### Article 6 — Single point of contact

The Lead Manager is the sole point of contact of the Issuer, COSUMAF, the BVMAC and the Central Securities Depository for the Offering. A Member that receives a request from any of them forwards it without delay to the Lead Manager.

## Title III — Undertakings of the Members

### Article 7 — Placement

Each Member:

- markets the Securities only during the Subscription Period and solely on the basis of the approved Information Memorandum;
- gives each subscriber the Information Memorandum or its summary and informs the subscriber of the risks of the investment;
- ensures, for its clients, that the subscription is suited to their profile, in accordance with its own rules;
- accepts only Valid Subscriptions, on the form provided for in the Information Memorandum;
- promises no benefit, return or allocation not provided for in the Information Memorandum.

### Article 8 — Communication

No Member circulates any document, advertisement or information relating to the Offering other than those provided by the Lead Manager, without the Lead Manager's prior written consent. No information is communicated before COSUMAF approval (visa) has been obtained.

### Article 9 — Placement restrictions

The Securities are placed exclusively in the CEMAC countries, with the categories of investors provided for in the Information Memorandum. A Member does not offer them in any country whose regulations prohibit the offer or make it subject to an authorisation that has not been obtained.

### Article 10 — Know your subscriber

Each Member applies to its subscribers the due diligence measures provided for by CEMAC Regulation No. 02/24: identification and verification of identity, beneficial owners, source of funds, screening against sanctions lists. It remains solely responsible for them and keeps the supporting documents for ten years. On request, it provides the Lead Manager with the information needed for the Lead Manager to meet its own obligations or to respond to requests from the authorities.

A Member refuses any subscription for which the source of funds is not substantiated. It does not pass on to the Lead Manager any subscription from a person subject to an asset freezing measure.

### Article 11 — Transmission of subscriptions and funds

Each Member:

1. sends the Lead Manager, on each business day of the Subscription Period before {{heure_etat}}, the statement of its subscriptions using the template in Appendix 3, even when it has received no subscriptions;
2. transfers the funds received from its subscribers to the Centralisation Account within {{delai_fonds|nombre}} business day(s) of their receipt, quoting the reference of the corresponding statement;
3. delivers the final statement of its subscriptions, together with the subscription forms, within {{delai_cloture|nombre}} business day(s) of the close of the Subscription Period;
4. holds its subscribers' funds, until they are transferred, in an account separate from its own funds.

The Lead Manager may refuse any subscription or funds sent after the deadlines set by the timetable in Appendix 2.

## Title IV — Allocation, settlement and refund

### Article 12 — Allocation

If the total of Valid Subscriptions does not exceed the Offering Amount, each subscription is satisfied in full.

In the event of oversubscription, the Securities are allocated {{allocation}}. The same rule applies to all subscriptions, whichever member of the Syndicate received them. The Lead Manager may not favour its own clients, its staff or any Member.

The Lead Manager notifies each Member of the allocation to its subscribers no later than the day before the Settlement Date.

### Article 13 — Settlement

On the Settlement Date, the allocated Securities are credited by book entry in the names of the subscribers, through the Member that keeps their account, in accordance with the rules of the Central Securities Depository. Each Member sends a contract note to its subscribers.

### Article 14 — Refund

Funds corresponding to subscriptions that are not satisfied or are scaled back are refunded to the subscribers, free of charge, within {{delai_restitution|nombre}} business days of notification of the allocation, through the Member that received them. If the Offering is cancelled, in particular because the success threshold provided for in the Information Memorandum is not reached, all funds are refunded within the same period.

## Title V — Remuneration

### Article 15 — Commissions

Purpose Capital receives from the Issuer a placement commission of {{com_placement}} of the amounts subscribed and paid up. Out of this commission, it pays each Member a **retroceded placement commission** of {{com_retro}} of the amounts subscribed through that Member that are actually allocated and paid up, in accordance with the scale in Appendix 4.

The commissions are paid within {{delai_paiement|nombre}} business days of their receipt by Purpose Capital, against the Member's invoice. They are stated exclusive of tax. Each commission is the subject of a separate invoice and a separate payment; they are not set off against any other sums.

No commission is due on a subscription that is not valid, not satisfied or not paid up, nor if the Offering is cancelled.

### Article 16 — Expenses

Each Party bears its own marketing expenses. The expenses of the Offering are borne by the Issuer under the terms of the mandate agreement.

## Title VI — Compliance and liability

### Article 17 — Confidentiality and inside information

Each Party keeps confidential the information received in connection with the Offering, except where disclosure is required by law or by an authority. Until they are published, the information relating to the Offering constitutes inside information: each Party keeps a list of the persons who have access to it and provides it to the Lead Manager on request. No Party, nor any of its senior managers or staff, deals in the Issuer's securities using that information.

### Article 18 — Conflicts of interest

Before signature, each Member declares to the Lead Manager any links with the Issuer that may create a conflict of interest, and informs its subscribers of those that concern them. Subscriptions for the own account of a Party, its senior managers or its staff are only satisfied after those of clients, in accordance with the Lead Manager's Conflicts of Interest Policy.

### Article 19 — Liability

Each Party is liable for its own faults and those of its staff. A Member indemnifies the Lead Manager against any loss, claim or sanction resulting from a breach of its undertakings, in particular regarding due diligence, communication or the transmission of subscriptions and funds. The Lead Manager is not liable for the content of the Information Memorandum, which is the responsibility of the Issuer.

There is no joint and several liability between the Parties. The agreement creates neither a partnership nor a reciprocal agency between them.

### Article 20 — Withdrawal and exclusion

A Member may withdraw from the Syndicate before the opening of the Subscription Period, in writing. The Lead Manager may exclude a Member that seriously breaches its undertakings, after a formal notice that has remained without effect for two business days; the excluded Member forwards the subscriptions and funds received without delay.

### Article 21 — Termination of the agreement

The agreement ends upon payment of the last commission due, or upon refund of the funds if the Offering is cancelled. Articles 10, 17 and 19 survive its termination.

## Title VII — Final provisions

### Article 22 — Governing law

The agreement is governed by CEMAC Community law, the OHADA Uniform Acts and, for all other matters, Cameroonian law.

### Article 23 — Dispute resolution

The Parties first seek an amicable settlement for {{delai_amiable|nombre}} days. They may have recourse to mediation by COSUMAF.

{% si litiges = arbitrage %}
Failing agreement, the dispute is settled by arbitration under the auspices of the OHADA Common Court of Justice and Arbitration (CCJA), by {{arbitres}}, in {{lieu_arbitrage}}, in the French language.
{% fin %}

{% si litiges = juridictions %}
Failing agreement, the dispute is submitted to the competent courts of {{juridiction_ville}}.
{% fin %}

### Article 24 — Miscellaneous

Notices are given in writing, by letter delivered against receipt or by confirmed email, to the addresses stated at the head of this agreement. The agreement and its appendices constitute the entire agreement of the Parties; it may only be amended by an amendment signed by all the Parties and may not be assigned without their consent. The appendices form an integral part of it.

Done at {{lieu_signature}}, on {{date_signature}}, in {{nb_exemplaires|nombre}} original copies.

{% si nb_membres = un %}
@signatures(For Purpose Capital S.A. | The Chief Executive Officer ; For {{membre1_nom}} | {{membre1_representant}})
{% fin %}
{% si nb_membres = deux %}
@signatures(For Purpose Capital S.A. | The Chief Executive Officer ; For {{membre1_nom}} | {{membre1_representant}} ; For {{membre2_nom}} | {{membre2_representant}})
{% fin %}
{% si nb_membres = trois %}
@signatures(For Purpose Capital S.A. | The Chief Executive Officer ; For {{membre1_nom}} | {{membre1_representant}})

@signatures(For {{membre2_nom}} | {{membre2_representant}} ; For {{membre3_nom}} | {{membre3_representant}})
{% fin %}
