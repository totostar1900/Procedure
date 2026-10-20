---
titre: "Post-trade procedure: settlement, account keeping and custody, and corporate actions"
resume: "What the back office of Purpose Capital S.A. does after an order is executed — confirmation, settlement at the central securities depository, settlement fails, securities account keeping, statements, transfers, corporate actions, primary market — with four-eyes checks and daily controls."
diffusion: "Executive Management, operations (back office), accounting, RCCI"
references:
  - ref: DC-RG
    articles: "Affiliation of account keepers, account opening, settlement instructions and settlement cycle, delivery versus payment, handling of settlement fails, corporate actions"
  - ref: BVMAC-RM
    articles: "Obligations of market members after trading, settlement of transactions, buy-in in the event of failure to deliver"
  - ref: BVMAC-INST-02
    articles: "Trading sessions and publication of trading results, basis for the matching of executions"
  - ref: RG-COSUMAF-2023
    articles: "Obligations of intermediaries in account keeping and custody, client information, retention of documents for ten years (Art. 105), combination of functions justified by the size of the firm (Art. 112)"
  - ref: REG-01-22
    articles: "Organisation of the regional financial market; role of the central securities depository and of intermediaries acting as account keepers"
  - ref: AUSCGIE
    articles: "Dematerialised securities registered in an account; rights of shareholders and bondholders (dividends, preferential subscription rights, general meetings)"
  - ref: AUS
    articles: "Pledge of securities and of securities accounts"
  - ref: REG-02-24
    articles: "Asset freezing and due diligence on transfers of securities"
  - ref: OICV-PRINCIPES
    articles: "International good practice: protection of client assets, prompt and safe settlement of transactions"
  - ref: FCA-CASS
    articles: "International good practice: position keeping, reconciliations, processing of corporate actions for clients"
historique:
  - version: "0.9"
    date: 2026-10-20
    objet: "Initial draft"
    par: "RCCI"
notes_redaction:
  - "Organisational assumption to be confirmed: the procedure assumes that the Company opens its clients' securities accounts (agreement PC-CTR-004 and the Guichet) and acts as account keeper and custodian affiliated to the single central securities depository for listed securities. Articles 9, 10, 14 and 17, and Article 21 (entitlement statements from the central securities depository), are specific to that role and flagged in the text. If the Company relies on a third-party custodian, those articles must be adapted: the desk then sends its instructions to the custodian and checks its reports. Note that Article 2 of PC-CTR-004 refers to registration \"in the books of the designated depository\": check consistency with the status adopted and with the licence."
  - "Settlement cycle: the text refers to \"T+n as set by the market rules\". According to the information available, BVMAC transactions settle at T+3 on a delivery-versus-payment basis; confirm this against the General Regulation of the single central securities depository and BVMAC notices, together with the instruction cut-off times and the bank or system used for cash settlement (BEAC)."
  - "Buy-in and penalties: the exact BVMAC and central securities depository rules must be checked. The principle that a penalty received is passed on to the client who suffered the fail, and that a penalty owed through the Company's own fault is never recharged to the client (Article 12), is drawn from the EU Central Securities Depositories Regulation (CSDR), which is not among the reference texts of the repository."
  - "Tax: the rates of tax on income from movable capital and the split of withholding between issuer, paying agent and the Company must be confirmed with a tax adviser (Cameroon General Tax Code and those of other issuing States, tax treaties). The General Tax Code is not among the reference texts: add it if the Company must itself withhold and remit tax."
  - "Inactive accounts (Article 19): the two-year period and the treatment of assets left unclaimed over the long term (limitation, any transfer to a public body) must be validated by legal counsel."
  - "Seizures (Article 18): check with legal counsel the rules and time limits of the OHADA Uniform Act on simplified recovery procedures and enforcement measures concerning the seizure of securities; this text is not among the reference texts."
  - "Transfers: the tariff schedule (PC-CTR-004, Appendix 1) does not mention any securities transfer fee. The procedure makes transfers free of charge; to be confirmed and added to the \"What is not charged\" list."
  - "Four-eyes check: the desk function is held by the Chief Executive Officer until a head of operations is appointed. The Chief Executive Officer designates in writing the authorised second Staff Member (Article 4) and their deputy; this may be neither the RCCI for routine tasks nor the person who entered the movement."
  - "Incidents: the procedure refers to the incident management procedure (PC-PRO-INC-001), currently being drafted. Until it is adopted, the incident form of the Risk Management Policy (PC-POL-RIS-001, Appendix 4) applies."
