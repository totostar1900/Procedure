# English version of the repository — translation brief

The English version is a **courtesy translation**. The French text prevails. Translate into clear, formal **British English** used in financial regulation (FCA/ESMA style), faithful to the French meaning, without adding or removing obligations. Keep it readable by non-lawyers, as the French is.

## Files

For a document `content/documents/<ID>/`:

| French source | English file to write |
|---|---|
| `document.md` | `en/document.md` |
| `annexes/A1.md` … | `en/annexes/A1.md` … (same file names) |
| `variables.yaml` (contract templates only) | `en/variables.yaml` |

Never modify the French files.

### `en/document.md` front matter — only these keys, in this order

```yaml
---
titre: "<English title>"
resume: "<English summary>"
diffusion: "<English distribution list>"
references:            # same entries, same order, same `ref` codes as the French file
  - ref: REG-01-22
    articles: "<English>"
historique:            # same entries, same order; copy version and date unchanged
  - version: "0.9"
    date: 2026-10-20
    objet: "<English>"
    par: "<English role title>"
notes_redaction:       # only if the French file has notes_redaction; same order
  - "<English>"
---
```

Quote every YAML string value with double quotes (escape inner double quotes as \"). Dates stay unquoted ISO dates. `version` stays a quoted string.

### `en/annexes/Ax.md` front matter

Keep `id` unchanged; translate `titre`, `nature`, `renseigne_par`, `conserve_par`, `frequence` (keep any key the French has, translate its value). Quote all values.

### `en/variables.yaml` (contract templates PC-CTR-*)

Same structure, same `id`, `valeur`, `type`, `requis`, `si`, `defaut`, anchors (`&pays`, `*pays`) and keys. Translate only human text: `titre`, `aide`, `label`, `texte`, `vide`, and comments. Keep the `intitule` placeholders unchanged. The `texte` of an option is what is inserted in the contract: translate it as it should read in an English contract.

## Body — strict rules

1. **Structure is identical**: same number and order of headings, paragraphs, lists, tables, HTML blocks.
   - `## Titre IV — Conflits d'intérêts` → `## Title IV — Conflicts of interest`
   - `### Article 12 — Objet` → `### Article 12 — Purpose`
   - Roman and Arabic numbers unchanged.
2. **Placeholders and code are untouchable**: everything inside `{{ … }}`, `{% … %}`, HTML tags and attributes (`<div class="form-grid">`, `data-…`), image paths, link URLs, anchors. Translate only visible text between tags.
3. Markdown tables: same columns and rows; translate cell text.
4. Cross-references: "l'article 12" → "Article 12"; "le présent Code" → "this Code"; "l'annexe 2" → "Appendix 2".
5. Names of laws and texts: give the English name, keep the official reference (e.g. "Règlement n° 01/22/CEMAC/UMAC/CM/COSUMAF" stays as is; "Règlement général de la COSUMAF" → "COSUMAF General Regulation").
6. Amounts: "50 000 FCFA" → "FCFA 50,000" (thousands separated by commas). Percentages "15 %" → "15%". Dates "21 juillet 2022" → "21 July 2022".
7. Forms (signature blocks, "Je soussigné(e)") → natural English form wording ("I, the undersigned, …").
8. Do not translate: Purpose Capital S.A., COSUMAF, BVMAC, BEAC, COBAC, CEMAC, UMAC, GABAC, ANIF, OHADA, AUSCGIE, CRCA, document IDs (PC-…), acronyms defined in the text (after first use give the English expansion in brackets if helpful).

## Mandatory terminology (use consistently)

| French | English |
|---|---|
| la Société | the Company |
| Collaborateur(s) (defined term) | Staff Member(s) |
| Conseil d'Administration | Board of Directors (the Board) |
| Président du Conseil d'Administration | Chairman of the Board of Directors |
| administrateur (membre du Conseil) | director |
| administrateur indépendant | independent director |
| Directeur Général / Directeur Général Adjoint | Chief Executive Officer / Deputy Chief Executive Officer |
| dirigeant effectif | senior manager (dirigeant effectif) |
| RCCI — Responsable de la conformité et du contrôle interne | RCCI — Head of Compliance and Internal Control (keep the acronym RCCI) |
| Directeur Commercial | Head of Sales |
| Directeur des Marchés de Capitaux | Head of Capital Markets |
| assemblée générale (extraordinaire) | (extraordinary) general meeting |
| commissaire aux comptes | statutory auditor |
| procès-verbal / séance | minutes / meeting |
| société de bourse | brokerage firm (société de bourse) |
| agrément | licence |
| carte professionnelle | professional card |
| visa (d'un document interne, signature d'approbation) | sign-off; viser → sign off |
| visa de la COSUMAF (sur un document d'information) | COSUMAF approval (visa) |
| circuit d'approbation | approval workflow |
| fiche de maîtrise documentaire | document control sheet |
| empreinte | fingerprint |
| en vigueur / abrogé | in force / repealed |
| entrée en vigueur | entry into force |
| prise de connaissance, attester sa lecture | acknowledgement, acknowledge having read |
| LBC/FT, blanchiment de capitaux, financement du terrorisme | AML/CFT, money laundering, terrorist financing |
| financement de la prolifération | proliferation financing |
| déclaration de soupçon | suspicious transaction report (STR) |
| bénéficiaire effectif | beneficial owner |
| personne politiquement exposée (PPE) | politically exposed person (PEP) |
| vigilance (simplifiée / renforcée) | (simplified / enhanced) due diligence |
| connaissance du client, entrée en relation | know your customer (KYC), client onboarding |
| gel des avoirs, sanctions financières ciblées | asset freezing, targeted financial sanctions |
| abus de marché, information privilégiée, manipulation de cours | market abuse, inside information, market manipulation |
| opérations personnelles | personal transactions |
| conflits d'intérêts | conflicts of interest |
| meilleure exécution | best execution |
| réception-transmission d'ordres | reception and transmission of orders |
| ordre, carnet d'ordres | order, order book |
| compte-titres, teneur de compte | securities account, account keeper |
| dépositaire central | central securities depository |
| règlement-livraison | settlement |
| ségrégation des avoirs, rapprochement | segregation of client assets, reconciliation |
| appel public à l'épargne | public offering |
| document d'information | information memorandum |
| émetteur, souscripteur, investisseur | issuer, subscriber, investor |
| arrangeur, chef de file, syndicat de placement | arranger, lead manager, placement syndicate |
| prise ferme, garantie de bonne fin | firm underwriting, standby underwriting commitment |
| fonds propres, normes prudentielles | own funds, prudential standards |
| contrôle permanent / périodique | ongoing / periodic control |
| cartographie des risques | risk map |
| plan de continuité d'activité (PCA) | business continuity plan (BCP) |
| externalisation, prestataire | outsourcing, service provider |
| réclamation | complaint |
| communication commerciale | marketing communication |
| rémunération variable | variable remuneration |
| sécurité des systèmes d'information | information systems security |
| archivage, durée de conservation | archiving, retention period |
| maîtrise documentaire | document control |
| Code du travail | Labour Code |
| pouvoir disciplinaire, sanction disciplinaire | disciplinary authority, disciplinary sanction |
| Titre / Article / Annexe / Préambule | Title / Article / Appendix / Preamble |
