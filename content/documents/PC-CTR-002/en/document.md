---
titre: "Firm Underwriting and Standby Underwriting Agreement"
resume: "Template agreement under which Purpose Capital S.A. undertakes to an issuer, in addition to the arrangement and placement mandate, either to subscribe for the securities itself (firm underwriting) or to subscribe for the balance not placed at closing (standby underwriting commitment), up to an underwritten amount and subject to conditions precedent."
diffusion: "Executive Management, Capital Markets Department, RCCI"
references:
  - ref: REG-01-22
    articles: "Public offering, authorised intermediaries, placement guarantee"
  - ref: RG-COSUMAF-2023
    articles: "Identity of the guarantors in the information memorandum (Art. 131); prudential standards for brokerage firms (Art. 11); ongoing disclosure"
  - ref: BVMAC-RM
    articles: "Admission to listing, centralisation, publication of results"
  - ref: DC-RG
    articles: "Book-entry registration, settlement"
  - ref: AUSCGIE
    articles: "Corporate authorisations for the issue, rights of shareholders and bondholders"
  - ref: AUA
    articles: "Arbitration, Common Court of Justice and Arbitration"
  - ref: OICV-PRINCIPES
    articles: "International good practice: management of intermediaries' risks and conflicts of interest in placement transactions"
historique:
  - version: "0.9"
    date: 2026-10-20
    objet: "Initial draft template, aligned with mandate agreement PC-CTR-001; each item of data is entered only once in the repository form"
    par: "Head of Capital Markets"
notes_redaction:
  - "Do not complete this template by hand. Use “Prepare an agreement” in the repository; the form calculates the Company's commitment as a percentage of its own funds and flags the thresholds of the Risk Management Policy (alert at 15%, prior approval of the Board of Directors above 25%)."
  - "Have the template validated by the Company's legal counsel before its first use, in particular the clauses on termination for a market event and on indemnification, and the tax treatment of the underwriting commission."
  - "Check whether COSUMAF prudential standards require specific own-funds coverage of underwriting commitments, or prior notification to COSUMAF; the internal limits of PC-POL-RIS-001 apply in the meantime."
  - "A firm underwriting or standby underwriting commitment entered into while the Company is also the arranger creates a conflict of interest in the allocation and resale of the Securities; apply the Conflicts of Interest Management Policy (PC-POL-CI-001)."
source: bc777b8521e14861
---

**BETWEEN THE UNDERSIGNED:**

**{{emetteur_nom}}**, {% si emetteur_forme = autre %}{{emetteur_forme_autre}}{% fin %}{% si emetteur_forme != autre %}{{emetteur_forme}}{% fin %} with share capital of {{emetteur_capital|lettres}}, registered with the Trade and Personal Property Credit Register (RCCM) of {{emetteur_rccm_ville}} under number {{emetteur_rccm}}, whose registered office is at {{emetteur_siege}} ({{emetteur_pays}}), represented by {{emetteur_representant}}, acting in the capacity of {{emetteur_qualite}}, duly authorised for the purposes hereof,

*hereinafter “the Issuer”,*

**AND**

**Purpose Capital S.A.**, a public limited company (société anonyme) with a board of directors, with share capital of three hundred and seventeen million five hundred thousand CFA francs (FCFA 317,500,000), a brokerage firm (société de bourse) licensed by COSUMAF under number COSUMAF-SDB-01/2026, registered with the Trade and Personal Property Credit Register (RCCM) of Yaoundé under number {{pc_rccm}}, whose registered office is at Rue Joseph Essono Balla, Elig-Essono, Yaoundé (Cameroon), represented by its Chief Executive Officer, duly authorised for the purposes hereof,

*hereinafter “the Underwriter” or “Purpose Capital”,*

hereinafter referred to together as the “Parties” and individually as a “Party”.

## Preamble

**Whereas**, under an arrangement and placement mandate agreement dated {{date_mandat}} (the “Mandate Agreement”), the Issuer entrusted Purpose Capital with arranging and placing an issue of {% si titres_nature = autres %}{{titres_autre}}{% fin %}{% si titres_nature != autres %}{{titres_nature}}{% fin %} in an amount of {{montant|lettres}} (the “Transaction”);