source: 919caea480519c9d
---

## Title I — General provisions

### Article 1 — Purpose

This procedure sets out what Purpose Capital S.A. (the "Company") does **after an order has been executed**, and throughout the time it holds its clients' securities:

- the daily post-trade cycle: confirmation to the client, matching with market data, settlement instructions, settlement at the central securities depository, fails;
- securities account keeping: opening in the books, positions, statements, transfers, pledges and blocks, inactive accounts, closure;
- corporate actions: dividends, coupons, redemptions, capital increases, splits, mergers;
- the settlement of primary market transactions.

It follows on from the procedure for the reception, transmission and execution of orders (PC-PRO-ORD-001), which ends at execution and the contract note. The principle is simple: **a client must always see, in their Guichet area, exactly what they own, and receive it on the scheduled date.**

### Article 2 — Scope and organisation adopted

The procedure applies to all securities that the Company holds or has held for its clients: securities listed on the BVMAC, government securities, securities subscribed on the primary market, and units in collective investment schemes (CIS).

It is based on the following organisation:

| Securities | Where they are registered | Role of the Company |
| --- | --- | --- |
| Listed securities and securities issued by public offering | Nominee sub-accounts in each client's name, under the Company's omnibus account, at the single central securities depository | Account keeper and custodian affiliated to the central securities depository |
| Government securities | Nominee sub-accounts with the primary dealer (SVT) | Intermediary; the SVT keeps the account |
| CIS units | CIS register, in the client's name | Distributor; the management company keeps the register |

Articles 9, 10, 14 and 17, and Article 21 for entitlement statements, describe tasks **specific to the account keeper and custodian**. They bear the mention "*Account keeper*". If the Company entrusts custody to a third-party custodian, those tasks are carried out by the custodian; the desk then sends it the instructions and checks its reports with the same time limits and the same supporting documents.

### Article 3 — Definitions and cross-references

- **T**: the trade date. **Settlement date**: the day on which securities and cash change hands, at **T+n**, n being set by the rules of the market and of the central securities depository.
- **Delivery versus payment**: securities are delivered only if the cash is paid, at the same time.
- **Settlement instruction**: the message by which the Company asks the central securities depository to deliver or receive securities against cash.
- **Fail**: a transaction that has not settled on the settlement date.
- **Corporate action (CA)**: any event decided by an issuer that changes the securities or gives rise to an entitlement: dividend, coupon, redemption, allotment, subscription, split, reverse split, exchange.
- **Ex-date**: from that day, the security trades without the entitlement. **Record date**: the day on which the positions giving entitlement are determined. **Payment date**: the day on which the issuer pays.
- **Four-eyes check**: the verification of a task by a second person, other than the one who performed it.

This document refers, without repeating them, to: the securities account agreement (PC-CTR-004), the procedures on orders (PC-PRO-ORD-001), client onboarding (PC-PRO-KYC-001), segregation and reconciliation (PC-PRO-SEG-001), archiving (PC-PRO-ARC-001) and incident management (PC-PRO-INC-001), the Business Continuity Plan (PC-POL-PCA-001), the Risk Management Policy (PC-POL-RIS-001) and the AML/CFT Policy (PC-POL-LBC-001).

### Article 4 — Who does what

| Function | Role |
| --- | --- |
| Desk (operations, back office) | Performs all the tasks in the procedure, keeps the registers, completes the checklist in Appendix 1 every day. Function held by the Chief Executive Officer until a head of operations is appointed |
| Authorised second Staff Member | Designated in writing by the Chief Executive Officer. Performs the four-eyes check: verifies, before they are sent, settlement instructions, transfers, CA credits and the daily checklist |
| Head of Capital Markets | Provides trading results; resolves trading discrepancies with the BVMAC and the counterparty; centralises subscriptions when the Company is lead manager |
| Chief Executive Officer | Decides on cases outside the procedure: persistent fail, buy-in, compensation of a client, block following a seizure |
| Accounting | Records the Company's movements (commissions, penalties, compensation); prepares the tax returns incumbent on the Company |
| RCCI | Second-level control; receives incidents; handles AML/CFT, freezing and seizure matters |

The person who enters a movement is never the one who validates it. When the second Staff Member is absent, the check is carried out on the next business day at the latest, and the RCCI is informed.

### Article 5 — Basic rules

