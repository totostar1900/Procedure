---
titre: "Securities Account Opening Agreement"
resume: "Template agreement opening a securities account for the client with Purpose Capital S.A. — custody in a registered sub-account, client cash, signed orders, information, data, complaints. Articles 1 to 10 reproduce the agreement in force in the Guichet; Articles 11 to 14 supplement it."
diffusion: "Executive Management, Sales Department, RCCI, operations"
references:
  - ref: REG-01-22
    articles: "Obligations of intermediaries towards their clients, account keeping and custody"
  - ref: RG-COSUMAF-2023
    articles: "Identification and verification of clients (Art. 94 and 98); client information; complaints handling"
  - ref: DC-RG
    articles: "Book-entry registration, custody and settlement of securities"
  - ref: REG-02-24
    articles: "Customer due diligence, retention of documents for ten years"
  - ref: LOI-CM-2024-017
    articles: "Information of data subjects and their rights over their personal data"
  - ref: AUA
    articles: "Arbitration, if the Parties so choose"
historique:
  - version: "0.9"
    date: 2026-10-19
    objet: "Adoption of the Guichet agreement (version 2026-10-10), supplemented by Articles 11 to 14 and made available for account openings outside the Guichet"
    par: "Chief Executive Officer"
notes_redaction:
  - "Single source: Articles 1 to 10 reproduce word for word the \"agreement\" passages of the Guichet, with the same numbering. Any change to one must be carried over to the other on the same day."
  - "Articles 11 (contract notes, statements and rights attached to securities), 12 (liability), 13 (amendment of the agreement) and 14 (governing law and disputes) do not yet exist in the Guichet. If they are approved, add them to the \"agreement\" passages of the Guichet and announce the change to clients."
  - "In the Guichet, the printed agreement bears the wording \"version 2026-09\" whereas the version in force is 2026-10-10: to be aligned."
  - "The form is used for account openings on paper or outside the Guichet. In the Guichet, the agreement is completed automatically from the client file and accepted electronically."
  - "Have the template validated by the Company's legal counsel before its first use."
source: a85da3ddbfc87d38
---

**BETWEEN THE UNDERSIGNED:**

{% si titulaire_type = physique %}
**{{titulaire_nom}}**, born on {{naissance}}, of {{nationalite}} nationality, {{profession}}, holder of identity document {{piece}}, residing at {{adresse}}, {{ville}}, telephone {{telephone}}, email address {{email}},
{% fin %}
{% si titulaire_type = morale %}
**{{titulaire_nom}}**, {{forme}}, registered under number {{immatriculation}}, whose registered office is at {{adresse}}, {{ville}}, represented by {{representant}}, in the capacity of {{representant_qualite}}, duly authorised, telephone {{telephone}}, email address {{email}},
{% fin %}
{% si titulaire_type = groupement %}
**{{titulaire_nom}}**, {{forme}}, {{immatriculation}}, whose address is {{adresse}}, {{ville}}, represented by {{representant}}, in the capacity of {{representant_qualite}}, duly authorised, telephone {{telephone}}, email address {{email}},
{% fin %}

*hereinafter "the Holder",*

**AND**

**Purpose Capital S.A.**, a public limited company (société anonyme) with a Board of Directors, with a share capital of three hundred and seventeen million five hundred thousand CFA francs (FCFA 317,500,000), a brokerage firm (société de bourse) licensed by COSUMAF under number COSUMAF-SDB-01/2026, registered with the Trade and Personal Property Credit Register (RCCM) of Yaoundé under number {{pc_rccm}}, whose registered office is at Rue Joseph Essono Balla, Elig-Essono, Yaoundé (Cameroon), represented by its Chief Executive Officer, duly authorised for the purposes hereof,

*hereinafter "the Intermediary",*

hereinafter together referred to as the "Parties".

Securities account no. **{{numero_compte}}**.

The "Guichet" means the Intermediary's online service; the Holder's "personal area" is the part of the Guichet reserved for the Holder.

**IT HAS BEEN AGREED AS FOLLOWS:**

## Title I — The account

### Article 1 — Purpose

Purpose Capital S.A. ("the Intermediary"), a brokerage firm licensed by COSUMAF under no. COSUMAF-SDB-01/2026, opens for the Holder a securities account intended to receive the financial instruments acquired through it on the CEMAC money market (Treasury bills and bonds), on the BVMAC (shares, bonds, units in collective investment schemes (OPCVM)) and in any public offering that it presents.

