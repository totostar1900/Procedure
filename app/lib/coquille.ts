import fs from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { supabaseServeur } from "./supabase-serveur";

// Pages d'administration (Membres, Paramétrage) : même feuille de style et même rail que le référentiel,
// extraits de la page générée ; la carte de la personne connectée est rendue côté serveur.
export type Moi = { email: string; nom: string; super: boolean; admin: boolean; prerogatives: string[]; fonctions: string[] };
const FL: Record<string, string> = { pca: "Président du Conseil d'Administration", adm: "Administrateur (membre du Conseil)", dg: "Directeur Général", rcci: "RCCI", dcom: "Directeur Commercial", dmc: "Directeur des Marchés de Capitaux", redac: "Rédacteur", collab: "Collaborateur" };
const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Paramétrage : super administrateur, ou administrateur ayant la prérogative « circuits » (il n'y voit que ses sections)
export const accesParametrage = (m: { super?: boolean; prerogatives?: string[] | null }) => !!m.super || (m.prerogatives || []).includes("circuits");
export async function coquille(page: "membres" | "parametrage" | "comme", exigeSuper: boolean) {
  const sb = await supabaseServeur();
  const { data: { user } } = await sb.auth.getUser();
  const email = (user?.email || "").toLowerCase();
  const { data: m } = await sb.from("membres").select("nom,fonctions,admin,super,prerogatives,actif").eq("email", email).maybeSingle();
  if (!m || !m.actif || !m.admin || (exigeSuper && !m.super) || (page === "parametrage" && !accesParametrage(m))) redirect("/");
  const moi: Moi = { email, nom: m.nom || email, super: !!m.super, admin: !!m.admin, prerogatives: m.prerogatives || [], fonctions: m.fonctions || [] };

  let docs: { id: string; titre: string; type: string; circuit: { etape: string; label: string; role: string }[] }[] = [], css = "", rail = "";
  try {
    const html = fs.readFileSync(path.join(process.cwd(), "site", "index.html"), "utf8");
    const x = html.match(/<script type="application\/json" id="ref-data">([\s\S]*?)<\/script>/);
    if (x) docs = JSON.parse(x[1]).docs.map((d: { id: string; titre: string; type: string; circuit?: [] }) => ({ id: d.id, titre: d.titre, type: d.type, circuit: d.circuit || [] }));
    css = (html.match(/<style>([\s\S]*?)<\/style>/) || ["", ""])[1];
    const a = html.indexOf('<div class="mbar">'), b = html.indexOf('<div class="shell">');
    if (a >= 0 && b > a) rail = html.slice(a, b);
  } catch { /* page du référentiel indisponible */ }
  const ini = moi.nom.split(/[\s.@]+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join("");
  const carte = `<div class="me-card" title="${esc(moi.nom)} · ${esc(email)}"><div class="me-av">${esc(ini)}</div><div class="me-id"><b>${esc(moi.nom)}</b><span>${esc(email)}</span></div></div>` +
    `<div class="me-more"><div class="me-roles">${moi.fonctions.map((f) => `<span class="me-chip">${esc(FL[f] || f)}</span>`).join("")}<span class="me-chip gold">${moi.super ? "Super administrateur" : "Administrateur"}</span></div>` +
    `<div class="me-links"><a href="/deconnexion">Se déconnecter</a></div></div>`;
  rail = rail
    .replace('id="nav-membres" title="Membres" hidden', 'id="nav-membres" title="Membres"' + (page === "membres" ? ' aria-current="page"' : ""))
    .replace('id="nav-parametrage" title="Paramétrage" hidden', accesParametrage(moi) ? 'id="nav-parametrage" title="Paramétrage"' + (page === "parametrage" ? ' aria-current="page"' : "") : 'id="nav-parametrage" title="Paramétrage" hidden')
    .replace('id="nav-tableau" hidden', 'id="nav-tableau"')
    .replace('<div class="rail-me" id="rail-me" aria-live="polite"></div>', `<div class="rail-me" id="rail-me">${carte}</div>`);
  css += ".nav a.nav-link[aria-current=page]{color:var(--on-navy);background:rgba(255,255,255,.1)}.nav a.nav-link[aria-current=page]::before{content:\"\";position:absolute;left:-10px;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--gold)}";
  return { moi, docs, css, rail };
}