1. **No security and no franc is credited to a client before it has been received.** The Guichet shows a transaction as "pending settlement" until settlement is confirmed.
2. **Every movement has a supporting document**: notice from the central securities depository, the SVT or the management company, bank statement, signed instruction from the client.
3. **The Guichet is the only account record.** No parallel spreadsheet is authoritative; a working spreadsheet is reconciled with the Guichet the same day.
4. **The client never bears the consequences of an error or delay by the Company.**
5. **A client's securities serve only that client**: never lent, pledged or blocked without their written consent or a court decision.

## Title II — The daily cycle after execution

### Article 6 — The back-office day

| Time | Task | Supporting document |
| --- | --- | --- |
| Opening | Read the reports from the central securities depository, the SVTs, the management companies and the settlement bank; record transactions settled the previous day; identify fails | Reports; fails register (Appendix 2) |
| Opening | Read CA announcements (BVMAC, central securities depository, issuers, Treasury) | CA sheets (Appendix 3) |
| Before noon | Daily cash reconciliation (PC-PRO-SEG-001, Article 9) | Appendix 1 of PC-PRO-SEG-001 |
| After the session | Retrieve trading results, issue contract notes, match, enter settlement instructions | Contract notes; instructions |
| End of day | Reconciliation of orders, executions and settlements (PC-PRO-ORD-001, Appendix 4); daily checklist | Appendix 1, signed by the desk and the second Staff Member |

The cut-off times of the central securities depository, the BVMAC and the SVTs are displayed at the desk workstation and carried over into Appendix 1. A task not completed before a cut-off time is an incident.

### Article 7 — Confirmation to the client

The contract note is issued in accordance with Article 15 of PC-PRO-ORD-001, no later than the business day following execution. Before sending it, the desk checks that the security, direction, quantity, price, fees and net amount match the session result. The second Staff Member checks, on the same day, one contract note in five and all those whose amount exceeds FCFA 10,000,000.

An incorrect contract note is replaced by a corrected note bearing the words "cancels and replaces", and the client is informed. The error is reported as an incident (Article 32).

### Article 8 — Matching with market data

On the trade date, the desk compares, transaction by transaction, the executions recorded in the Guichet with:

- the BVMAC session report;
- the transactions that the central securities depository allocates to the Company for settlement.

Both must agree on the security, direction, quantity, price, counterparty and settlement date. A discrepancy is reported to the Head of Capital Markets, who resolves it with the BVMAC or the counterparty **before the instruction cut-off time** of the central securities depository. A discrepancy unresolved at that time is entered in the fails register (Appendix 2).

### Article 9 — Settlement instructions

*Account keeper.*

For each matched transaction, the desk enters the settlement instruction into the central securities depository's system, within the time limit set by its rules: security, quantity, amount, counterparty, settlement date, sub-account of the client concerned.

The second Staff Member checks the instruction **before it is validated**: the sub-account is indeed the client's, the securities for a sale are available and not blocked, the cash for a purchase is earmarked in the client's ledger. The system records the identity of both persons and the time of each step.

An instruction is not amended after validation: it is cancelled and re-entered, with the same four-eyes check.

### Article 10 — Settlement at the central securities depository

*Account keeper.*

On the settlement date, settlement takes place on a delivery-versus-payment basis. The desk checks, on the report of the central securities depository and the statement of the settlement bank, that:

- the securities purchased are registered in the client's sub-account, and the securities sold have left it;
- the cash has been debited or credited for the expected amount.

It then moves the transaction to "settled" status in the Guichet, which updates the client's position and cash ledger. The proceeds of a sale are available to the client only at that point.

### Article 11 — Settlement fails

As no order is transmitted without cash or securities cover (PC-PRO-ORD-001, Article 8), a fail in principle arises from the counterparty, the market or an error. Every fail is entered the same day in the register in Appendix 2 and handled according to the following table:

| Time since the settlement date | Who | Action |
| --- | --- | --- |
| Same day | Desk | Investigation of the cause with the central securities depository, the BVMAC or the counterparty; entry in the register; Head of Capital Markets informed |
| 1 business day | Desk | Written information to the client: cause, new expected date; their cash or securities remain earmarked for the transaction |
| 2 business days | Chief Executive Officer | Fail referred to the risk committee (PC-POL-RIS-001, Article 15); incident report |
| Beyond that, according to market rules | Chief Executive Officer | Initiation or monitoring of the buy-in (Article 12); decision on compensation of the client |

