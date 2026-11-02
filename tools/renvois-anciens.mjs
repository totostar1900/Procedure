// Renvois numérotés d'avant les noms d'annexes (« l'Annexe 2 », « Appendix 3 to PC-POL-RIS-001 ») → jetons [[annexe:…]].
// Sert à remettre à niveau les brouillons ouverts avant le passage aux noms (tools/appliquer.mjs).
import fs from "node:fs"; import path from "node:path"; import matter from "gray-matter";
const ALIAS = [
  [/^(Code de bonne conduite|Code de déontologie|Code of Conduct)/i, "PC-COD-001"], [/^(Règlement intérieur|Internal Rules)/i, "PC-COD-002"],
  [/^(Charte du contrôle interne|Internal Control( and Compliance)? Charter)/i, "PC-COD-003"], [/^(Charte d'organisation|Charter of Organisation)/i, "PC-COD-004"],
  [/^(Convention de mandat|Arrangement and Placement)/i, "PC-CTR-001"], [/^(Convention de prise ferme|Firm Underwriting)/i, "PC-CTR-002"], [/^(Convention de syndicat|Placement Syndicate)/i, "PC-CTR-003"],
  [/^(Convention d'ouverture|[Cc]onvention de compte-titres|Securities Account (Opening )?Agreement)/i, "PC-CTR-004"],
  [/^(Politique (de gestion )?des conflits|Conflicts of Interest)/i, "PC-POL-CI-001"], [/^(Politique de meilleure exécution|(Order )?Best Execution)/i, "PC-POL-EXE-001"],
  [/^(Politique d'externalisation|Outsourcing Policy)/i, "PC-POL-EXT-001"], [/^(Politique de formation|(Continuing )?Training)/i, "PC-POL-FOR-001"],
  [/^(Politique LBC|Politique de lutte contre le blanchiment|AML|Anti-Money)/i, "PC-POL-LBC-001"], [/^(Plan de continuité|Business Continuity)/i, "PC-POL-PCA-001"],
  [/^(Politique de rémunération|Remuneration Policy)/i, "PC-POL-REM-001"], [/^(Politique de gestion des risques|Risk Management Policy)/i, "PC-POL-RIS-001"],
  [/^(Politique de sécurité|Information Systems Security)/i, "PC-POL-SSI-001"], [/^(Politique d'engagement|Transaction Commitment)/i, "PC-POL-VAL-001"],
  [/^(Procédure d'archivage|Archiving)/i, "PC-PRO-ARC-001"], [/^(Procédure de validation des communications|Marketing Communications)/i, "PC-PRO-COM-001"],
  [/^(Manuel des procédures comptables|Accounting and Financial)/i, "PC-PRO-CPT-001"], [/^(Procédure de maîtrise documentaire|Document Control)/i, "PC-PRO-GOV-001"],
  [/^(Procédure de gestion des incidents|Incident (and Corrective|Management))/i, "PC-PRO-INC-001"], [/^(Procédure d'entrée en relation|Client Onboarding|KYC Procedure)/i, "PC-PRO-KYC-001"],
  [/^(Procédure des opérations personnelles|Personal Transactions Procedure)/i, "PC-PRO-OPP-001"], [/^(Procédure de réception|Procedure for the Reception|Reception, Transmission)/i, "PC-PRO-ORD-001"],
  [/^(Procédure post-marché|Post-trade)/i, "PC-PRO-PMR-001"], [/^(Procédure de traitement des réclamations|Complaints Handling)/i, "PC-PRO-REC-001"],
  [/^(Procédure de reporting|Regulatory Reporting)/i, "PC-PRO-REP-001"], [/^(Procédure de ségrégation|(Procedure for the )?Segregation)/i, "PC-PRO-SEG-001"],
];
const EXT = /(Règlement|Acte uniforme|[Ii]nstruction|Regulation|Uniform Act|COSUMAF|CEMAC|COBAC|BEAC|Loi|Law|Décret|Decree|OHADA|GAFI|FATF)/;
function convertir1(doc, lang, txt, fichier, map, log) {
  const Q = lang === "fr" ? (n) => "« " + n + " »" : (n) => "“" + n + "”";
  const re = lang === "fr" ? /\b([Aa]nnexes?)\s+(\d+)((?:\s*(?:,|et|à)\s*\d+)*)/g : /\b([Aa]ppendi(?:x|ces))\s+(\d+)((?:\s*(?:,|and|to)\s*\d+)*)/g;
  return txt.replace(re, (m, mot, n1, reste, off) => {
    // nombres cités
    let nums = [+n1]; const parts = (reste || "").match(/(,|et|à|and|to)\s*\d+/g) || [];
    for (const p of parts) { const v = +p.match(/\d+/)[0]; if (/^(à|to)/.test(p)) { const a = nums[nums.length - 1]; for (let x = a + 1; x <= v; x++) nums.push(x); } else nums.push(v); }
    // document visé : identifiant PC- le plus proche dans la même ligne (80 caractères), sinon le document lui-même
    const debut = txt.lastIndexOf("\n", off) + 1, fin = (txt.indexOf("\n", off) + 1 || txt.length + 1) - 1;
    const av = txt.slice(Math.max(debut, off - 90), off), ap = txt.slice(off + m.length, Math.min(fin, off + m.length + 90));
    const mAv = av.match(/(PC-[A-Z]+(?:-[A-Z]+)?-\d{3})(?!-A\d)[^;|()\n]{0,30}$/), mAp = ap.match(/^[^;|)\n]{0,45}?\(?(PC-[A-Z]+(?:-[A-Z]+)?-\d{3})(?!-A\d)/);
    let cible = doc;
    if (mAv) cible = mAv[1]; else if (mAp) cible = mAp[1];
    // « (Politique de gestion des risques, Annexe 4) » : titre du document juste avant
    else { const tAv = av.match(/(?:^|[(;|]\s*)([^(;|]{3,80}?),\s*$/); const tt = tAv ? tAv[1].trim().replace(/^.*\b(?:la|le|du|de la|of the|the)\s+(?=[A-ZÉ])/, "") : ""; const al = tt && ALIAS.find((x) => x[0].test(tt)); if (al) cible = al[1]; }
    // Document désigné par son titre juste après : « annexe 3 du Code de bonne conduite », “Appendix 1 to the Best Execution Policy”
    const tAp = ap.match(/^\s*(?:de la|du|de l'|au|à la|of the|to the|in the)\s+(.{0,80})/);
    if (tAp) {
      const t = tAp[1].replace(/^présente?\s+/i, "");
      const al = ALIAS.find((a) => a[0].test(tAp[1]));
      if (al) cible = al[1];
      else if (/^(présente?|this)\b/i.test(tAp[1])) cible = doc;
      else if (/^(politique|procédure|charte|code|manuel|convention|policy|procedure|charter|manual)\b/i.test(tAp[1])) {
        // « de la politique » : le dernier document de ce genre cité avant (200 caractères)
        const genre = tAp[1].match(/^(\w+)/)[1].toLowerCase(); const pref = { politique: "PC-POL", policy: "PC-POL", procédure: "PC-PRO", procedure: "PC-PRO", manuel: "PC-PRO", manual: "PC-PRO", charte: "PC-COD", charter: "PC-COD", code: "PC-COD", convention: "PC-CTR" }[genre];
        const prev = [...txt.slice(Math.max(0, off - 250), off).matchAll(/PC-[A-Z]+(?:-[A-Z]+)?-\d{3}/g)].map((x) => x[0]).filter((x) => x.startsWith(pref)).pop();
        if (prev) cible = prev; else log.ignore.push(`${fichier} : « ${m} » renvoie à « ${tAp[1].slice(0, 40)} » sans identifiant`);
      }
    }
    const ext = /^\s*(du|de la|de l'|au|of the|to the)\s+(Règlement|Acte|[Ii]nstruction|Regulation|Uniform|Loi|Law|Décret|Decree)/.exec(ap.slice(0, 50));
    if (ext) { log.ignore.push(`${fichier} : « ${m} » (texte externe) … ${av.slice(-50)}|${ap.slice(0, 40)}`); return m; }
    const M = map[lang][cible];
    if (!M || nums.some((n) => !M[n])) { log.ignore.push(`${fichier} : « ${m} » → ${cible} sans annexe ${nums.join(",")} … ${av.slice(-50)}|${ap.slice(0, 40)}`); return m; }
    if (cible !== doc) log.croise.push(`${fichier} : « ${m} » → ${cible} ${nums.map((n) => M[n]).join(" / ")}`); else log.propre++;
    const lst = nums.map((n) => "[[annexe:" + (cible === doc ? "" : cible + "/") + "A" + n + "]]");
    const joint = lst.length === 1 ? lst[0] : lst.slice(0, -1).join(", ") + (lang === "fr" ? " et " : " and ") + lst[lst.length - 1];
    const motN = lang === "fr" ? (nums.length > 1 ? (mot[0] === "A" ? "Annexes" : "annexes") : (mot[0] === "A" ? "Annexe" : "annexe")) : (nums.length > 1 ? (mot[0] === "A" ? "Appendices" : "appendices") : (mot[0] === "A" ? "Appendix" : "appendix"));
    return motN + " " + joint;
  });
}

// Clés existantes par document et par langue (lues dans les annexes du dépôt)
export function cartes(D) {
  const map = { fr: {}, en: {} };
  for (const id of fs.readdirSync(D)) for (const lang of ["fr", "en"]) {
    const dir = lang === "fr" ? path.join(D, id, "annexes") : path.join(D, id, "en", "annexes");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) { const m = f.match(/^A(\d+)\.md$/); if (m) (map[lang][id] ||= {})[+m[1]] = matter(fs.readFileSync(path.join(dir, f), "utf8")).data.nom || f; }
  }
  return map;
}
export function convertir(doc, lang, txt, map) {
  const log = { propre: 0, croise: [], ignore: [] };
  let t = convertir1(doc, lang, String(txt), doc, map, log);
  // « de l'Annexe [[…]] » en milieu de phrase → minuscule
  t = lang === "fr" ? t.replace(/([a-zà-ÿ]['’]|[a-zà-ÿ,] )Annexe(s?) \[\[/g, (m, p, s) => p + "annexe" + s + " [[") : t.replace(/([a-z,] )Appendi(x|ces) \[\[/g, (m, p, s) => p + "appendi" + s + " [[");
  return { texte: t, ignores: log.ignore };
}

// Empreinte de chaque document juste avant le passage aux noms (commit f7a9c9b) : un brouillon parti de ce texte
// est remis à niveau (renvois convertis, base = empreinte actuelle) au lieu d'être refusé pour conflit.
export const ANCIENNES = {"PC-COD-001":"41383c76df12831a","PC-COD-002":"b68fc9d71c325f6f","PC-COD-003":"d2a6bbadeff6e7a0","PC-COD-004":"71dc12e3c3675e35","PC-CTR-001":"c4ba24de5adf1e93","PC-CTR-002":"bc777b8521e14861","PC-CTR-003":"ba072a9b7edfae4e","PC-CTR-004":"a85da3ddbfc87d38","PC-POL-CI-001":"921060848dfcade7","PC-POL-EXE-001":"9effdac41a3f56e3","PC-POL-EXT-001":"3c767e7bea5bf49a","PC-POL-FOR-001":"f3dcd32c0cd89f90","PC-POL-LBC-001":"c67c9c16a5e0240e","PC-POL-PCA-001":"4c392cc1f955ff39","PC-POL-REM-001":"aaa3a1440d8a7471","PC-POL-RIS-001":"2be8474f875da9e2","PC-POL-SSI-001":"28238e6592daf724","PC-POL-VAL-001":"87bd8741bd899ebc","PC-PRO-ARC-001":"e8dceea2165be600","PC-PRO-COM-001":"7068264a22d6e017","PC-PRO-CPT-001":"e17cd9de1c24dbb2","PC-PRO-GOV-001":"29bad39d5d540774","PC-PRO-INC-001":"45bc0ab8f85602d5","PC-PRO-KYC-001":"c7a2e33988918a7c","PC-PRO-OPP-001":"a987cabac86812b4","PC-PRO-ORD-001":"b6a50908e33429b0","PC-PRO-PMR-001":"919caea480519c9d","PC-PRO-REC-001":"1565e4a7edf5d18e","PC-PRO-REP-001":"b11374cf549ce9cd","PC-PRO-SEG-001":"05ca274b816d8208"};
