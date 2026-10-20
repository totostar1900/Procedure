---
titre: "Information Systems Security Policy"
resume: "The rules that protect the information of Purpose Capital S.A. and its clients — who is responsible, how information is classified, how users log in, how workstations, email, the Guichet and online services are protected, backups, logs, and what everyone does in the event of an incident."
diffusion: "All Staff Members; directors; IT service provider"
references:
  - ref: LOI-CM-2024-017
    articles: "Security of personal data, obligations towards processors, notification of breaches"
  - ref: LOI-CM-2010-012
    articles: "Cameroonian cybersecurity framework, offences against information systems, role of ANTIC"
  - ref: RG-COSUMAF-2023
    articles: "Retention of documents and records, and COSUMAF access to them"
  - ref: ISO-27001
    articles: "International standard: information security management system and security controls (ISO 27002)"
  - ref: NIST-CSF-2
    articles: "International good practice: six functions (govern, identify, protect, detect, respond, recover)"
  - ref: ANSSI-HYGIENE
    articles: "Comparable jurisdiction: IT hygiene measures for small organisations"
  - ref: BCBS-RO
    articles: "International good practice: information security and operational resilience"
historique:
  - version: "0.9"
    date: 2026-10-20
    objet: "Formatting: adoption dates and signatures moved to the document control sheet"
    par: "RCCI"
  - version: "0.9"
    date: 2026-10-20
    objet: "Initial draft submitted to the Board of Directors"
    par: "RCCI"
notes_redaction:
  - "Replaces the minimum requirements of Article 19 of the Risk Management Policy (PC-POL-RIS-001) as soon as it is adopted."
  - "Designate the internal IT officer (Article 5). Until one is designated, the Chief Executive Officer performs that role."
  - "The Guichet already requires a second factor on the desk and keeps a chained audit log. Two items remain to be done: make review of a pull request mandatory on GitHub before any deployment to master (Article 18), and set a spending cap and a budget alert with each API provider (Anthropic, Resend, WhatsApp)."
  - "Microsoft 365 Business Standard does not include Conditional Access or Defender for Business. Check that security defaults are enabled, or consider the Business Premium licence."
  - "Check that the SPF, DKIM and DMARC records for the purposecapital.africa domain are published with GoDaddy and Netlify DNS (Article 14)."
source: 28238e6592daf724
---

## Title I — General provisions

### Article 1 — Purpose

This policy sets the rules that protect the information of Purpose Capital S.A. (the "Company") and of its clients against loss, theft, disclosure and unavailability. It states who is responsible, what everyone must do, and what the Company expects of its service providers.

It replaces the minimum requirements of Article 19 of the Risk Management Policy and applies together with the Business Continuity Plan (PC-POL-PCA-001) and the Outsourcing Policy (PC-POL-EXT-001).

### Article 2 — Why this policy matters

A brokerage firm holds its clients' most sensitive information: their identity, their accounts, their assets, their orders. A hacked mailbox is enough to divert a bank transfer; a lost computer, to expose hundreds of files. Cameroonian law on the protection of personal data requires the Company to protect such data and to report any breach.

The Company is small, almost all its tools are online and its IT is entrusted to a service provider. Security therefore rests mainly on a few simple rules applied by everyone, and on control of access accounts.

### Article 3 — Scope

The policy applies:

- to all Staff Members, senior managers, directors, interns and service providers who use the Company's tools;
- to all tools: workstations, business telephones, online email and office applications, the Guichet, the website, online banking, access to the systems of BVMAC and of the Central Securities Depository;
- wherever work is carried out: office, home or travel.

### Article 4 — Definitions

- **Information system**: all the hardware, software, online services and data used by the Company.
- **Privileged account**: an account that makes it possible to administer a service, create users or modify security settings.
- **Multi-factor authentication**: a login that requires, in addition to the password, a second element (a code from an app, a passkey).
- **Security incident**: an event that compromises or may compromise the confidentiality, integrity or availability of information or of a tool.

## Title II — Organisation

### Article 5 — Roles