**Whereas** the Mandate Agreement contains only a best-efforts obligation and reserves any firm underwriting or standby underwriting commitment to a separate agreement;

**Whereas** the Issuer wishes to ensure that all or part of the Transaction will be subscribed, and Purpose Capital agrees to give this commitment from its own funds, within the limits and on the terms set out below,

**IT IS HEREBY AGREED AS FOLLOWS:**

## Title I — Purpose and definitions

### Article 1 — Definitions

Terms defined in the Mandate Agreement have the same meaning in this agreement. In addition:

- **Underwritten Amount**: {{montant_garanti|lettres}}, i.e. {{nb_titres_garantis}} Securities at the Subscription Price;
- **Subscription Price**: {{prix}} per Security, equal to the issue price set in the Information Memorandum;
- **Closing**: the close of the Subscription Period, scheduled for {{souscription_fin}};
- **Unsubscribed Balance**: the difference, if positive, between the Transaction Amount and the amount of subscriptions validly received and paid up at Closing, excluding subscriptions made by the Underwriter under this agreement;
- **Settlement Date**: {{date_reglement}}, or any other date set in the Information Memorandum;
- **Long-Stop Date**: {{date_limite}}, the date by which all conditions precedent must be fulfilled;
- **Market Event**: any of the events listed in Article 15.

### Article 2 — Purpose

Under this agreement, the Underwriter gives the Issuer a **{{engagement}}** commitment covering the Underwritten Amount, on the terms set out in Title II.

### Article 3 — Relationship with the Mandate Agreement

The Mandate Agreement remains in force. This agreement supplements it, without amending it, solely as regards the subscription of the Securities by the Underwriter. In the event of any conflict on that matter, this agreement prevails.

The termination of the Mandate Agreement, for whatever reason, automatically terminates this agreement, unless the Securities have already been settled.

## Title II — Commitment of the Underwriter

### Article 4 — Nature of the commitment

{% si engagement = bonne_fin %}
The Underwriter undertakes to subscribe, at the Subscription Price, for the Securities corresponding to the Unsubscribed Balance, up to the Underwritten Amount. It subscribes for nothing if the subscriptions received at Closing reach the Transaction Amount.

The placement with investors continues on the terms of the Mandate Agreement; the Underwriter steps in only at Closing, for the balance.
{% fin %}
{% si engagement = prise_ferme %}
The Underwriter undertakes to subscribe, at the Subscription Price, for all the Securities corresponding to the Underwritten Amount, on the Settlement Date, irrespective of the outcome of the placement with investors.

It may then sell these Securities to investors, during or after the Subscription Period, on the terms of Article 8. The risk of not reselling them, or of reselling them at a lower price, is borne by the Underwriter.
{% fin %}

The Underwriter's commitment is irrevocable, subject to the conditions precedent in Title III and the termination events in Title VI.

### Article 5 — Amount and portion of the Transaction underwritten

The Underwritten Amount represents {{ratio_garanti}} of the Transaction Amount. The Underwriter's commitment may under no circumstances exceed this amount, plus, where applicable, any accrued interest owed by it in the event of late payment.

{% si syndicat = syndicat %}
The Underwritten Amount is assumed by an underwriting syndicate. Purpose Capital's share is {{part_pc}}, representing a maximum commitment of {{engagement_pc|lettres}}. The other members of the syndicate and their shares are: {{cogarants}}.

The commitments of the members of the syndicate are **several and not joint**: each member is liable only for its own share. Purpose Capital coordinates the syndicate; a syndicate agreement (PC-CTR-003) governs the relationship between its members. The default of one member does not increase the share of the others, unless they agree otherwise in writing.
{% fin %}

### Article 6 — Calling and settlement of the commitment

{% si engagement = bonne_fin %}
1. No later than the business day following Closing, the Underwriter prepares, on the basis of the centralisation statement, the calculation of the Unsubscribed Balance using the template in Appendix 4, and notifies it to the Issuer.
2. The Underwriter subscribes for the corresponding Securities and pays their price into the centralisation account within {{delai_paiement|nombre}} business days following Closing and, at the latest, on the Settlement Date.
3. The Securities subscribed for by the Underwriter are delivered to it on the Settlement Date, at the same time as those of the other subscribers.

