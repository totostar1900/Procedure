"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { date, msg, t } from "../../lib/admin-ui";
import { CATEGORIES, FONCTIONS_N, Reglages, lireReglages } from "../../lib/notifier-commun";

// Avis par e-mail (super administrateur) : interrupteur général, mode test, un interrupteur par type d'avis et par
// fonction, escalade, état de la configuration Microsoft 365, e-mail d'essai et journal des envois.
type Envoi = { id: number; cree_le: string; categorie: string; a: string[]; sujet: string; statut: string; erreur: string | null };
const Inter = ({ on, set, label, id }: { on: boolean; set: (v: boolean) => void; label: string; id: string }) => (
  <button type="button" id={id} role="switch" aria-checked={on} aria-label={label} className={"inter" + (on ? " on" : "")} onClick={() => set(!on)}><span /></button>
);

export function Notifications({ sb, note }: { sb: SupabaseClient; note: (t: "ok" | "err", m: string) => void }) {
  const [ref, setRef] = useState<Reglages>(lireReglages(null));
  const [r, setR] = useState<Reglages>(lireReglages(null));
  const [vars, setVars] = useState<Record<string, boolean> | null>(null);
  const [envois, setEnvois] = useState<Envoi[]>([]);
  const [occupe, setOccupe] = useState("");
  const charger = useCallback(async () => {
    const [a, b] = await Promise.all([
      sb.from("kv").select("data").eq("path", "notifications/reglages").maybeSingle(),
      sb.from("notifications").select("id,cree_le,categorie,a,sujet,statut,erreur").order("cree_le", { ascending: false }).limit(60),
    ]);
    const x = lireReglages(a.data && (a.data.data as Partial<Reglages>)); setRef(x); setR(x);
    if (!b.error) setEnvois(b.data as Envoi[]);
    try { const e = await fetch("/api/notifier/etat").then((z) => z.json()); setVars(e.variables || null); } catch { setVars(null); }
  }, [sb]);
  useEffect(() => { charger(); }, [charger]);

  const pret = !!vars && Object.values(vars).every(Boolean);
  const change = JSON.stringify(r) !== JSON.stringify(ref);
  async function enregistrer() {
    const x = { ...r, escalade_jours: Math.max(1, Math.min(30, Number(r.escalade_jours) || 3)) };
    // À l'activation (ou à la sortie du mode test), ce qui précède n'est pas envoyé : seuls les rappels le reprennent
    if ((x.actif && !ref.actif) || (!x.test && ref.test)) x.actif_depuis = new Date().toISOString();
    const { error } = await sb.from("kv").upsert({ path: "notifications/reglages", data: x });
    if (error) note("err", msg(error)); else { note("ok", "Réglages des avis enregistrés."); charger(); }
  }
  async function action(quoi: "essai" | "maintenant") {
    setOccupe(quoi);
    try {
      const j = await fetch("/api/notifier/essai" + (quoi === "maintenant" ? "?quoi=maintenant" : ""), { method: "POST" }).then((z) => z.json());
      if (!j.ok) note("err", j.erreur || j.raison || "Échec.");
      else note("ok", quoi === "essai" ? "E-mail d'essai envoyé à " + r.boite + "." : j.raison ? String(j.raison) : (j.envoyes || 0) + " e-mail(s) envoyé(s)" + (j.erreurs ? ", " + j.erreurs + " en erreur" : "") + ".");
    } catch { note("err", "Le site n'a pas répondu."); }
    setOccupe(""); charger();
  }
  const basc = (k: "types" | "fonctions", c: string, v: boolean) => setR({ ...r, [k]: { ...r[k], [c]: v } });
  const etiquette = (s: string) => s === "envoye" ? <span className="tag vert">{t("envoyé")}</span> : s === "erreur" ? <span className="tag rouge">{t("erreur")}</span> : <span className="tag">{t(s)}</span>;

  return (
    <>
      <div className={"etat-cfg" + (pret ? " ok" : "")}>
        <b>{pret ? t("Microsoft 365 est configuré : les envois sont possibles.") : t("Microsoft 365 n'est pas encore configuré : aucun e-mail ne part.")}</b>
        {vars ? <ul>{Object.entries(vars).map(([k, v]) => <li key={k}><code>{k}</code> {v ? "✓" : "— " + t("à renseigner dans Vercel")}</li>)}</ul> : null}
        {!pret ? <details><summary>{t("Marche à suivre")}</summary><ol>
          <li>{t("Entra ID (portail Azure) › Inscriptions d'applications › Nouvelle inscription : « Référentiel — envoi d'avis », locataire unique.")}</li>
          <li>{t("Autorisations d'API › Microsoft Graph › Autorisations d'application › Mail.Send, puis « Accorder le consentement administrateur ».")}</li>
          <li>{t("Limiter l'application à la seule boîte referentiel@ (Exchange Online PowerShell, stratégie d'accès des applications ou RBAC pour les applications).")}</li>
          <li>{t("Certificats et secrets › Nouveau secret client (24 mois au plus ; noter la date d'expiration).")}</li>
          <li>{t("Vercel › projet « procedure » › Settings › Environment Variables : M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET et SUPABASE_SERVICE_ROLE_KEY (Supabase › Project Settings › API), puis redéployer.")}</li>
          <li>{t("Revenir ici : envoyer un e-mail d'essai, activer les envois en mode test, vérifier la boîte partagée, puis sortir du mode test.")}</li>
        </ol></details> : null}
      </div>

      <div className="nt-main">
        <div className="nt-ligne"><Inter id="nt-actif" on={r.actif} set={(v) => setR({ ...r, actif: v })} label="Envois automatiques" /><div><b>{t("Envois automatiques")}</b><span>{t("Interrupteur général. Éteint, aucun avis ne part.")}</span></div></div>
        <div className="nt-ligne"><Inter id="nt-test" on={r.test} set={(v) => setR({ ...r, test: v })} label="Mode test" /><div><b>{t("Mode test")}</b><span>{t("Tous les avis partent vers la boîte partagée, avec le destinataire prévu en tête. À utiliser avant la mise en service.")}</span></div></div>
        <label className="nt-boite">{t("Boîte partagée (expéditeur, copies et résumé)")}<input id="nt-boite" type="email" value={r.boite} onChange={(e) => setR({ ...r, boite: e.target.value.trim() })} /></label>
      </div>

      <h3 className="nt-h">{t("Avis")}</h3>
      <div className="tbl"><table className="nt-tab">
        <thead><tr><th>{t("Avis")}</th><th>{t("Destinataires")}</th><th>{t("Moment")}</th><th style={{ textAlign: "center" }}>{t("Envoi")}</th></tr></thead>
        <tbody>{CATEGORIES.map(([c, l, d, m]) => <tr key={c} className={r.types[c] ? "" : "off"}><td><b>{l}</b></td><td>{d}</td><td>{m}</td><td style={{ textAlign: "center" }}><Inter id={"nt-t-" + c} on={r.types[c] !== false} set={(v) => basc("types", c, v)} label={l} /></td></tr>)}</tbody>
      </table></div>

      <h3 className="nt-h">{t("Destinataires par fonction")}</h3>
      <p className="zp">{t("Une personne reçoit les avis si au moins une de ses fonctions est allumée. La boîte partagée reçoit toujours les siens.")}</p>
      <div className="nt-fn">{FONCTIONS_N.map(([c, l]) => <label key={c} className={r.fonctions[c] !== false ? "" : "off"}><Inter id={"nt-f-" + c} on={r.fonctions[c] !== false} set={(v) => basc("fonctions", c, v)} label={l} /><span>{l}</span></label>)}</div>

      <h3 className="nt-h">{t("Escalade des retards")}</h3>
      <div className="tools">
        <label className="lect">{t("Après")} <input id="nt-esc" type="number" min={1} max={30} value={r.escalade_jours} onChange={(e) => setR({ ...r, escalade_jours: Number(e.target.value) })} /> {t("jours de retard, avis à")}</label>
        {FONCTIONS_N.filter(([c]) => ["pca", "dg", "rcci", "dmc", "dcom"].includes(c)).map(([c, l]) => <label key={c} className="chk"><input type="checkbox" checked={r.escalade_vers.includes(c)} onChange={(e) => setR({ ...r, escalade_vers: e.target.checked ? [...r.escalade_vers, c] : r.escalade_vers.filter((x) => x !== c) })} /> {l}</label>)}
        <span className="mail">{t("et à la boîte partagée ; ensuite chaque semaine.")}</span>
      </div>

      <div className="tools" style={{ marginTop: 16 }}>
        <button type="button" className="btn primary" disabled={!change} onClick={enregistrer}>{t("Enregistrer les réglages des avis")}</button>
        {change ? <button type="button" className="btn sec" onClick={() => setR(ref)}>{t("Annuler")}</button> : null}
        <button type="button" className="btn sec" disabled={!pret || !!occupe} onClick={() => action("essai")}>{occupe === "essai" ? t("Envoi…") : t("Envoyer un e-mail d'essai")}</button>
        <button type="button" className="btn sec" disabled={!pret || !!occupe || !ref.actif} onClick={() => action("maintenant")}>{occupe === "maintenant" ? t("Calcul…") : t("Calculer et envoyer maintenant")}</button>
      </div>
      <p className="fine">{t("Envois les jours ouvrés, de 7 h à 19 h (heure de Yaoundé) ; ce qui survient hors de ces heures part le matin. Un e-mail par personne, regroupant ses avis ; au plus un rappel par jour. Aucun contenu de document dans les e-mails.")}</p>

      <h3 className="nt-h">{t("Derniers envois")}</h3>
      <ul className="journal">
        {envois.map((e) => <li key={e.id}><time>{date(e.cree_le)}</time><span>{etiquette(e.statut)} <b>{e.sujet}</b> — {e.a.join(", ")}{e.erreur ? <span className="err-l"> · {e.erreur}</span> : null}</span></li>)}
        {!envois.length ? <li className="vide">{t("Aucun envoi pour le moment.")}</li> : null}
      </ul>
    </>
  );
}