| Function | Responsibilities |
| --- | --- |
| Board of Directors | Approves the policy; receives each year the review of security and incidents |
| Chief Executive Officer | Responsible for the security of the information system; allocates resources; holds, together with the Chairman of the Board, access to the emergency account |
| Internal IT officer | Staff Member designated by the Chief Executive Officer: maintains the access matrix, monitors the service provider, organises joiners and leavers, first point of contact in the event of an incident |
| IT service provider | Administers the tools in accordance with its contract and this policy; applies updates; reports incidents within 24 hours |
| RCCI | Monitors application of the policy; keeps the incident register; checks the protection of personal data |
| Staff Members | Apply the acceptable use charter in Appendix 1; report any incident or doubt without delay |

### Article 6 — Principles

1. **Need to know**: everyone accesses only the information necessary for his or her work.
2. **Least privilege**: administrative rights are reserved for those who need them, and are used from separate accounts.
3. **The Company stays in control**: it holds its main accounts and its emergency account itself, and never depends on a single service provider or a single person to access its data.
4. **Simplicity**: a rule that is understood and applied is better than a perfect rule that is ignored.

## Title III — Information

### Article 7 — Classification

| Level | Examples | Rules |
| --- | --- | --- |
| Public | Website, brochure, press releases | Free distribution after approval |
| Internal | Procedures, internal memos, schedules | Staff Members and service providers bound by a confidentiality agreement |
| Confidential | Client files, orders, positions, personal data, accounts, control reports | Access according to the matrix in Appendix 2; never via personal email; encryption for any external transmission |
| Secret | Inside information, suspicious transaction reports, passwords and keys | Named and traced access; never copied outside the designated tools |

An unmarked document is treated as **internal**. A document containing client data is always **confidential**.

### Article 8 — Where information is kept

The Company's information is stored in its tools: the Company's online storage space, business email and the Guichet. It is not kept on a lasting basis on a workstation's hard drive, on a personal USB stick or in a personal online service. Confidential paper documents are kept under lock and key.

## Title IV — Access and identities

### Article 9 — Named accounts and authentication

- Each person has a **named account**; shared accounts are prohibited, except for a shared inbox without administrative rights.
- **Multi-factor authentication is mandatory** for all accounts: email and office applications, the Guichet (desk and managers), hosting providers, online banking, domain name registrar, access to market systems.
- Passwords are at least 12 characters long, unique to each service and kept in the Company's password vault. They are never disclosed, not even to the service provider or to a senior manager.

### Article 10 — Privileged accounts and emergency account

- Administrative rights are assigned to accounts separate from day-to-day working accounts, for no more than two persons per service in addition to the service provider.
- The Company holds an **emergency** administrator **account** for its email, without a licence, attached to the provider's technical domain, protected by a physical security key, and whose use triggers an alert. Its access credentials are kept under seal, under the joint responsibility of the Chief Executive Officer and the Chairman of the Board of Directors.
- Any use of an emergency account is recorded and justified to the RCCI.

### Article 11 — Joiners, movers and leavers

Whenever someone joins, changes role or leaves, the IT officer applies the checklist in Appendix 3. When a Staff Member leaves, his or her access is **cut off the same day**, his or her equipment is returned, and the passwords and keys he or she knew are changed. A service provider's access is cut off at the end of its assignment.

### Article 12 — Access review

Every six months, the IT officer and the RCCI review the access matrix in Appendix 2: each account must correspond to a person currently present and to a need. Unnecessary accounts are deleted. The review is dated and signed.

## Title V — Workstations, email and online services

### Article 13 — Workstations and telephones

- Only **laptops supplied by the Company** process confidential data. They are encrypted, protected by a password or PIN and locked automatically after five minutes of inactivity.
- The operating system and software are **updated** automatically; a security update is installed within seven days.
- The antivirus built into the operating system is active and up to date. Software installation is reserved for the service provider or the IT officer.
- The business telephone is protected by a PIN and can be wiped remotely.
- A lost or stolen device is reported immediately: it is blocked and wiped remotely.

### Article 14 — Email

Email is the most common entry point for fraud. The Company:

- publishes the authentication records for its domain (SPF, DKIM, DMARC) to prevent messages from being sent in its name;
- filters incoming messages and flags messages from outside the Company;
- prohibits automatic forwarding of business email to a personal address.

Staff Members **do not act on any request received by email for a payment, a change of bank details or a password** without having confirmed it through another channel, using the number already on file (Client Onboarding Procedure, Article 17).

### Article 15 — Online services and service providers

Each online service used by the Company (email and office applications, hosting of the website and the Guichet, database, message sending, document repository) is entered in the outsourcing register and follows the Outsourcing Policy, in particular:

- the Company is the holder of its accounts and its data, and holds the main access rights to them;
- the location of the data is known, and any transfer of personal data outside Cameroon complies with the law;
- the available security settings are enabled: multi-factor authentication, login alerts, logging.

Technical keys (API keys, application secrets) are kept in the hosting provider's protected variables, never in code, in a message or in a document. Each API provider is subject to a spending cap and a budget alert. A key is renewed without delay when a person who had access to it leaves or if it may have been exposed, and at least once a year.

### Article 16 — Remote working

Remote working follows the rules of the Business Continuity Plan (Article 17). In particular: no public Wi-Fi network, with a preference for the telephone's shared connection; screen out of sight of third parties; no confidential document printed outside the office unless necessary.

## Title VI — Data, logs and changes

### Article 17 — Backups

Important data exists in **three copies, on two different media, one of which is offline or with a provider other than the main one**. Backups are made daily. Restoration is tested each quarter, in accordance with the Business Continuity Plan.

### Article 18 — Development and changes to the Guichet

The Guichet, developed and operated by the Company, follows the rules below:

- every change goes through a separate branch, a preview checked by a manager, and then a reviewed merge before deployment to production;
- database changes are applied and checked before deployment of the code that uses them;
- real client data is not used outside the production environment;
- rolling back to the previous version is possible at any time, and the procedure for doing so is written down;
- access to the desk requires the second factor; no user may approve his or her own proposal or change his or her own access level.

### Article 19 — Logging

Logins, administrative actions and sensitive operations are logged: email login logs, the chained audit log of the Guichet, hosting providers' histories. Logs are kept for at least one year, and for ten years where they evidence a client's order or transaction. The IT officer reviews login alerts each week. A break in the Guichet audit chain is a security incident.

## Title VII — Incidents

### Article 20 — Reporting and handling

Any Staff Member who observes or suspects an incident (a suspicious link clicked, a lost device, an account used by a third party, a fraudulent payment request, a document leak) **reports it immediately** to the IT officer and the RCCI, without trying to resolve it alone or erasing any traces. The incident is reported within 24 hours on the form in Appendix 4.

Handling follows Article 12 of the Business Continuity Plan: isolate, block, prevent fraud, restore, inform. An incident affecting client data is brought to the attention of the Chief Executive Officer, who decides whether to inform the clients concerned, the data protection authority under the conditions laid down by law and, if the incident is significant, COSUMAF.

### Article 21 — Lessons learned

Every significant incident is subject to a root cause analysis and an action plan, followed up by the RCCI in accordance with the Internal Control and Compliance Charter.

## Title VIII — Awareness, control and final provisions

### Article 22 — Awareness

Each Staff Member signs the acceptable use charter in Appendix 1 on joining. Awareness training on fraud and phishing is provided each year and whenever a new form of fraud is observed; it may include a simulated phishing exercise.

### Article 23 — Control

The RCCI checks application of the policy in accordance with the annual control plan, in particular the six-monthly access review, restoration tests, the minimum measures in Appendix 5 and the follow-up of incidents. The annual independent review also covers information systems security.

### Article 24 — Breaches

Failure to comply with this policy may lead to disciplinary sanctions, in accordance with the Code of Conduct and the internal rules, without prejudice to any prosecution provided for by law in the event of an offence against an information system.

### Article 25 — Review and entry into force

The policy is reviewed at least once a year and after any significant incident or major change of tool. Any amendment is approved by the Board of Directors.

This policy enters into force on the date of its adoption by the Board of Directors, as indicated in the document control sheet.