A fail affecting a client is always reported to them. If the delay causes them a loss (for example, a lost dividend), the Company compensates them and then seeks recovery from the party responsible.

### Article 12 — Buy-in and penalties

When the counterparty does not deliver, the Company requests or is subject to the **buy-in** provided for by the rules of the BVMAC and the central securities depository. The desk follows the transaction through to its conclusion and keeps all supporting documents.

- A penalty or compensation **received** in respect of a fail that affected a client is credited to that client.
- A penalty **owed** by the Company as a result of its own error is borne by the Company and is never recharged to the client.
- Accounting records each penalty paid or received; the RCCI receives the list each month.

### Article 13 — Government securities and CIS units

For government securities, settlement takes place with the SVT: the desk checks the SVT's notice (auction or secondary market purchase) and confirms registration in the client's sub-account. For CIS units, it checks the management company's subscription or redemption notice and the corresponding payment. In both cases, the transaction moves to "settled" status only after receipt of the supporting document, and a delay is handled as a fail under Article 11.

## Title III — Securities account keeping

### Article 14 — Opening the account in the books

*Account keeper.*

A securities account is opened in the Guichet and at the central securities depository only after the file has been approved and the agreement accepted (PC-PRO-KYC-001, Article 13). The desk:

1. creates the nominee sub-account in the client's name, with its unique account number;
2. sends the opening details to the central securities depository, or to the SVT for government securities;
3. checks that the name, category and address recorded with the account keeper are identical to the file;
4. has these data checked by the second Staff Member before the first transaction.

An order may be accepted before the account is actually opened under the conditions of Article 2 of PC-CTR-004; it is transmitted only once the sub-account is open.

### Article 15 — Position keeping

The Guichet keeps, for each client, the position in each security: available quantity, blocked quantity (pledge, seizure, transaction in progress) and history of movements. Each movement bears its trade date, its settlement date, its supporting document and the author of the entry and of the validation.

A position is not corrected by deletion: an error is remedied by a reverse movement, dated and justified, validated by the second Staff Member. Positions are reconciled with the account keepers' statements in accordance with PC-PRO-SEG-001 (Articles 10 and 11).

### Article 16 — Statements and certificates

| Document | When | How |
| --- | --- | --- |
| Notice of each movement (purchase, sale, transfer, CA, fees) | No later than the business day following the movement | Guichet area |
| Statement of positions and cash | At least every quarter, within fifteen days of the end of the quarter, and on request | Guichet area; paper on request |
| Annual statement of income and tax withheld | Before 31 January of the following year | Guichet area |
| Certificate of holding (general meeting, bank, administration) | Within two business days of the request | Signed by the Chief Executive Officer or their delegate |
| Final statement | On closure of the account | Handed to the client |

These documents are free of charge (PC-CTR-004, Appendix 1). Their minimum content is set out in Appendix 4; each quarter the second Staff Member checks a sample of statements before they are made available. The client has thirty days to report an error (PC-CTR-004, Article 11); a reported error is handled as a complaint (PC-PRO-REC-001).

### Article 17 — Transfers of securities

*Account keeper.*

**Outgoing transfer.** The client requests the transfer of their securities to another intermediary using the form in Appendix 5, signed in their area or on paper. The desk checks:

- the client's identity and signature;
- that the destination account is **in the client's name**; a transfer to a third party is not an account transfer but a change of owner, accepted only on supporting documents (succession, gift recorded by deed, court decision) and after the opinion of the RCCI;
- that the securities are not blocked, pledged or committed to a transaction in progress or a pending CA.

The second Staff Member checks the request before the instruction. The transfer is instructed within **five business days** of receipt of a complete request, subject to the time limits of the central securities depository. The desk sends the receiving intermediary the cost price of the securities, if known. The transfer is free of charge.

**Incoming transfer.** The desk checks that the account of origin is in the client's name, reconciles the quantities received with the request, records the cost price provided and notifies the client. An incoming transfer from a third party is submitted to the RCCI before being credited (PC-POL-LBC-001).

### Article 18 — Pledges, blocks and seizures

**Pledge.** A security is pledged only under a written agreement signed by the client and the creditor. The desk records the securities as a blocked position, issues the pledge certificate, and releases them only on written release by the creditor or a court decision. The Chief Executive Officer signs the certificate and the release.

**Seizure and court decision.** A seizure order or court decision is passed on the same day to the Chief Executive Officer and the RCCI. The desk blocks the securities concerned as soon as it is received. The reply to the bailiff or authority is given within the legal time limit, after obtaining the opinion of legal counsel where necessary.

