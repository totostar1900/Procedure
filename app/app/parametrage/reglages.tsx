"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { COLS, CSS, Cfm, Confirmation, Evt, FL, Membre, MoiC, PL, PREROGS, date, libelle, msg, telecharger } from "../../lib/admin-ui";

// Paramétrage : réservé au super administrateur. Administrateurs et prérogatives, règles, journal complet.
const CATS: [string, string, (e: Evt) => boolean][] = [
  ["", "Tout", () => true],
  ["acces", "Accès", (e) => /^MEMBRE_/.test(e.action)],
  ["connexions", "Connexions", (e) => e.action === "CONNEXION"],
  ["visas", "Visas et lectures", (e) => e.path.startsWith("sig/")],
  ["circuits", "Circuits", (e) => e.path.startsWith("circuits/")],
  ["documents", "Documents", (e) => /^(redaction|adoptions|etats)\//.test(e.path)],
  ["lectures", "Attributions", (e) => e.path.startsWith("lectures/")],
];

export default function Reglages({ moi }: { moi: MoiC }) {
  const sb = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const [ms, setMs] = useState<Membre[]>([]);
  const [evts, setEvts] = useState<Evt[]>([]);
  const [pend, setPend] = useState<Record<string, Partial<Membre>>>({});
  const [cfm, setCfm] = useState<Cfm | null>(null);
  const [note, setNote] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [nouveau, setNouveau] = useState("");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");

  const charger = useCallback(async () => {
    const [a, b] = await Promise.all([
      sb.from("membres").select(COLS).order("nom", { nullsFirst: false }),
      sb.from("journal").select("id,le,par_email,action,path,data").order("le", { ascending: false }).limit(1000),
    ]);
    if (a.error) setNote({ t: "err", m: msg(a.error) }); else setMs(a.data as Membre[]);
    if (!b.error) setEvts(b.data as Evt[]);
  }, [sb]);
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
    setPend({}); setNote({ t: "ok", m: "Administrateurs et prérogatives enregistrés." }); charger();
  }
  const journal = evts.filter((e) => (CATS.find((c) => c[0] === cat) || CATS[0])[2](e) && (!q || (libelle(e) + " " + e.path).toLowerCase().includes(q.toLowerCase())));
  const exporter = () => telecharger("journal_" + new Date().toISOString().slice(0, 10) + ".csv", [["Date", "Par", "Action", "Objet", "Détail"], ...journal.map((e) => [e.le, e.par_email || "système", e.action, e.path, libelle(e)])]);

  return (
    <div className="pg">
      <style>{CSS}</style>
      <main className="wrap view">
        <div className="eyebrow">Super administrateur</div>
        <h1 className="title">Paramétrage</h1>
        <p className="lead">Qui administre le référentiel et avec quelles prérogatives. Les administrateurs gèrent à leur tour les autres membres dans la page Membres, sans pouvoir dépasser ce que vous leur donnez ici.</p>
        {note ? <p role="status" className={note.t === "ok" ? "ok" : "err"}>{note.m}</p> : null}
        {Object.keys(pend).length ? <div className="pending-bar"><span>{Object.keys(pend).length} modification(s) non enregistrée(s)</span><button type="button" className="btn primary" onClick={() => setCfm({ titre: "Enregistrer les administrateurs", points: points(), phrase: "enregistrer les prérogatives", bouton: "Enregistrer", ok: enregistrer })}>Vérifier et enregistrer…</button><button type="button" className="btn ghost-l" onClick={() => setPend({})}>Annuler</button></div> : null}
        {cfm ? <Confirmation c={cfm} fermer={() => setCfm(null)} /> : null}

        <section className="card">
          <h2>Administrateurs et prérogatives</h2>
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
        </section>

        <section className="card">
          <h2>Règles appliquées par la base</h2>
          <ul className="regles">
            <li>Il reste toujours au moins un super administrateur actif. En dernier recours, l&apos;accès se rétablit depuis la console Supabase (à protéger par une double authentification).</li>
            <li>Un administrateur ne donne que les prérogatives qu&apos;il détient lui-même, et ne modifie ni un autre administrateur ni le super administrateur.</li>
            <li>Personne ne modifie son propre accès ni ne se retire d&apos;une lecture obligatoire, à l&apos;exception du super administrateur.</li>
            <li>Les administrateurs sont des salariés comme les autres : ils visent, lisent et attestent selon leurs fonctions, et la règle des quatre yeux s&apos;applique à eux.</li>
            <li>Une personne qui s&apos;est déjà connectée ne se supprime pas : elle est suspendue, ses visas restent au registre.</li>
          </ul>
        </section>

        <section className="card">
          <h2>Paramètres du référentiel</h2>
          <ul className="regles">
            <li><a href="/#circuit">Circuits d&apos;approbation et délais</a> — étapes, fonctions, règles de visa, délais par étape et délai de prise de connaissance.</li>
            <li><a href="/#visas">Lectures obligatoires</a> — documents à lire et attester, par personne.</li>
            <li><a href="/#tableau">Tableau de bord</a> — suivi des visas, retards, lectures et modifications.</li>
            <li><a href="/membres">Membres</a> — accès, fonctions, suspensions, export des habilitations.</li>
          </ul>
        </section>

        <section className="card">
          <div className="listhead"><h2>Journal complet</h2>
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
        </section>
      </main>
    </div>
  );
}
