"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CSS, FL, MoiC, loc, t, telecharger, useLangue } from "../../lib/admin-ui";

// Journal d'activité : présence (séances), écritures (journal de la base), consultations et téléchargements
// (table activite), avis par e-mail. Regroupé par séance de travail ; signaux en tête ; vue par objet pour les
// listes d'accès (dossiers d'opération : information privilégiée).
type Fam = "acces" | "action" | "consult" | "dl";
type Ev = { le: string; qui: string; fam: Fam; texte: string; obj?: string; objLib?: string; sens?: boolean; duree?: number; lu?: boolean | null; n?: number };
type Seance = { id: string; par_email: string; debut: string; derniere: string; actif_s: number; vue: string | null };
type Jr = { id: number; le: string; par_email: string | null; action: string; path: string; data: Record<string, unknown> };
type Ac = { id: number; le: string; par_email: string | null; seance: string | null; type: string; objet: string; version: string | null; duree_s: number | null; lu: boolean | null };
type Mb = { email: string; nom: string | null; fonctions: string[] };
const LIB: Record<Fam, string> = { acces: "Accès", action: "Actions", consult: "Consultations", dl: "Téléchargements" };
const COUL: Record<Fam, string> = { acces: "#5A3E8A", action: "#1E6B45", consult: "#0E4C86", dl: "#8A5A06" };
const SYS = "systeme";
const JOUR = 864e5;
const heureY = (iso: string) => { const d = new Date(new Date(iso).getTime() + 3600e3); return { h: d.getUTCHours() + d.getUTCMinutes() / 60, j: d.getUTCDay() }; };
const duree = (s: number) => (s < 60 ? s + " s" : s < 3600 ? Math.round(s / 60) + " min" : Math.floor(s / 3600) + " h " + String(Math.round((s % 3600) / 60)).padStart(2, "0"));

