import fs from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { supabaseServeur } from "../../lib/supabase-serveur";
import Gestion from "./gestion";
import RailClient from "./rail";

export const dynamic = "force-dynamic";
export const metadata = { title: "Membres — Référentiel Purpose Capital" };

const FL: Record<string, string> = { pca: "Président du Conseil d'Administration", adm: "Administrateur (membre du Conseil)", dg: "Directeur Général", rcci: "RCCI", dcom: "Directeur Commercial", dmc: "Directeur des Marchés de Capitaux", redac: "Rédacteur", collab: "Collaborateur" };
const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Réservée à l'administrateur ; la base le vérifie de nouveau à chaque écriture (règles RLS).
// La page reprend la feuille de style et le rail du référentiel (extraits de la page générée).
export default async function Membres() {
  const sb = await supabaseServeur();
  const { data: admin } = await sb.rpc("est_admin");
  if (!admin) redirect("/");
  const { data: { user } } = await sb.auth.getUser();
  const email = (user?.email || "").toLowerCase();
  const { data: moi } = await sb.from("membres").select("nom,fonctions").eq("email", email).maybeSingle();

  let docs: { id: string; titre: string; type: string }[] = [], css = "", rail = "";
  try {
    const html = fs.readFileSync(path.join(process.cwd(), "site", "index.html"), "utf8");
    const m = html.match(/<script type="application\/json" id="ref-data">([\s\S]*?)<\/script>/);
    if (m) docs = JSON.parse(m[1]).docs.map((d: { id: string; titre: string; type: string }) => ({ id: d.id, titre: d.titre, type: d.type }));
    css = (html.match(/<style>([\s\S]*?)<\/style>/) || ["", ""])[1];
    const a = html.indexOf('<div class="mbar">'), b = html.indexOf('<div class="shell">');
    if (a >= 0 && b > a) rail = html.slice(a, b);
  } catch { /* page du référentiel indisponible */ }
  const nom = moi?.nom || email;
  const ini = nom.split(/[\s.@]+/).filter(Boolean).slice(0, 2).map((x: string) => x[0].toUpperCase()).join("");
  const carte = `<div class="me-card" title="${esc(nom)} · ${esc(email)}"><div class="me-av">${esc(ini)}</div><div class="me-id"><b>${esc(nom)}</b><span>${esc(email)}</span></div></div>` +
    `<div class="me-more"><div class="me-roles">${(moi?.fonctions || []).map((f: string) => `<span class="me-chip">${esc(FL[f] || f)}</span>`).join("")}<span class="me-chip gold">Administrateur</span></div>` +
    `<div class="me-links"><a href="/membres">Membres</a><a href="/deconnexion">Se déconnecter</a></div></div>`;
  rail = rail
    .replace('id="nav-membres" title="Membres" hidden', 'id="nav-membres" title="Membres" aria-current="page"')
    .replace('<div class="rail-me" id="rail-me" aria-live="polite"></div>', `<div class="rail-me" id="rail-me">${carte}</div>`);
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: css + ".nav a.nav-link[aria-current=page]{color:var(--on-navy);background:rgba(255,255,255,.1)}.nav a.nav-link[aria-current=page]::before{content:\"\";position:absolute;left:-10px;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--gold)}" }} />
      <div dangerouslySetInnerHTML={{ __html: rail }} />
      <div className="shell"><Gestion moi={email} docs={docs} /></div>
      <RailClient />
    </>
  );
}