The Underwriter's subscriptions are never allocated before those of investors. In the event of oversubscription, the Underwriter does not subscribe for any Securities under this agreement.
{% fin %}
{% si engagement = prise_ferme %}
1. On the Settlement Date, the Underwriter pays the price of the Securities corresponding to the Underwritten Amount into the centralisation account, and the Securities are delivered to it.
2. Subscriptions received from investors for these Securities are met by transfer from the Underwriter, at the Subscription Price, on the same date or on a later date.
3. The Underwriter prepares the calculation in Appendix 4 and delivers it to the Issuer within five business days following the Settlement Date.
{% fin %}

### Article 7 — Own funds of the Underwriter

At the date of signature, Purpose Capital's maximum commitment represents {{ratio_fp}} of its own funds as at {{date_fonds_propres}}. Purpose Capital declares that it has obtained the internal authorisations required by its Risk Management Policy; approval of the Board of Directors: {{accord_conseil}}.

Purpose Capital maintains, until the Settlement Date, sufficient available resources to honour its commitment.

### Article 8 — Securities held by the Underwriter

The Securities subscribed for by the Underwriter are credited to its proprietary account, separate from its clients' accounts. The Underwriter may retain them or sell them freely, in compliance with market rules and its Conflicts of Interest Management Policy:

- its clients' orders are always executed before any sale or purchase for its own account;
- it does not use any inside information relating to the Issuer;
- it informs the Issuer, at the Issuer's request, of the number of Securities it holds.

## Title III — Conditions precedent

### Article 9 — Conditions

The Underwriter's commitment is subject to the following conditions, detailed in Appendix 2, being fulfilled no later than the Long-Stop Date and continuing to be met until the Settlement Date:

1. COSUMAF approval (visa) of the Information Memorandum having been obtained, without any material change to the terms of the Transaction not accepted by the Underwriter;
2. the Issuer's corporate resolutions authorising the issue having been adopted;
3. delivery of the closing documents listed in Appendix 2, in particular the legal opinion on the validity of the issue and the statutory auditors' certificates;
4. the accuracy of the Issuer's representations and warranties, as confirmed by the certificate in Appendix 3;
5. the absence of any Material Adverse Event within the meaning of the Mandate Agreement;
6. payment of the sums due under the Mandate Agreement.

The Underwriter may waive in writing all or any of these conditions, with the exception of the first.

### Article 10 — Non-fulfilment

If any condition has not been fulfilled by the Long-Stop Date, and unless waived by the Underwriter, this agreement automatically lapses, without compensation on either side. Where the unfulfilled condition is within the Issuer's control, half of the underwriting commission remains due, as provided for in Article 14.

## Title IV — Undertakings of the Issuer

### Article 11 — Representations and warranties

The Issuer repeats for the benefit of the Underwriter the representations and warranties given in the Mandate Agreement. It further represents, on signature, at Closing and on the Settlement Date:

1. that the Information Memorandum is accurate and complete and contains no omission likely to mislead investors;
2. that no material new fact has arisen since the approval (visa) without being the subject of a supplementary note;
3. that the issue and this agreement do not breach any commitment, articles of association or decision by which it is bound;
4. that the Securities, once issued, will be validly issued, fully paid up and freely transferable.

It delivers the certificate in Appendix 3 on the Settlement Date.

### Article 12 — Undertakings

The Issuer undertakes:

- to inform the Underwriter immediately of any fact likely to render a representation inaccurate or to constitute a Material Adverse Event;
- not to issue, without the written consent of the Underwriter, any securities of the same type for {{lockup_mois|nombre}} months following the Settlement Date;
- to apply the funds raised to the use announced in the Information Memorandum;
- to fulfil its disclosure obligations towards COSUMAF, the BVMAC and the holders of the Securities.

### Article 13 — Indemnification