export const NT_CSS = `
.etat-cfg{background:#FBF1DC;color:#6B4A0E;padding:10px 14px;margin:0 0 16px;font-size:13px}.etat-cfg.ok{background:#E5F3EA;color:#1D5B34}
.etat-cfg ul{margin:6px 0 0;padding-left:18px}.etat-cfg code{font-size:12px}.etat-cfg details{margin-top:6px}.etat-cfg summary{cursor:pointer;font-weight:600}.etat-cfg ol{margin:6px 0 0;padding-left:20px}.etat-cfg li{margin:3px 0}
.nt-main{display:grid;gap:10px;margin-bottom:8px}
.nt-ligne{display:flex;gap:12px;align-items:flex-start}.nt-ligne b{display:block}.nt-ligne span{font-size:12.5px;color:var(--muted)}
.nt-boite{display:grid;gap:3px;font-size:12px;color:var(--muted);max-width:380px}.nt-boite input{border:1px solid var(--line);padding:6px 8px;font:inherit;font-size:13px;border-radius:2px}
.nt-h{margin:22px 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.nt-tab{min-width:640px}.nt-tab tr.off td{color:var(--muted)}.nt-tab td{font-size:12.5px}
.nt-fn{display:flex;flex-wrap:wrap;gap:8px 18px}.nt-fn label{display:flex;gap:8px;align-items:center;font-size:12.5px}.nt-fn label.off{color:var(--muted)}
.inter{position:relative;width:34px;height:19px;border-radius:10px;border:0;background:#B4C2D3;cursor:pointer;flex:none;padding:0;transition:background .15s}
.inter span{position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 2px rgba(0,0,0,.25)}
.inter.on{background:#1E6B45}.inter.on span{left:17px}.inter:focus-visible{outline:2px solid #E8A020;outline-offset:2px}
.tag.vert{background:#E5F3EA;color:#1D5B34}.tag.rouge{background:#FBE6E4;color:#8A2219}.err-l{color:#8A2219}
@media (prefers-reduced-motion:reduce){.inter,.inter span{transition:none}}
`;