### Article 2 — Custody and mandate to open accounts

The securities are dematerialised and registered in the Holder's name in a registered sub-account opened in the Holder's name, under the Intermediary's omnibus grouping, in the books of the designated depository (an institution approved as a Primary Dealer (Spécialiste en Valeurs du Trésor) for government securities; the central securities depository for listed securities).

To this end, the Holder gives the Intermediary a mandate to open in the Holder's name, without any further formality or signature, any account needed to execute the Holder's orders — a securities sub-account with the account keeper, registration in the register of a collective investment scheme — and to send, for these purposes only, the documents in the Holder's file to the account keeper, the management company and the depositary.

The mandate covers account opening and nothing else. The Holder remains the holder of their accounts and the sole decision-maker for their investments. No account opening gives rise to any charge.

For a resident Holder whose file has been approved, an order may be accepted before the sub-account is actually opened: the opening is initiated immediately and the order is only transmitted once the sub-account has been opened. If the opening does not succeed, the order lapses and the sums earmarked for it become available again.

### Article 3 — Cash

The cash needed for transactions passes through a settlement account segregated from the Intermediary's own funds. The funds must come from a bank account opened in the Holder's name; any payment from a third party is refused and returned.

Sums due to the Holder, in particular coupons, redemptions and sale proceeds, belong to the Holder. They are recorded in the Holder's cash ledger, movement by movement, which the Holder can consult at any time in their personal area. The Intermediary does not use them for its own account; they do not constitute a deposit.

This balance remains for as long as the Holder wishes. No sum is sent back to the Holder automatically.

The Holder may fund their settlement account in advance, so that their subsequent orders are settled without waiting for a transfer. This prepaid balance is subject to the same regime: it remains the Holder's property and does not constitute a deposit.

It is never compulsory. The choice of settlement method lies with the Holder: the Holder may settle each order individually, including by transfer after signing it, without ever building up a prepaid balance, and the Intermediary may not require one.

So that it does not lie idle, the Holder may, at their own request or on a proposal from the Intermediary which it is for the Holder to accept, invest all or part of this prepaid balance in units of a money market collective investment scheme registered in the Holder's name. The return is that of the fund; the Intermediary neither promises nor guarantees any return. The units are redeemed within the fund's centralisation period, during which the sums invested are not available to settle an order.

The Holder may at any time request payment of their available balance to the bank account declared at opening, and to that account only: account no. {{rib}} held with {{banque}}. The request is executed within seventy-two business hours of its receipt. The available balance is whatever is not earmarked for the settlement of a pending transaction, until that transaction is settled or lapses; sums earmarked for a transaction that is not filled, or is only partly filled, become available again as soon as the result is known.

A recorded movement is never corrected: an error is remedied by an entry in the opposite direction, so that the ledger can be read in its chronological order.

### Article 4 — Orders, signature and settlement

An order comes into existence upon the Holder's signature. The Holder gives it in their personal area, by one-time code, by passkey or by their device's code. Where the Holder settles their order immediately by an authenticated means of payment, the receipt for that payment serves as the signature of the order it settles; the Intermediary keeps proof of it and gives the Holder a copy.

Money never precedes the order: it accompanies the order when payment is immediate, and follows it when it is transferred, in which case it bears the reference printed on the signed order. The funds must come from an account opened in the Holder's name, whatever the means used.

Where the price is not known at signature, the Holder signs for a maximum amount; the Intermediary never commits the Holder beyond that amount.

The Intermediary transmits the signed and funded order to the SVT or to the market. The order is irrevocable once transmitted; it is executed on the terms of the auction or of the market, in full or in part, or not executed, without the Intermediary incurring any liability.

An expression of intent, a pre-auction survey or a request to be called back is not an order, calls for no payment and entails no commitment on either side.

## Title II — Information and relationship

### Article 5 — Information and categorisation

The Holder is categorised as a "{{categorie}}" client. The Holder acknowledges having received information on the risks (credit, price, liquidity, allocation) and on the functioning of the market, and being able to consult it at any time in the Guichet Guide. The key points are set out in Appendix 2.

### Article 6 — Charges

The applicable charges are those in the schedule of charges provided by the adviser (Appendix 1); there is no account opening fee. Any change in charges is notified thirty days before it applies.

### Article 7 — Communications

