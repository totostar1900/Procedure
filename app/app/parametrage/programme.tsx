"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { FONCTIONS, msg, t } from "../../lib/admin-ui";

// Programme de rédaction (prérogative « circuits ») : fonction chargée de rédiger chaque document prévu et pas encore rédigé.
// kv programme/attributions = { docs: { <ID>: <fonction> }, maj } ; sans attribution, le RCCI.
type Prevu = { id: string; titre: string; type: string; domaine?: string; priorite?: number };
const CHOIX = FONCTIONS.filter(([f]) => f !== "collab");

export function Programme({ sb, prevus, note }: { sb: SupabaseClient; prevus: Prevu[]; note: (t: "ok" | "err", m: string) => void }) {
  const [base, setBase] = useState<Record<string, string>>({});
  const [ed, setEd] = useState<Record<string, string>>({});
  const charger = useCallback(async () => {
    const { data, error } = await sb.from("kv").select("data").eq("path", "programme/attributions").maybeSingle();
    if (error) { note("err", msg(error)); return; }
    setBase(((data && (data.data as { docs?: Record<string, string> }).docs) || {}) as Record<string, string>); setEd({});
  }, [sb]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, [charger]);
  const val = (id: string) => ed[id] || base[id] || "rcci";
  const modifs = Object.keys(ed).filter((id) => ed[id] !== (base[id] || "rcci"));
  async function enregistrer() {
    const docs = { ...base }; for (const id of modifs) docs[id] = ed[id];
    const { error } = await sb.from("kv").upsert({ path: "programme/attributions", data: { docs, maj: new Date().toISOString() } }, { onConflict: "path" });
    if (error) { note("err", msg(error)); return; }
    note("ok", modifs.length + " " + t("attribution(s) enregistrée(s).")); charger();
  }
  if (!prevus.length) return <p className="fine">{t("Le programme est vide : tous les documents prévus sont rédigés.")}</p>;
  const tri = [...prevus].sort((a, b) => (a.priorite || 9) - (b.priorite || 9) || a.id.localeCompare(b.id));
  return (
    <>
      <div className="tools" style={{ marginBottom: 10 }}>
        <button type="button" className="btn primary" disabled={!modifs.length} onClick={enregistrer}>{t("Enregistrer")}{modifs.length ? " (" + modifs.length + ")" : ""}</button>
        {modifs.length ? <button type="button" className="btn sec" onClick={() => setEd({})}>{t("Annuler")}</button> : null}
      </div>
      <div className="tbl"><table>
        <thead><tr><th>{t("Document")}</th><th>{t("Priorité")}</th><th>{t("Fonction chargée de la rédaction")}</th></tr></thead>
        <tbody>{tri.map((p) => (
          <tr key={p.id} className={modifs.includes(p.id) ? "edited" : ""}>
            <td><b>{p.id}</b><div className="fine">{p.titre} · {t(p.type)}</div></td>
            <td className="num">{p.priorite || "—"}</td>
            <td><select value={val(p.id)} onChange={(e) => setEd({ ...ed, [p.id]: e.target.value })} aria-label={p.id}>{CHOIX.map(([f, l]) => <option key={f} value={f}>{t(l)}</option>)}</select></td>
          </tr>))}
        </tbody>
      </table></div>
    </>
  );
}
