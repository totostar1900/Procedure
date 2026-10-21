"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLangue, COLS, CSS, Cfm, Confirmation, Evt, FL, Membre, MoiC, PL, PREROGS, avisDus, date, libelle, msg, telecharger } from "../../lib/admin-ui";
import { Circuits, Delais, DocC, useCircuits } from "./circuits";
import { Notifications, NT_CSS } from "./notifications";

// Paramétrage, en sections : administrateurs et prérogatives (super administrateur), circuits et délais (prérogative
// « circuits »), règles appliquées, journal complet (super administrateur). Chacun ne voit que ses sections.
const CATS: [string, string, (e: Evt) => boolean][] = [
  ["", "Tout", () => true],
  ["acces", "Accès", (e) => /^MEMBRE_/.test(e.action)],
  ["connexions", "Connexions", (e) => e.action === "CONNEXION"],
  ["visas", "Visas et lectures", (e) => e.path.startsWith("sig/")],
  ["circuits", "Circuits", (e) => e.path.startsWith("circuits/")],
  ["documents", "Documents", (e) => /^(redaction|adoptions|etats)\//.test(e.path)],
  ["lectures", "Attributions", (e) => e.path.startsWith("lectures/")],
  ["vue", "Voir comme", (e) => e.action.startsWith("VUE_")],
];

export default function Reglages({ moi, docs }: { moi: MoiC; docs: DocC[] }) {
  useLangue();
  const sb = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const [ms, setMs] = useState<Membre[]>([]);
  const [evts, setEvts] = useState<Evt[]>([]);
  const [pend, setPend] = useState<Record<string, Partial<Membre>>>({});
  const [cfm, setCfm] = useState<Cfm | null>(null);
  const [note, setNote] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [nouveau, setNouveau] = useState("");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const { cfg, charger: chargerC } = useCircuits(sb);
  const circ = moi.super || moi.prerogatives.includes("circuits");
  const noter = (tt: "ok" | "err", m: string) => setNote({ t: tt, m });
  const SECTIONS: [string, string, string][] = [
    ...(moi.super ? [["admins", "Administrateurs et prérogatives", "Super administrateur"] as [string, string, string]] : []),
    ...(circ ? [["circuits", "Circuits d'approbation", "Prérogative « circuits »"], ["delais", "Délais et alertes", "Prérogative « circuits »"]] as [string, string, string][] : []),
    ...(moi.super ? [["notifications", "Avis par e-mail", "Super administrateur"] as [string, string, string]] : []),
    ["regles", "Règles appliquées", "Pour mémoire"],
    ...(moi.super ? [["journal", "Journal complet", "Super administrateur"] as [string, string, string]] : []),
  ];
  const [actif, setActif] = useState(SECTIONS[0][0]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActif(e.target.id.slice(2)); }), { rootMargin: "-10% 0px -70% 0px" });
    document.querySelectorAll(".zone").forEach((z) => io.observe(z));
    const h = location.hash.slice(1); if (h) setTimeout(() => document.getElementById("z-" + h)?.scrollIntoView(), 50);
    return () => io.disconnect();
  }, []);
  const tete = (id: string) => { const x = SECTIONS.find((z) => z[0] === id)!; return <header><h2>{x[1]}</h2><span className={"scope" + (x[2] === "Super administrateur" ? " super" : "")}>{x[2]}</span></header>; };

  const charger = useCallback(async () => {
    const [a, b] = await Promise.all([
      sb.from("membres").select(COLS).order("nom", { nullsFirst: false }),
      moi.super ? sb.from("journal").select("id,le,par_email,action,path,data").order("le", { ascending: false }).limit(1000) : Promise.resolve({ data: [], error: null }),
    ]);
    if (a.error) setNote({ t: "err", m: msg(a.error) }); else setMs(a.data as Membre[]);
    if (!b.error) setEvts(b.data as Evt[]);
  }, [sb, moi.super]);
  useEffect(() => { charger(); }, [charger]);

  const vue = ms.map((m) => ({ ...m, ...(pend[m.email] || {}) }));
  const supers = vue.filter((m) => m.super);
  const admins = vue.filter((m) => m.admin && !m.super);
  const candidats = ms.filter((m) => m.actif && !m.admin);
  const maj = (email: string, part: Partial<Membre>) => setPend({ ...pend, [email]: { ...(pend[email] || {}), ...part } });
  const basc = (m: Membre, p: string) => maj(m.email, { prerogatives: m.prerogatives.includes(p) ? m.prerogatives.filter((x) => x !== p) : [...m.prerogatives, p] });
  function points() {
    return Object.entries(pend).map(([email, p]) => {
      const m = ms.find((x) => x.email === email)!; const qui = m.nom || m.email;
      if (p.admin === false) return qui + " : droits d'administration retirés";
      const pr = p.prerogatives || m.prerogatives;
      const plus = pr.filter((x) => !m.prerogatives.includes(x)), moins = m.prerogatives.filter((x) => !pr.includes(x));
      return qui + " : " + (p.admin && !m.admin ? "nommé(e) administrateur ; " : "") + [plus.length ? "donne " + plus.map((x) => PL[x]).join(", ") : "", moins.length ? "retire " + moins.map((x) => PL[x]).join(", ") : ""].filter(Boolean).join(" ; ") || qui + " : aucune prérogative";
    });
  }
  async function enregistrer() {
    for (const [email, p] of Object.entries(pend)) { const { error } = await sb.from("membres").update(p).eq("email", email); if (error) { setNote({ t: "err", m: msg(error) }); charger(); return; } }
    setPend({}); setNote({ t: "ok", m: "Administrateurs et prérogatives enregistrés." }); charger(); avisDus();
  }
  const journal = evts.filter((e) => (CATS.find((c) => c[0] === cat) || CATS[0])[2](e) && (!q || (libelle(e) + " " + e.path).toLowerCase().includes(q.toLowerCase())));
  const exporter = () => telecharger("journal_" + new Date().toISOString().slice(0, 10) + ".csv", [["Date", "Par", "Action", "Objet", "Détail"], ...journal.map((e) => [e.le, e.par_email || "système", e.action, e.path, libelle(e)])]);

  return (
    <div className="pg">
      <style>{CSS + PZ + NT_CSS}</style>
      <main className="wrap view">
        <div className="eyebrow">Administration</div>
        <h1 className="title">Paramétrage</h1>
        <p className="lead">Les réglages du référentiel, regroupés par thème. Chaque section indique qui peut la modifier ; un administrateur ne voit que les sections couvertes par ses prérogatives.</p>
        {note ? <p role="status" className={note.t === "ok" ? "ok" : "err"}>{note.m}</p> : null}
        {Object.keys(pend).length ? <div className="pending-bar"><span>{Object.keys(pend).length} modification(s) non enregistrée(s)</span><button type="button" className="btn primary" onClick={() => setCfm({ titre: "Enregistrer les administrateurs", points: points(), phrase: "enregistrer les prérogatives", bouton: "Enregistrer", ok: enregistrer })}>Vérifier et enregistrer…</button><button type="button" className="btn ghost-l" onClick={() => setPend({})}>Annuler</button></div> : null}
        {cfm ? <Confirmation c={cfm} fermer={() => setCfm(null)} /> : null}

        <div className="pz">
        <nav className="toc" aria-label="Sections">{SECTIONS.map(([id, l, w]) => <a key={id} href={"#" + id} className={actif === id ? "on" : ""} onClick={(e) => { e.preventDefault(); document.getElementById("z-" + id)?.scrollIntoView({ behavior: "smooth" }); history.replaceState(null, "", "#" + id); }}>{l}<span>{w}</span></a>)}</nav>
        <div className="zones">
        {moi.super ? <section className="zone" id="z-admins">
          {tete("admins")}
          <p className="zp">Qui administre le référentiel et avec quelles prérogatives. Les administrateurs gèrent à leur tour les autres membres dans la page Membres, sans pouvoir dépasser ce que vous leur donnez ici.</p>
          <div className="tbl"><table>
            <thead><tr><th>Administrateur</th>{PREROGS.map(([c, l, d]) => <th key={c} title={d} style={{ textAlign: "center" }}>{l}</th>)}<th></th></tr></thead>
            <tbody>
              {supers.map((m) => <tr key={m.email}><td><div className="nom">{m.nom || m.email}<span className="tag navy">super admin</span>{m.email === moi.email ? <span className="tag">vous</span> : null}</div><div className="mail">{m.email}</div></td>{PREROGS.map(([c]) => <td key={c} style={{ textAlign: "center" }}>✓</td>)}<td></td></tr>)}
              {admins.map((m) => <tr key={m.email} className={pend[m.email] ? "edited" : ""}><td><div className="nom">{m.nom || m.email}{!m.actif ? <span className="tag">suspendu</span> : null}</div><div className="mail">{m.email}{m.fonctions.length ? " · " + m.fonctions.map((c) => FL[c]).join(", ") : ""}</div></td>
                {PREROGS.map(([c, l]) => <td key={c} style={{ textAlign: "center" }}><input type="checkbox" aria-label={l + " — " + m.email} checked={m.prerogatives.includes(c)} onChange={() => basc(m, c)} /></td>)}
                <td><button type="button" className="lnk rouge" onClick={() => maj(m.email, { admin: false, prerogatives: [] })}>Retirer</button></td></tr>)}
              {!admins.length ? <tr><td colSpan={PREROGS.length + 2} className="vide">Aucun autre administrateur.</td></tr> : null}
            </tbody>
          </table></div>
          <div className="tools" style={{ marginTop: 12 }}>
            <select className="sel" value={nouveau} onChange={(e) => setNouveau(e.target.value)} aria-label="Membre à nommer administrateur"><option value="">Nommer un administrateur parmi les membres…</option>{candidats.map((m) => <option key={m.email} value={m.email}>{(m.nom || m.email) + (m.fonctions.length ? " — " + m.fonctions.map((c) => FL[c]).join(", ") : "")}</option>)}</select>
            <button type="button" className="btn sec" disabled={!nouveau} onClick={() => { maj(nouveau, { admin: true, prerogatives: ["membres", "lectures"] }); setNouveau(""); }}>Ajouter</button>
            <span className="mail">Prérogatives proposées : gérer les membres et attribuer les documents ; ajustez-les dans le tableau.</span>
          </div>
        </section> : null}

        {circ ? <section className="zone" id="z-circuits">
          {tete("circuits")}
          <p className="zp">Les étapes de visa par type de document. Un nouveau circuit s&apos;applique aux versions dont le circuit n&apos;a pas commencé ; une version déjà visée garde le circuit de son premier visa. La Procédure de maîtrise documentaire doit rester cohérente avec ces circuits.</p>
          <Circuits sb={sb} docs={docs} ms={ms} moi={moi} cfg={cfg} charger={chargerC} note={noter} demander={setCfm} />
        </section> : null}

        {circ ? <section className="zone" id="z-delais">
          {tete("delais")}
          <p className="zp">Les délais de chaque étape et de la prise de connaissance, réunis sur une grille. Une étape passe « en retard » au-delà de son délai, et « bientôt en retard » au seuil choisi ; le suivi des documents et le tableau de bord s&apos;en servent.</p>
          <Delais sb={sb} docs={docs} moi={moi} cfg={cfg} charger={chargerC} note={noter} />
        </section> : null}

        {moi.super ? <section className="zone" id="z-notifications">
          {tete("notifications")}
          <p className="zp">Les avis envoyés automatiquement par e-mail depuis la boîte partagée, par Microsoft 365. Chaque type d&apos;avis et chaque fonction a son interrupteur.</p>
          <Notifications sb={sb} note={noter} />
        </section> : null}

        <section className="zone" id="z-regles">
          {tete("regles")}
          <ul className="regles">
            <li>Il reste toujours au moins un super administrateur actif. En dernier recours, l&apos;accès se rétablit depuis la console Supabase (à protéger par une double authentification).</li>
            <li>Un administrateur ne donne que les prérogatives qu&apos;il détient lui-même, et ne modifie ni un autre administrateur ni le super administrateur.</li>
            <li>Personne ne modifie son propre accès ni ne se retire d&apos;une lecture obligatoire, à l&apos;exception du super administrateur.</li>
            <li>Les administrateurs sont des salariés comme les autres : ils visent, lisent et attestent selon leurs fonctions, et la règle des quatre yeux s&apos;applique à eux.</li>
            <li>Une personne qui s&apos;est déjà connectée ne se supprime pas : elle est suspendue, ses visas restent au registre.</li>
            <li>« Voir comme » : le super administrateur peut afficher le référentiel tel qu&apos;un membre ou un profil type le voit, en lecture seule ; chaque consultation est inscrite au journal. <a href="/comme">Voir comme…</a></li>
            <li>Règle des quatre yeux : une même personne ne vise pas deux étapes d&apos;une même version ; le rédacteur ne vise pas sa version. Si le texte change, le circuit recommence.</li>
            <li>Numérotation des versions : 0.x pour un projet, 1.0 à l&apos;adoption, 1.1 pour une correction de forme (les lectures restent valables), 2.0 pour une révision de fond, soumise de nouveau au circuit et à la lecture.</li>
          </ul>
          <p className="zp" style={{ marginTop: 12 }}>Ailleurs : <a href="/#visas">Lectures obligatoires</a> · <a href="/#circuit">Suivi des documents</a> · <a href="/#tableau">Tableau de bord</a> · <a href="/membres">Membres</a></p>
        </section>

        {moi.super ? <section className="zone" id="z-journal">
          {tete("journal")}
          <div className="listhead"><span />
            <div className="tools">
              <input type="search" placeholder="Rechercher" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher dans le journal" />
              <select className="sel" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Catégorie">{CATS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select>
              <button type="button" className="btn sec" onClick={exporter}>Exporter (CSV)</button>
            </div>
          </div>
          <ul className="journal">
            {journal.slice(0, 300).map((e) => <li key={e.id}><time>{date(e.le)}</time><span>{libelle(e)}</span></li>)}
            {!journal.length ? <li className="vide">Aucun événement.</li> : null}
          </ul>
          <p className="fine">Le journal est écrit par la base à chaque opération ; il ne peut être ni modifié ni effacé depuis le site. 1 000 dernières entrées, export de la sélection.</p>
        </section> : null}
        </div>
        </div>
      </main>
    </div>
  );
}