export default function Activite({ moi, docs }: { moi: MoiC; docs: { id: string; titre: string; type: string }[] }) {
  useLangue();
  const sb = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const [jours, setJours] = useState(7);
  const [brut, setBrut] = useState<{ s: Seance[]; j: Jr[]; a: Ac[]; n: { cree_le: string; a: string[]; sujet: string; statut: string }[]; m: Mb[]; dos: Record<string, string>; contrib: Record<string, Set<string>> } | null>(null);
  const [err, setErr] = useState("");
  const [onglet, setOnglet] = useState<"jour" | "objet" | "chrono">("jour");
  const [fam, setFam] = useState<Record<Fam, boolean>>({ acces: true, action: true, consult: true, dl: true });
  const [q, setQ] = useState("");
  const [qui, setQui] = useState("");
  const [ouv, setOuv] = useState<Record<string, boolean>>({});
  const [objSel, setObjSel] = useState("");
  const [maintenant, setMaintenant] = useState(Date.now());

  useEffect(() => { const u = new URLSearchParams(location.search).get("qui"); if (u) setQui(u.toLowerCase()); }, []);
  const charger = useCallback(async () => {
    const depuis = new Date(Date.now() - jours * JOUR).toISOString();
    const [s, j, a, n, m, d, c] = await Promise.all([
      sb.from("seances").select("id,par_email,debut,derniere,actif_s,vue").gte("derniere", depuis).order("debut", { ascending: false }).limit(3000),
      sb.from("journal").select("id,le,par_email,action,path,data").gte("le", depuis).order("le", { ascending: false }).limit(8000),
      sb.from("activite").select("id,le,par_email,seance,type,objet,version,duree_s,lu").gte("le", depuis).order("le", { ascending: false }).limit(8000),
      moi.super ? sb.from("notifications").select("cree_le,a,sujet,statut").gte("cree_le", depuis).limit(3000) : Promise.resolve({ data: [], error: null }),
      sb.from("membres").select("email,nom,fonctions"),
      sb.from("kv").select("path,data").like("path", "dossiers/%"),
      sb.from("journal").select("path,par_email").like("path", "dossiers/%").limit(20000),
    ]);
    const e = s.error || j.error || a.error || m.error; if (e) { setErr(e.message); return; }
    const dos: Record<string, string> = {}; (d.data || []).forEach((r: { path: string; data: { titre?: string } }) => { dos[r.path.slice(9)] = (r.data && r.data.titre) || "Sans titre"; });
    const contrib: Record<string, Set<string>> = {}; (c.data || []).forEach((r: { path: string; par_email: string | null }) => { const k = r.path.slice(9); (contrib[k] = contrib[k] || new Set()).add(String(r.par_email || "").toLowerCase()); });
    setBrut({ s: (s.data || []) as Seance[], j: (j.data || []) as Jr[], a: (a.data || []) as Ac[], n: (n.data || []) as { cree_le: string; a: string[]; sujet: string; statut: string }[], m: (m.data || []) as Mb[], dos, contrib });
    setMaintenant(Date.now());
  }, [sb, jours, moi.super]);
  useEffect(() => { charger(); const i = setInterval(charger, 60000); return () => clearInterval(i); }, [charger]);

  const titreDoc = (id: string) => { const d = docs.find((x) => x.id === id); return d ? d.titre : ""; };
  const nomDe = useCallback((email: string) => { if (email === SYS) return t("Système (publication et avis automatiques)"); const m = brut?.m.find((x) => x.email === email); return m ? m.nom || m.email : email; }, [brut]);
  const fnDe = (email: string) => { const m = brut?.m.find((x) => x.email === email); return m ? (m.fonctions || []).map((f) => t(FL[f] || f)).join(", ") : ""; };

  // Événements unifiés
  const evs = useMemo<Ev[]>(() => {
    if (!brut) return [];
    const out: Ev[] = [];
    const lien = (id: string) => id + (titreDoc(id) ? " — " + titreDoc(id) : "");
    for (const j of brut.j) {
      const who = String(j.par_email || SYS).toLowerCase(), d = j.data || {}, seg = j.path.split("/");
      const push = (fam: Fam, texte: string, obj?: string, sens?: boolean) => out.push({ le: j.le, qui: who, fam, texte, obj, sens });
      if (j.action === "CONNEXION") push("acces", t("Connexion"));
      else if (j.action === "VUE_DEBUT" || j.action === "VUE_FIN") push("acces", (j.action === "VUE_DEBUT" ? t("Voir comme : début") : t("Voir comme : fin")) + " — " + String(d.cible || "").replace(/^profil:/, t("profil type") + " "));
      else if (j.action.startsWith("MEMBRE_")) { const n = (d.nom as string) || j.path; push("acces", (j.action === "MEMBRE_INSERT" ? t("Ouvre un accès pour") : j.action === "MEMBRE_DELETE" ? t("Retire l'invitation de") : t("Modifie l'accès de")) + " " + n); }
      else if (seg[0] === "sig" && j.action === "INSERT") { const doc = String(d.doc || ""); push("action", (d.etape === "lecture" ? t("Atteste sa lecture de") : d.etape === "renvoi" ? t("Renvoie pour modification") : t("Vise")) + " " + lien(doc) + " v" + (d.version || "") + (d.etape !== "lecture" && d.etape !== "renvoi" ? " (" + t(FL[String(d.role)] || String(d.role || "")) + ")" : ""), "doc:" + doc); }
      else if (seg[0] === "redaction") { const st = String(d.statut || ""); push("action", (st === "soumis" ? t("Soumet une modification de") : st === "applique" ? t("Publication de") : st === "conflit" ? t("Publication refusée de") : j.action === "INSERT" ? t("Ouvre un brouillon de") : j.action === "DELETE" ? t("Abandonne le brouillon de") : t("Modifie le brouillon de")) + " " + lien(seg[1]) + (st === "applique" && d.version ? " v" + d.version : ""), "doc:" + seg[1]); }
      else if (seg[0] === "adoptions" && d.statut === "adopte") push("action", lien(seg[1].split("~")[0]) + " " + t("adopté") + " (v" + (d.version || "") + ")", "doc:" + seg[1].split("~")[0]);
      else if (seg[0] === "etats") push("action", (j.action === "DELETE" ? t("Rétablit") : d.statut === "supprime" ? t("Supprime") : t("Abroge")) + " " + lien(seg[1]), "doc:" + seg[1]);
      else if (seg[0] === "circuits") push("action", seg[1] === "_suivi" ? t("Modifie le seuil d'alerte des délais") : (j.action === "DELETE" ? t("Rétablit le circuit") : t("Modifie le circuit")) + " « " + (d.type || seg[1]) + " »");
      else if (seg[0] === "lectures") push("action", t("Modifie les lectures obligatoires de") + " " + lien(seg[1]), "doc:" + seg[1]);
      else if (seg[0] === "dossiers") { const nom = brut.dos[seg[1]] || (d.titre as string) || seg[1]; push("action", (j.action === "INSERT" ? t("Crée le dossier") : j.action === "DELETE" ? t("Supprime le dossier") : t("Modifie le dossier")) + " « " + nom + " »", "dossier:" + seg[1], true); }
      else if (seg[0] === "notifications") push("action", t("Modifie les réglages des avis par e-mail"));
    }
    for (const a of brut.a) {
      const who = String(a.par_email || SYS).toLowerCase();
      if (a.type === "doc") out.push({ le: a.le, qui: who, fam: "consult", texte: t("Ouvre") + " " + lien(a.objet) + (a.version ? " v" + a.version : ""), obj: "doc:" + a.objet, duree: a.duree_s ?? undefined, lu: a.lu });
      else if (a.type === "dossier") out.push({ le: a.le, qui: who, fam: "consult", texte: t("Ouvre le dossier") + " « " + (brut.dos[a.objet] || a.objet) + " »", obj: "dossier:" + a.objet, sens: true, duree: a.duree_s ?? undefined });
      else if (a.type === "generation") out.push({ le: a.le, qui: who, fam: "dl", texte: t("Génère") + " " + (a.version || "") + " " + t("depuis le dossier") + " « " + (brut.dos[a.objet] || a.objet) + " »", obj: "dossier:" + a.objet, sens: true });
      else out.push({ le: a.le, qui: who, fam: "dl", texte: t("Télécharge") + " " + a.objet, n: a.version ? parseInt(a.version, 10) || 1 : 1 });
    }
    // Écritures répétées d'un même dossier (enregistrement automatique) : une seule ligne par quart d'heure
    out.sort((x, y) => (x.le < y.le ? 1 : -1));
    const vus = new Map<string, number>();
    const fin = out.filter((e) => { if (!(e.fam === "action" && e.obj && e.obj.startsWith("dossier:") && e.texte.startsWith(t("Modifie le dossier")))) return true; const k = e.qui + e.obj; const p = vus.get(k); const tm = new Date(e.le).getTime(); if (p && p - tm < 15 * 60000) return false; vus.set(k, tm); return true; });
    for (const n of brut.n) fin.push({ le: n.cree_le, qui: SYS, fam: "action", texte: t("Avis par e-mail") + (n.statut === "envoye" ? "" : " (" + t(n.statut) + ")") + " → " + n.a.join(", ") + " : " + n.sujet });
    return fin.sort((x, y) => (x.le < y.le ? 1 : -1));
  }, [brut, docs]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtre = (e: Ev) => fam[e.fam] && (!qui || e.qui === qui) && (!q || (nomDe(e.qui) + " " + e.texte).toLowerCase().includes(q.toLowerCase()));

  // Séances : événements rattachés par personne et par plage horaire ; le reste forme une séance « hors suivi » par jour
  type Carte = { cle: string; qui: string; debut: string; fin: string; actif: number; enCours: boolean; evs: Ev[]; suivi: boolean };
  const cartes = useMemo<Carte[]>(() => {
    if (!brut) return [];
    const cs: Carte[] = brut.s.map((s) => ({ cle: s.id, qui: s.par_email.toLowerCase(), debut: s.debut, fin: s.derniere, actif: s.actif_s, enCours: maintenant - new Date(s.derniere).getTime() < 3 * 60000, evs: [], suivi: true }));
    const libres: Record<string, Carte> = {};
    for (const e of evs) {
      const tm = new Date(e.le).getTime();
      const c = cs.find((x) => x.qui === e.qui && tm >= new Date(x.debut).getTime() - 120000 && tm <= new Date(x.fin).getTime() + 180000);
      if (c) { c.evs.push(e); continue; }
      const k = e.qui + "|" + e.le.slice(0, 10);
      const l = libres[k] || (libres[k] = { cle: "h-" + k, qui: e.qui, debut: e.le, fin: e.le, actif: 0, enCours: false, evs: [], suivi: false });
      l.evs.push(e); if (e.le < l.debut) l.debut = e.le; if (e.le > l.fin) l.fin = e.le;
    }
    return [...cs, ...Object.values(libres)].filter((c) => c.suivi || c.evs.length).sort((a, b) => (a.debut < b.debut ? 1 : -1));
  }, [brut, evs, maintenant]);

  // Signaux
  const signaux = useMemo(() => {
    if (!brut) return [] as { le: string; grave: boolean; texte: string; cle?: string }[];
    const out: { le: string; grave: boolean; texte: string; cle?: string }[] = [];
    const parPers: Record<string, Ev[]> = {};
    evs.filter((e) => e.fam === "dl" && !e.sens).forEach((e) => { (parPers[e.qui] = parPers[e.qui] || []).push(e); });
    for (const [p, xs] of Object.entries(parPers)) {
      const asc = [...xs].sort((a, b) => (a.le < b.le ? -1 : 1)); let i = 0, somme = 0, signale = 0;
      for (let k = 0; k < asc.length; k++) { somme += asc[k].n || 1; while (new Date(asc[k].le).getTime() - new Date(asc[i].le).getTime() > 600000) { somme -= asc[i].n || 1; i++; }
        if (somme > 20 && new Date(asc[k].le).getTime() - signale > 3600000) { signale = new Date(asc[k].le).getTime(); out.push({ le: asc[k].le, grave: true, texte: nomDe(p) + " : " + somme + " " + t("fichiers téléchargés en moins de 10 minutes") }); } }
    }
    brut.s.forEach((s) => { const h = heureY(s.debut); if (h.j === 0 || h.j === 6 || h.h < 7 || h.h >= 19) out.push({ le: s.debut, grave: false, texte: nomDe(s.par_email.toLowerCase()) + " : " + t("séance hors des heures ouvrées") + " (" + new Date(s.debut).toLocaleString(loc(), { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" }) + ")", cle: s.id }); });
    evs.filter((e) => e.fam === "consult" && e.obj?.startsWith("dossier:")).forEach((e) => { const k = e.obj!.slice(8); const c = brut.contrib[k]; if (c && c.size && !c.has(e.qui) && e.qui !== moi.email) out.push({ le: e.le, grave: true, texte: nomDe(e.qui) + " " + t("a ouvert le dossier") + " « " + (brut.dos[k] || k) + " » " + t("sans y avoir contribué") }); });
    evs.filter((e) => e.texte.startsWith(t("Voir comme : début"))).forEach((e) => out.push({ le: e.le, grave: false, texte: nomDe(e.qui) + " — " + e.texte }));
    return out.sort((a, b) => (a.le < b.le ? 1 : -1)).slice(0, 12);
  }, [brut, evs, nomDe, moi.email]);

  // En ce moment
  const presents = (brut?.s || []).filter((s) => maintenant - new Date(s.derniere).getTime() < 15 * 60000)
    .filter((s, i, a) => a.findIndex((x) => x.par_email === s.par_email) === i);
  const vueLib = (v: string | null) => { if (!v) return ""; if (v.startsWith("doc:")) { const id = v.slice(4).split("~")[0]; return t("lit") + " " + id + (titreDoc(id) ? " — " + titreDoc(id) : ""); } if (v.startsWith("dossier:")) return t("dossier") + " « " + (brut?.dos[v.slice(8)] || v.slice(8)) + " »"; return t("page") + " " + t(v.slice(5)); };

  // Par objet
  const objets = useMemo(() => {
    const m: Record<string, { cle: string; lib: string; sens: boolean; pers: Record<string, { der: string; n: number; d: number; lu: boolean; dl: number; act: number }> }> = {};
    evs.filter((e) => e.obj).forEach((e) => {
      const k = e.obj!; const id = k.split(":")[1];
      const o = m[k] || (m[k] = { cle: k, lib: k.startsWith("doc:") ? id + (titreDoc(id) ? " — " + titreDoc(id) : "") : "« " + (brut?.dos[id] || id) + " »", sens: k.startsWith("dossier:"), pers: {} });
      const p = o.pers[e.qui] || (o.pers[e.qui] = { der: e.le, n: 0, d: 0, lu: false, dl: 0, act: 0 });
      if (e.le > p.der) p.der = e.le;
      if (e.fam === "consult") { p.n++; p.d += e.duree || 0; if (e.lu) p.lu = true; } else if (e.fam === "dl") p.dl++; else p.act++;
    });
    return Object.values(m).sort((a, b) => (b.sens ? 1 : 0) - (a.sens ? 1 : 0) || Object.keys(b.pers).length - Object.keys(a.pers).length);
  }, [evs, brut]); // eslint-disable-line react-hooks/exhaustive-deps
  const objCourant = objets.find((o) => o.cle === objSel) || objets[0];

  const dt = (iso: string) => new Date(iso).toLocaleString(loc(), { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" });
  const hm = (iso: string) => new Date(iso).toLocaleTimeString(loc(), { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" });
  const jourLib = (iso: string) => new Date(iso).toLocaleDateString(loc(), { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Douala" });
  const detail = (e: Ev) => e.texte + (e.duree != null ? " · " + duree(e.duree) : "") + (e.lu ? " · " + t("lu jusqu'au bout") : "");
  const exporter = () => telecharger("activite_" + new Date().toISOString().slice(0, 10) + ".csv", [["Date", "Personne", "Famille", "Événement", "Durée (s)", "Lu jusqu'au bout"], ...evs.filter(filtre).map((e) => [e.le, nomDe(e.qui), LIB[e.fam], e.texte, e.duree != null ? String(e.duree) : "", e.lu ? "oui" : ""])]);
  const exporterObjet = () => objCourant && telecharger("acces_" + objCourant.cle.replace(":", "_") + ".csv", [["Personne", "Adresse", "Fonctions", "Dernier accès", "Ouvertures", "Durée totale (s)", "Lu jusqu'au bout", "Téléchargements", "Actions"], ...Object.entries(objCourant.pers).map(([p, v]) => [nomDe(p), p, fnDe(p), v.der, String(v.n), String(v.d), v.lu ? "oui" : "", String(v.dl), String(v.act)])]);
  const personnes = [...new Set(evs.map((e) => e.qui))].sort((a, b) => nomDe(a).localeCompare(nomDe(b)));
  const ini = (email: string) => nomDe(email).split(/[\s.@]+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join("");

  const cartesVis = cartes.map((c) => ({ ...c, vis: c.evs.filter(filtre) })).filter((c) => (!qui || c.qui === qui) && (c.vis.length || (!q && c.suivi && c.evs.length === 0 && Object.values(fam).every(Boolean))));
  let jourPrec = "";

  return (
    <div className="pg">
      <style>{CSS + AC}</style>
      <main className="wrap view">
        <div className="eyebrow">{t("Contrôle")}</div>
        <h1 className="title">{t("Activité")}</h1>
        <p className="lead">{t("Qui est connecté, qui travaille sur quoi, et qui a eu accès à quel document ou dossier. Les écritures et les consultations sont regroupées par séance de travail.")}</p>
        {err ? <p className="err">{err}</p> : null}
        {!brut ? <p className="lead">{t("Chargement…")}</p> : <>
          <h2 className="ac-h">{t("En ce moment")}</h2>
          <div className="ac-live">{presents.length ? presents.map((s) => { const actif = maintenant - new Date(s.derniere).getTime() < 3 * 60000; return <div key={s.id} className="ac-who"><div className={"ac-av" + (actif ? "" : " idle")}>{ini(s.par_email.toLowerCase())}</div><div><b>{nomDe(s.par_email.toLowerCase())}</b><span>{actif ? vueLib(s.vue) : t("inactif depuis") + " " + Math.round((maintenant - new Date(s.derniere).getTime()) / 60000) + " min"}</span></div></div>; }) : <p className="mail">{t("Personne n'est connecté en ce moment.")}</p>}</div>

          <h2 className="ac-h">{t("Signaux")} · {jours === 1 ? t("aujourd'hui") : jours + " " + t("derniers jours")}</h2>
          <div className="ac-sig">{signaux.length ? signaux.map((s, i) => <div key={i} className={"ac-s" + (s.grave ? " grave" : "")}><time>{dt(s.le)}</time><span>{s.texte}</span></div>) : <p className="mail">{t("Aucun signal sur la période.")}</p>}</div>

          <div className="ac-tabs" role="tablist">{([["jour", "Par jour et par personne"], ["objet", "Par document ou dossier"], ["chrono", "Chronologie complète"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={onglet === k} onClick={() => setOnglet(k)}>{t(l)}</button>)}</div>
          <div className="tools ac-tools">
            <input type="search" placeholder={t("Personne, document, dossier…")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("Rechercher")} />
            <select className="sel" value={jours} onChange={(e) => setJours(Number(e.target.value))} aria-label={t("Période")}><option value={1}>{t("Aujourd'hui")}</option><option value={7}>{t("7 derniers jours")}</option><option value={30}>{t("30 derniers jours")}</option><option value={90}>{t("90 derniers jours")}</option></select>
            <select className="sel" value={qui} onChange={(e) => setQui(e.target.value)} aria-label={t("Personne")}><option value="">{t("Toutes les personnes")}</option>{personnes.map((p) => <option key={p} value={p}>{nomDe(p)}</option>)}</select>
            <span className="ac-chips">{(Object.keys(LIB) as Fam[]).map((f) => <button key={f} type="button" className="ac-chip" aria-pressed={fam[f]} onClick={() => setFam({ ...fam, [f]: !fam[f] })}><i style={{ background: COUL[f] }} />{t(LIB[f])}</button>)}</span>
            <button type="button" className="btn sec" style={{ marginLeft: "auto" }} onClick={exporter}>{t("Exporter (CSV)")}</button>
          </div>

          {onglet === "jour" ? <div>
            {cartesVis.length ? cartesVis.map((c) => {
              const jl = jourLib(c.debut); const tete = jl !== jourPrec ? <h3 className="ac-day">{jl}</h3> : null; jourPrec = jl;
              const n = { action: 0, consult: 0, dl: 0 }; c.evs.forEach((e) => { if (e.fam !== "acces") n[e.fam]++; });
              const sens = c.evs.some((e) => e.sens), o = !!ouv[c.cle];
              const d0 = heureY(c.debut).h, d1 = Math.max(d0 + 0.15, heureY(c.fin).h);
              return <div key={c.cle}>{tete}<div className={"ac-sess" + (o ? " open" : "")}>
                <div className="ac-sh" role="button" tabIndex={0} aria-expanded={o} onClick={() => setOuv({ ...ouv, [c.cle]: !o })} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOuv({ ...ouv, [c.cle]: !o }); } }}>
                  <div className={"ac-av" + (c.enCours ? "" : " off")}>{ini(c.qui)}</div>
                  <div className="ac-p"><b>{nomDe(c.qui)}</b><span>{fnDe(c.qui) || (c.qui === SYS ? "" : c.qui)}</span></div>
                  <div className="ac-sum">{n.action ? <em><i style={{ background: COUL.action }} />{n.action} {t(n.action > 1 ? "actions" : "action")}</em> : null}{n.consult ? <em><i style={{ background: COUL.consult }} />{n.consult} {t(n.consult > 1 ? "ouvertures" : "ouverture")}</em> : null}{n.dl ? <em><i style={{ background: COUL.dl }} />{n.dl} {t(n.dl > 1 ? "téléchargements" : "téléchargement")}</em> : null}{sens ? <em className="ac-sens">{t("dossier sensible")}</em> : null}{!c.evs.length ? <em>{t("présence sans action")}</em> : null}</div>
                  <div className="ac-span"><b>{hm(c.debut)} – {c.enCours ? t("en cours") : hm(c.fin)}</b>{c.suivi ? duree(c.actif) + " " + t("actif") : t("hors séance suivie")}<div className="ac-bar"><i style={{ left: (d0 / 24) * 100 + "%", width: Math.max(0.8, ((d1 - d0) / 24) * 100) + "%" }} /></div></div>
                  <span className="ac-chev" aria-hidden="true">▶</span>
                </div>
                {o ? <ul className="ac-ev">{[...c.vis].reverse().map((e, i) => <li key={i}><time>{hm(e.le)}</time><span className={"ac-tag f-" + e.fam}>{t(LIB[e.fam])}</span><span>{detail(e)}{e.sens ? <b className="ac-sens"> {t("sensible")}</b> : null}</span></li>)}{!c.vis.length ? <li><span /><span /><span className="mail">{t("Aucun événement de ces familles.")}</span></li> : null}</ul> : null}
              </div></div>;
            }) : <p className="mail">{t("Aucune séance ne correspond.")}</p>}
          </div> : null}

          {onglet === "objet" ? <div className="ac-obj">
            <div className="ac-ol">{objets.map((o) => <button key={o.cle} type="button" aria-pressed={objCourant?.cle === o.cle} onClick={() => setObjSel(o.cle)}><b>{o.lib}{o.sens ? <span className="ac-sens"> {t("sensible")}</span> : null}</b><span>{Object.keys(o.pers).length} {t("personne(s)")}</span></button>)}{!objets.length ? <p className="mail" style={{ padding: 10 }}>{t("Aucun accès sur la période.")}</p> : null}</div>
            {objCourant ? <div>
              <div className="ac-oh"><div><h3>{objCourant.lib}</h3><p className="mail">{objCourant.sens ? t("Dossier d'opération : information privilégiée.") : t("Document du référentiel.")} {Object.keys(objCourant.pers).length} {t("personne(s) sur la période.")}</p></div><button type="button" className="btn sec" onClick={exporterObjet}>{objCourant.sens ? t("Exporter la liste d'accès") : t("Exporter (CSV)")}</button></div>
              <div className="tbl"><table><thead><tr><th>{t("Personne")}</th><th>{t("Dernier accès")}</th><th>{t("Ouvertures")}</th><th>{t("Durée")}</th><th>{t("Téléchargements")}</th><th>{t("Actions")}</th></tr></thead><tbody>
                {Object.entries(objCourant.pers).sort((a, b) => (a[1].der < b[1].der ? 1 : -1)).map(([p, v]) => { const hors = objCourant.sens && brut.contrib[objCourant.cle.slice(8)] && !brut.contrib[objCourant.cle.slice(8)].has(p); return <tr key={p} className={hors ? "ac-hors" : ""}><td><b>{nomDe(p)}</b><div className="mail">{fnDe(p)}{hors ? " · " + t("n'a pas contribué au dossier") : ""}</div></td><td>{dt(v.der)}</td><td>{v.n || "—"}</td><td>{v.d ? duree(v.d) : "—"}{v.lu ? " · " + t("lu") : ""}</td><td>{v.dl || "—"}</td><td>{v.act || "—"}</td></tr>; })}
              </tbody></table></div>
            </div> : null}
          </div> : null}

          {onglet === "chrono" ? <div className="tbl"><table><thead><tr><th>{t("Quand")}</th><th>{t("Qui")}</th><th>{t("Famille")}</th><th>{t("Événement")}</th></tr></thead><tbody>
            {evs.filter(filtre).slice(0, 1500).map((e, i) => <tr key={i}><td style={{ whiteSpace: "nowrap" }}>{dt(e.le)}</td><td>{nomDe(e.qui)}</td><td><span className={"ac-tag f-" + e.fam}>{t(LIB[e.fam])}</span></td><td>{detail(e)}{e.sens ? <b className="ac-sens"> {t("sensible")}</b> : null}</td></tr>)}
          </tbody></table>{evs.filter(filtre).length > 1500 ? <p className="mail">{t("1 500 premières lignes affichées ; l'export contient tout.")}</p> : null}</div> : null}

          <p className="fine" style={{ marginTop: 24 }}>{t("Non enregistré : frappes, mouvements de souris, recherches, aperçus rapides, appareil et adresse IP. Le temps actif ne compte que lorsque l'onglet est au premier plan et utilisé. Conservation : 12 mois pour les consultations et les séances ; les accès aux dossiers d'opération et les actions sont conservés.")}</p>
        </>}
      </main>
    </div>
  );
}

const AC = `
.ac-h{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:18px 0 8px;font-weight:600}
.ac-live{display:flex;gap:10px;flex-wrap:wrap}
.ac-who{display:flex;gap:9px;align-items:center;border:1px solid var(--line);background:#fff;padding:7px 12px 7px 8px}
.ac-who b{display:block;font-size:12.5px}.ac-who span{font-size:11.5px;color:var(--muted)}
.ac-av{width:30px;height:30px;border-radius:50%;background:#EEF3F9;color:var(--navy);display:grid;place-items:center;font-weight:700;font-size:11px;position:relative;flex:none}
.ac-av::after{content:"";position:absolute;right:-1px;bottom:-1px;width:9px;height:9px;border-radius:50%;background:#1E6B45;border:2px solid #fff}
.ac-av.idle::after{background:#E8A020}.ac-av.off::after{display:none}
.ac-sig{display:grid;gap:6px}
.ac-s{display:grid;grid-template-columns:170px 1fr;gap:10px;padding:7px 12px;border-left:3px solid #E8A020;background:#FBF1DC;font-size:12.5px}
.ac-s.grave{border-left-color:#9B2C1F;background:#F8E6E3}.ac-s time{font-size:11.5px;color:var(--muted)}
.ac-tabs{display:flex;gap:2px;border-bottom:1px solid #B4C2D3;margin:22px 0 12px;flex-wrap:wrap}
.ac-tabs button{border:0;background:none;padding:8px 14px;cursor:pointer;color:#3E5068;border-bottom:2px solid transparent;margin-bottom:-1px;font:inherit;font-weight:500}
.ac-tabs button[aria-selected=true]{color:var(--navy);border-bottom-color:#E8A020;font-weight:600}
.ac-tools{margin-bottom:14px}.ac-tools input[type=search]{width:230px}
.ac-chips{display:flex;gap:6px;flex-wrap:wrap}
.ac-chip{border:1px solid var(--line);background:#fff;padding:4px 10px;border-radius:12px;cursor:pointer;font:inherit;font-size:12px;display:inline-flex;gap:6px;align-items:center}
.ac-chip i{width:8px;height:8px;border-radius:50%}.ac-chip[aria-pressed=false]{opacity:.45}
.ac-day{font-family:"Playfair Display",Georgia,serif;font-size:17px;color:var(--navy);margin:18px 0 8px;text-transform:capitalize}
.ac-sess{border:1px solid var(--line);margin-bottom:8px;background:#fff}
.ac-sh{display:grid;grid-template-columns:34px minmax(0,1.1fr) minmax(0,2fr) 160px 14px;gap:12px;align-items:center;padding:9px 12px;cursor:pointer}
.ac-sh:hover{background:#F4F7FB}.ac-sh:focus-visible{outline:2px solid #E8A020;outline-offset:-2px}
.ac-p b{display:block}.ac-p span{font-size:11.5px;color:var(--muted)}
.ac-sum{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12.5px;color:#3E5068}.ac-sum em{font-style:normal;display:inline-flex;gap:5px;align-items:center}.ac-sum i{width:7px;height:7px;border-radius:50%}
.ac-span{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}.ac-span b{display:block;color:var(--ink,#0A2540);font-weight:600}
.ac-bar{position:relative;height:5px;background:#EDF1F6;margin-top:4px}.ac-bar i{position:absolute;top:0;bottom:0;background:#0E4C86}
.ac-chev{font-size:9px;color:var(--muted);transition:transform .15s}.ac-sess.open .ac-chev{transform:rotate(90deg)}
.ac-ev{list-style:none;margin:0;padding:4px 12px 10px 58px;border-top:1px solid var(--line);background:#F4F7FB}
.ac-ev li{display:grid;grid-template-columns:46px 110px minmax(0,1fr);gap:10px;padding:5px 0;border-bottom:1px dashed var(--line);font-size:12.5px;align-items:baseline}.ac-ev li:last-child{border-bottom:0}
.ac-ev time{color:var(--muted);font-size:11.5px;font-variant-numeric:tabular-nums}
.ac-tag{font-size:10.5px;font-weight:600;padding:1px 6px;border-radius:2px;white-space:nowrap;justify-self:start}
.f-acces{background:#EDF1F6;color:#5A3E8A}.f-action{background:#E4F2EA;color:#1E6B45}.f-consult{background:#E2EDF8;color:#0E4C86}.f-dl{background:#FBF1DC;color:#8A5A06}
.ac-sens{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#9B2C1F}
.ac-obj{display:grid;grid-template-columns:300px minmax(0,1fr);gap:22px;align-items:start}
.ac-ol{border:1px solid var(--line);max-height:640px;overflow:auto}
.ac-ol button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:#fff;padding:9px 12px;cursor:pointer;font:inherit}
.ac-ol button[aria-pressed=true]{background:#EEF3F9;box-shadow:inset 3px 0 #E8A020}.ac-ol b{display:block;font-size:12.5px}.ac-ol span{font-size:11px;color:var(--muted)}
.ac-oh{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px}.ac-oh h3{margin:0;font-size:15px;color:var(--navy)}
tr.ac-hors td{background:#F8E6E3}
@media (max-width:900px){.ac-sh{grid-template-columns:34px minmax(0,1fr) 14px}.ac-sum,.ac-span{grid-column:2/3}.ac-ev{padding-left:12px}.ac-ev li{grid-template-columns:44px 1fr}.ac-ev li .ac-tag{grid-column:2}.ac-obj{grid-template-columns:1fr}.ac-s{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.ac-chev{transition:none}}
`;