**Asset freezing.** A freezing measure or a request from ANIF is handled by the RCCI in accordance with the AML/CFT Policy; the client is not informed where the law prohibits it.

**Death.** As soon as it is informed of a death, the desk blocks the account; the position is kept until instructions are received from duly evidenced heirs (PC-CTR-004, Article 9). CAs not requiring a choice continue to be credited to the account.

Every block is recorded in the Guichet with its reason, date, supporting document and the person who decided it.

### Article 19 — Inactive accounts

An account is **inactive** when the client has made no transaction and had no contact for **two years**. The desk:

- writes to the client, by all known means, to inform them of the situation of their account;
- checks whether the know-your-customer file must be updated (PC-PRO-KYC-001, Article 15);
- continues to keep the account, credit CAs and make statements available.

The securities in an inactive account are never sold off automatically and do not bear any additional fees. The list of inactive accounts is sent to the RCCI each year.

### Article 20 — Closure of the account

At the client's request, or on the Company's initiative under the conditions of the agreement (PC-CTR-004, Article 10), closure follows Article 18 of PC-PRO-KYC-001. Before closing, the desk checks that no transaction, CA or block is in progress, and that any custody fees are calculated pro rata. The sub-account is closed with the account keeper once the position is zero; the second Staff Member checks the closure.

## Title IV — Corporate actions

### Article 21 — Monitoring and preparation

Every business day, the desk records CA announcements: BVMAC notices, communications from the central securities depository, issuer publications, the payment calendar of the Treasury and the SVTs. For each CA affecting at least one client, it opens a sheet (Appendix 3) stating: security, type, dates (ex-date, record date, payment date, end of election period), terms (amount, ratio, price), default option and source.

The second Staff Member checks these data against the official source. On the record date, the desk calculates each client's entitlements from the positions in the Guichet and, as account keeper, reconciles them with the entitlement statement of the central securities depository. A discrepancy blocks the credit until it is explained.

### Article 22 — Mandatory corporate actions

Dividends, coupons, redemptions, bonus allotments, splits, reverse splits and mandatory exchanges (merger) apply without instruction from the client. The desk:

- informs the clients concerned no later than the ex-date;
- credits the cash or securities **on the day the Company receives them**, never before (PC-CTR-004, Article 11);
- issues a notice stating the gross amount, the tax withheld, any fees and the net amount, or the old and new quantity.

For a reverse split or an exchange, **fractional entitlements** are handled according to the issuer's terms, generally by a cash compensation entered in the client's ledger.

### Article 23 — Voluntary corporate actions

Capital increases with preferential subscription rights, dividends payable in securities or cash, public offers, redemption options: the client chooses.

1. The desk informs each client concerned **within two business days** of the announcement, and at least five business days before the end of the period: what they can do, what it costs, the **option applied if no reply is received** and the internal deadline.
2. The **internal deadline** is set at two business days before the deadline of the central securities depository or the issuer, to allow time for the four-eyes check.
3. The client replies in their area or in signed writing. A subscription is accepted only if it is covered by available cash.
4. The desk sends the aggregate instruction, checked by the second Staff Member, and keeps the detail by client.
5. If there is no reply, the announced default option applies. The Company never sells a client's rights without their instruction, unless the issuer's default option provides for it and the client has been informed.

An instruction received after the internal deadline is processed if still possible, without guarantee; the client is warned.

### Article 24 — General meetings

Voting rights belong to the client, who exercises them personally (PC-CTR-004, Article 11). The desk makes the notice of meeting available to the client when it receives it and issues, on request, the certificate of holding required to attend the meeting. The Company never votes on behalf of a client.

### Article 25 — Tax withholding

Tax on income from movable capital is in principle withheld at source by the issuer or its paying agent. The Company credits the net amount received and shows on the notice the gross amount, the rate and the amount withheld. The annual statement under Article 16 summarises the income and withholdings of the year.

Where the law places a withholding obligation on the Company, accounting calculates, declares and remits it within the legal time limits, on the basis of a statement prepared by the desk and checked by the second Staff Member. The Company does not give tax advice to its clients; it invites them to consult an adviser, in particular if they are not resident in the issuer's State.

## Title V — Primary market

### Article 26 — Centralisation of subscriptions

Clients' subscriptions are received and transmitted in accordance with Article 12 of PC-PRO-ORD-001. The corresponding funds remain earmarked in the client's cash ledger until allotment.