// Mise en page des sections : sommaire fixe à gauche, sections séparées par un filet marine
const PZ = `
.pz{display:grid;grid-template-columns:210px minmax(0,1fr);gap:32px;align-items:start}
.toc{position:sticky;top:16px;display:grid;gap:1px;border-left:1px solid var(--line)}
.toc a{display:block;padding:6px 12px;color:var(--muted);text-decoration:none;font-size:12.5px;margin-left:-1px;border-left:2px solid transparent}
.toc a span{display:block;font-size:10.5px;color:var(--muted);opacity:.85}
.toc a:hover{color:var(--navy)}.toc a.on{border-left-color:#E8A020;color:var(--navy);font-weight:600}.toc a.on span{font-weight:400}
.zone{border-top:2px solid var(--navy);padding-top:14px;margin-bottom:40px;scroll-margin-top:16px}
.zone>header{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.zone h2{font-family:var(--font-display,Georgia,serif);font-size:20px;color:var(--navy);margin:0}
.scope{font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:2px 8px;border:1px solid var(--line);color:var(--muted)}
.scope.super{border-color:#E8A020;color:#8A6413}
.zp{color:var(--muted);max-width:78ch;margin:6px 0 14px}
.zone .listhead{margin-bottom:8px}
.ctypes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.ct{border:1px solid var(--line);background:#fff;padding:14px;display:grid;gap:10px;align-content:start}
.ct header{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.ct h3{margin:0;font-size:14px;color:var(--navy)}.ct header small{display:block;color:var(--muted);font-size:11.5px}
.chain{list-style:none;margin:0;padding:0}
.chain li{display:grid;grid-template-columns:22px 1fr auto;gap:8px;align-items:baseline;padding:5px 0;border-top:1px dashed var(--line);font-size:12.5px}
.chain li:first-child{border-top:0}.chain li.opt{color:var(--muted)}
.chain .n{font-weight:700;color:#8A6413}.chain .d{color:var(--muted);font-size:11.5px;font-variant-numeric:tabular-nums}.chain li.end .n{color:#1E6B45}
.ct.edit{grid-column:1/-1;border-color:var(--navy);box-shadow:0 0 0 1px var(--navy)}
.ced{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.ced li{display:grid;grid-template-columns:22px minmax(0,1.4fr) minmax(0,1.3fr) minmax(0,1fr) 90px auto auto;gap:8px;align-items:end;padding:8px;background:#F4F7FB}
.ced .n{color:#8A6413;padding-bottom:7px}
.ced label{display:grid;gap:2px;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.ced input:not([type=checkbox]),.ced select,.lect input,.dl input{border:1px solid var(--line);background:#fff;padding:5px 7px;border-radius:2px;font:inherit;font-size:12.5px;color:inherit;min-width:0}
.ced .opts{display:grid;gap:2px;padding-bottom:2px}
.ced label.chk{display:flex;gap:5px;align-items:center;text-transform:none;letter-spacing:0;font-size:12px;color:inherit;white-space:nowrap}
.ced .mv{display:flex;gap:2px;padding-bottom:1px}.ced .mv button{border:1px solid var(--line);background:#fff;width:26px;height:28px;cursor:pointer}.ced .mv button:disabled{opacity:.4;cursor:default}
.lect{font-size:12.5px;color:var(--muted)}.lect input{width:64px;text-align:right}
.warn.liste{margin:0;padding:8px 10px 8px 26px}
table.delais{min-width:640px}table.delais td{vertical-align:top}
.dl{display:grid;gap:2px;font-size:11px;color:var(--muted)}.dl span:last-child{white-space:nowrap}.dl input{width:58px;text-align:right;font-variant-numeric:tabular-nums}
@media (max-width:900px){.pz{grid-template-columns:1fr}.toc{position:static;display:flex;flex-wrap:wrap;border-left:0;gap:4px}.toc a{border:1px solid var(--line);margin:0}.ctypes{grid-template-columns:1fr}.ced li{grid-template-columns:22px 1fr 1fr}}
`;