The Issuer indemnifies the Underwriter, its senior managers and its Staff Members against any loss, claim, defence costs or sanction resulting from:

- any inaccuracy or omission in the Information Memorandum or in the information provided by the Issuer;
- any breach by the Issuer of its representations, warranties or undertakings.

This indemnity is not due in the event of gross negligence or wilful misconduct on the part of the Underwriter, or in respect of information provided by the Underwriter itself. It survives the termination of the agreement for five years.

## Title V — Remuneration

### Article 14 — Underwriting commission

In consideration for its commitment, the Underwriter receives an **underwriting commission** of {{com_garantie}} of the Underwritten Amount, i.e. {{com_garantie_montant|lettres}} exclusive of taxes{% si syndicat = syndicat %}, shared among the members of the syndicate in proportion to their shares{% fin %}.

The commission remunerates the commitment given, whether or not it is called. It is payable on the Settlement Date. If the Transaction is abandoned by the Issuer after the approval (visa), or if the agreement is terminated for a breach by the Issuer, half of the commission remains due.

The commission is invoiced separately from the commissions under the Mandate Agreement. It may not be set off against the price of the Securities subscribed for by the Underwriter.

## Title VI — Termination

### Article 15 — Underwriter's right of termination

The Underwriter may terminate this agreement by written notice, at any time before payment of the price of the Securities for which it subscribes, upon the occurrence of any of the following events:

1. a general suspension of trading on the BVMAC, or an interruption of settlement by the Central Securities Depository, for more than one trading day;
2. a major political, economic, financial or security event, in the CEMAC or in the Issuer's country, which, in the reasonable opinion of the Underwriter, makes the completion of the Transaction impossible or seriously jeopardises it;
3. a Material Adverse Event affecting the Issuer;
4. the inaccuracy of any representation or the breach of any undertaking by the Issuer;
5. a decision by an authority suspending or withdrawing the approval (visa).

Before terminating, the Underwriter consults the Issuer, if time permits, with a view to postponing the Transaction.

### Article 16 — Force majeure

Neither Party is liable for any failure to perform resulting from an event of force majeure. If the impediment lasts more than {{delai_force_majeure|nombre}} days, either Party may terminate the agreement without compensation.

### Article 17 — Effects of termination

Termination releases the Underwriter from its subscription commitment. It does not affect the Securities already settled, the indemnity under Article 13 or the commission due under Article 14. It does not affect the Mandate Agreement, unless the Parties decide otherwise.

## Title VII — Final provisions

### Article 18 — Confidentiality, conflicts of interest and due diligence

Articles 14 to 16 of the Mandate Agreement (confidentiality and inside information, conflicts of interest, anti-money laundering and counter-terrorist financing) apply to this agreement.

### Article 19 — Governing law

The agreement is governed by CEMAC Community law, the OHADA Uniform Acts and, for all other matters, {{droit}} law.

### Article 20 — Dispute resolution

The Parties first seek an amicable settlement for {{delai_amiable|nombre}} days. They may have recourse to mediation by COSUMAF.

{% si litiges = arbitrage %}
Failing agreement, the dispute is settled by arbitration under the auspices of the OHADA Common Court of Justice and Arbitration (CCJA), by {{arbitres}}, seated in {{lieu_arbitrage}}, in the French language.
{% fin %}

{% si litiges = juridictions %}
Failing agreement, the dispute is submitted to the competent courts of {{juridiction_ville}}.
{% fin %}

### Article 21 — Miscellaneous

Notices are given in writing, by letter delivered against receipt, by registered letter with acknowledgement of receipt or by confirmed email. The agreement and its appendices constitute the entire agreement of the Parties on its subject matter; it may be amended only by a written amendment signed by both Parties, and may not be assigned without the written consent of the other Party. The invalidity of any clause does not affect the other clauses. The appendices form an integral part of the agreement.

Done at {{lieu_signature}}, on {{date_signature}}, in {{nb_exemplaires|nombre}} original counterparts.

@signatures(For the Issuer | {{emetteur_representant}}, {{emetteur_qualite}} ; For Purpose Capital S.A. | The Chief Executive Officer)