When the Company is **arranger or lead manager**, the Head of Capital Markets centralises subscriptions and funds in the centralisation account in accordance with the mandate agreement (PC-CTR-001, Articles 7 and 11) and the syndicate agreement (PC-CTR-003, Articles 5 and 11). The desk reconciles the funds received with the subscription statement every day; a discrepancy is handled as a reconciliation discrepancy (PC-PRO-SEG-001, Article 12).

### Article 27 — Allotment and registration of securities

1. The allotment is determined according to the rule in the information memorandum and, for a syndicate, notified to members no later than the day before settlement (PC-CTR-003, Article 12). Before notification, the RCCI checks that clients are not served after the Company or its Staff Members.
2. On the settlement date, the desk checks the registration of the allotted securities in the clients' sub-accounts at the central securities depository, then credits the positions in the Guichet and issues a contract note.
3. Unused amounts (reduced or unserved subscription, cancelled offering) become available again in the client's ledger as soon as the result is known, or are refunded within the period provided for in the syndicate agreement (PC-CTR-003, Article 14).

The second Staff Member checks, client by client, that the quantity credited matches the allotment notified.

## Title VI — Controls, incidents and continuity

### Article 28 — Reconciliations

Daily and monthly reconciliations of cash and securities are carried out in accordance with PC-PRO-SEG-001 (Articles 9 to 14). This procedure provides them with the following inputs:

- the list of transactions settled during the day and of open fails (Appendix 2);
- credits and debits relating to CAs and primary market transactions;
- settled incoming and outgoing transfers;
- blocks recorded or lifted.

A post-trade movement not yet entered in the Guichet on the day it is identified is reported as an explained discrepancy, with its regularisation date.

### Article 29 — Daily checklist and four-eyes check

Every business day, the desk completes and signs the checklist in Appendix 1. The second Staff Member checks and signs it before the start of the next business day. An unticked box without explanation is an incident.

The following tasks **always** require the four-eyes check before execution: settlement instruction, transfer of securities, CA credit, corrective movement, opening and closure of an account, recording or lifting of a block.

### Article 30 — Controls

| Level | Who | What | When |
| --- | --- | --- | --- |
| First level | Desk | Tasks of the day; checklist (Appendix 1) | Every business day |
| First level | Second Staff Member | Four-eyes check (Article 29); verification of the checklist | Every business day |
| Second level | RCCI | Fails register; penalties; CA sheets for the month; sample of contract notes and transfers | Every month |
| Second level | RCCI | Sample of statements (Appendix 4); inactive accounts and blocks; compliance with the time limits of Article 23 | Every quarter |
| Third level | Annual independent review | Effectiveness of the post-trade arrangements | Every year |

The RCCI records their controls on their control sheets and enters their recommendations in the follow-up table of the Internal Control Charter.

### Article 31 — Indicators

Each month the desk keeps the following indicators, presented by the RCCI to the risk committee: number of fails and average duration, penalties paid and received, contract notes issued late, CAs processed and errors, transfers instructed late, statements issued late.

### Article 32 — Incidents

Any error or delay is reported to the RCCI within 24 hours and handled in accordance with the incident management procedure (PC-PRO-INC-001): incorrect contract note, wrong instruction, fail beyond two business days, CA wrongly credited or not processed, client election not transmitted, wrong transfer, forgotten block. The correction in the client's favour is made without waiting for the end of the analysis.

### Article 33 — Business continuity

Monitoring settlement is an essential activity, to be resumed within **one business day** (PC-POL-PCA-001, Article 4). If the Guichet, the central securities depository or the settlement bank is unavailable, the desk applies the Business Continuity Plan (Articles 14 and 19): it follows the instructions of the infrastructure, keeps on paper or in a spreadsheet the list of transactions to be regularised and re-enters them in the Guichet as soon as it is back, with the four-eyes check.

The second Staff Member is trained in the desk's tasks and has the access needed to stand in for it.

### Article 34 — Retention

Reports from the central securities depository and account keepers, settlement instructions, registers, CA sheets, client instructions, transfer requests, certificates, statements and checklists are kept for **ten years** in accordance with the archiving procedure (PC-PRO-ARC-001).

## Title VII — Entry into force

### Article 35 — Entry into force

This procedure enters into force on the date of its approval, shown in the document control sheet. It is reviewed every year, whenever the rules of the BVMAC or the central securities depository change, and whenever the custodian changes.