The Holder agrees to receive contract notes, statements and documents electronically (Guichet personal area, email, WhatsApp if the Holder has consented). The Holder may withdraw their WhatsApp consent at any time (keyword STOP).

{% si whatsapp = oui %}The Holder consents to receiving notifications by WhatsApp.{% fin %}{% si whatsapp = non %}The Holder does not, at this date, consent to receiving notifications by WhatsApp.{% fin %}

### Article 8 — Personal data and AML/CFT

The data and documents collected are used to identify the Holder, to keep the account and to meet regulatory obligations. They are kept for ten years after the end of the relationship. The Intermediary may request any additional document and suspend the account if there is doubt as to the source of funds.

The Holder's actions in the Guichet are recorded: the date, the subject and the device used. Viewing of a named item — a product sheet, a document or a session — is logged once per day and per item. Neither the length of a visit, nor scrolling, nor pointer movements, nor the order of the screens viewed is recorded.

These records are used to keep the file, to prove what the Holder has signed, to detect access that is not the Holder's own and to avoid asking the Holder again for what they have already provided. The Holder can consult them at any time in their personal area, under "Your activity". The detail is kept for thirteen months; after that, only counters remain, without the action itself. The documents and the order log, for their part, follow the ten-year retention period stated above.

The Intermediary may derive from them an assessment of the relationship, for its internal use only. That assessment never determines a price, a condition or an allocation: two Holders facing the same offer read the same thing. No decision producing an effect with regard to the Holder is taken by automated processing: an account restriction is decided by a person, states a reason and a duration, and is brought to the Holder's attention, except where the law requires silence.

### Article 9 — Person giving orders and succession

The account has only one person who may give orders: the Holder, identified by their access credentials. The Intermediary accepts no power of attorney and executes no order from a third party. Where the Holder is a legal person or a group, orders are given by its legal representative or by its designated joint holders, as declared in the file. In the event of death, the position is kept until instructions are received from the duly established heirs and successors.

{% si titulaire_type = groupement %}Designated joint holders and decision-making rule: {{cotitulaires}}.{% fin %}

### Article 10 — Complaints, term, termination

Complaints to info@purposecapital.africa; failing a satisfactory response, mediation by COSUMAF. The agreement is entered into for an indefinite term; either party may terminate it by giving thirty days' notice, with transactions in progress being completed.

## Title III — Supplementary provisions

### Article 11 — Contract notes, statements and rights attached to securities

Each executed transaction gives rise to a contract note made available to the Holder in their personal area. The Holder may consult their positions at any time and obtain, free of charge, a statement of positions or a certificate of holding.

Coupons, dividends and redemptions are recorded in the Holder's cash ledger as soon as they are received by the Intermediary. Where a corporate action requires a choice by the Holder (option, reserved subscription, public offer), the Intermediary informs the Holder, stating the time limit for responding and the option that will apply if no response is received. The voting rights attached to the securities belong to the Holder, who exercises them personally.

The Holder reports any error in a contract note or statement within thirty days of it being made available.

### Article 12 — Liability

The Intermediary performs its obligations with diligence and fairness, in the Holder's interest. It is liable for its own faults and for those of the service providers to which it has entrusted part of its duties.

It is not liable for changes in market prices, the default of an issuer, or the consequences of a force majeure event or of the interruption of a market infrastructure, a depository or a payment system not attributable to it. In such cases, it informs the Holder without delay and implements the measures provided for in its business continuity plan.

### Article 13 — Amendment of the agreement

The Intermediary may amend this agreement, in particular to take account of a change in regulations. Any amendment is brought to the Holder's attention at least thirty days before its entry into force, stating the articles that are changing and their effect. A Holder who refuses it may terminate the agreement free of charge before that date. An amendment required by law or regulation applies from the date it sets.

### Article 14 — Governing law and disputes

This agreement is governed by the regulations of the CEMAC and COSUMAF, by the OHADA Uniform Acts and, in the alternative, by Cameroonian law. Failing an amicable settlement after a complaint and, where applicable, mediation by COSUMAF, any dispute is brought before the competent courts of Yaoundé.

<div class="signatures">
<p>Done at {{lieu_signature}}, on {{date_signature}}, in {{nb_exemplaires|nombre}} original copies.</p>
<div class="sig-row">
<div class="sig"><span>The Holder — "read and approved"</span></div>
<div class="sig"><span>For Purpose Capital S.A., the Chief Executive Officer</span></div>
</div>
</div>
