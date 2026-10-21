import { coquille } from "../../lib/coquille";
import { supabaseServeur } from "../../lib/supabase-serveur";
import { PROFILS } from "../../lib/comme";
import RailClient from "../membres/rail";

export const dynamic = "force-dynamic";
export const metadata = { title: "Voir comme — Référentiel Purpose Capital" };
const FL: Record<string, string> = { pca: "Président du Conseil", adm: "Administrateur du Conseil", dg: "Directeur Général", rcci: "RCCI", dcom: "Directeur Commercial", dmc: "Directeur des Marchés de Capitaux", redac: "Rédacteur", collab: "Collaborateur" };

// Choix de la personne ou du profil type à afficher (super administrateur)
export default async function Comme() {
  const { css, rail } = await coquille("comme", true);
  const sb = await supabaseServeur();
  const { data } = await sb.from("membres").select("email,nom,fonctions,admin,super,acces,actif,user_id").order("nom", { nullsFirst: false });
  const ms = (data || []) as { email: string; nom: string | null; fonctions: string[]; admin: boolean; super: boolean; acces: string; actif: boolean; user_id: string | null }[];
  const lien = (c: string) => "/comme/activer?cible=" + encodeURIComponent(c);
  const st = `.cm{max-width:980px}.cm table{width:100%;border-collapse:collapse;margin:8px 0 26px}.cm th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:#5B6B80;padding:8px 10px;border-bottom:1px solid #DCE4EE;background:#F4F7FB}
.cm td{padding:9px 10px;border-bottom:1px solid #DCE4EE;font-size:13px;vertical-align:middle}.cm td small{display:block;color:#5B6B80;font-size:11.5px}.cm a.vc{display:inline-block;border:1px solid #0B2E52;color:#0B2E52;padding:5px 10px;text-decoration:none;font-size:12px;font-weight:600;border-radius:2px;white-space:nowrap}
.cm a.vc:hover{background:#0B2E52;color:#fff}.cm h2{font-family:"Playfair Display",Georgia,serif;font-size:19px;color:#0B2E52;margin:24px 0 4px}.cm .tag{font-size:10.5px;padding:1px 6px;background:#EDF1F6;color:#5B6B80;margin-left:6px}.cm .regle{background:#F4F7FB;padding:10px 12px;font-size:12.5px;color:#3E5068}
.cm .tbl{overflow-x:auto}`;
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: css + st }} />
      <div dangerouslySetInnerHTML={{ __html: rail }} />
      <div className="shell"><main className="wrap view cm">
        <div className="eyebrow">Super administrateur</div>
        <h1 className="title">Voir comme</h1>
        <p className="lead">Affichez le référentiel tel qu&apos;une personne, ou un profil type, le voit : mêmes documents, mêmes menus, mêmes actions. Lecture seule : rien ne peut être visé, attesté ni modifié. Chaque consultation est inscrite au journal.</p>
        <h2>Membres</h2>
        <div className="tbl"><table><thead><tr><th>Personne</th><th>Fonctions</th><th>Accès</th><th></th></tr></thead><tbody>
          {ms.map((m) => <tr key={m.email}><td><b>{m.nom || m.email}</b>{m.super ? <span className="tag">super administrateur</span> : m.admin ? <span className="tag">administrateur</span> : null}{!m.actif ? <span className="tag">suspendu</span> : null}<small>{m.email}{!m.user_id ? " · jamais connecté(e)" : ""}</small></td>
            <td>{(m.fonctions || []).map((f) => FL[f] || f).join(", ")}</td><td>{m.acces === "employe" ? "Employé (documents attribués)" : "Complet"}</td>
            <td style={{ textAlign: "right" }}><a className="vc" href={lien(m.email)}>Voir comme</a></td></tr>)}
        </tbody></table></div>
        <h2>Profils types</h2>
        <p className="lead" style={{ margin: "0 0 4px" }}>Pour vérifier un écran avant qu&apos;une personne occupe ce rôle. Le profil « accès employé » voit les documents demandés à tous.</p>
        <div className="tbl"><table><tbody>
          {PROFILS.map((p) => <tr key={p.cle}><td><b>{p.libelle}</b><small>{p.fonctions.map((f) => FL[f] || f).join(", ")}{p.prerogatives ? " · prérogatives : " + p.prerogatives.join(", ") : ""}</small></td><td style={{ textAlign: "right" }}><a className="vc" href={lien("profil:" + p.cle)}>Voir comme</a></td></tr>)}
        </tbody></table></div>
        <p className="regle">Les pages Membres et Paramétrage restent affichées avec vos propres droits. Pour revenir à votre vue, utilisez « Quitter » dans le bandeau en haut de la page.</p>
      </main></div>
      <RailClient />
    </>
  );
}
