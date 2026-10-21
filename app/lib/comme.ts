import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// « Voir comme » : le super administrateur affiche le référentiel tel qu'une personne (ou un profil type) le voit,
// en lecture seule. La cible est dans un cookie ; elle n'est prise en compte que si la personne connectée est
// super administrateur. Aucune écriture n'est possible (shim) et chaque début et fin est journalisé.
export const COOKIE = "pc-ref-comme";
export type Cible = { id: string; email: string; nom: string; fonctions: string[]; admin: boolean; super: boolean; prerogatives: string[]; acces: "complet" | "employe"; tableau: boolean; profil: boolean; libelle: string };
export const PROFILS: { cle: string; libelle: string; fonctions: string[]; acces: "complet" | "employe"; admin?: boolean; prerogatives?: string[]; tableau?: boolean }[] = [
  { cle: "employe", libelle: "Collaborateur — accès employé", fonctions: ["collab"], acces: "employe" },
  { cle: "collab", libelle: "Collaborateur — accès complet", fonctions: ["collab"], acces: "complet" },
  { cle: "redac", libelle: "Rédacteur", fonctions: ["redac"], acces: "complet" },
  { cle: "rcci", libelle: "RCCI", fonctions: ["rcci"], acces: "complet" },
  { cle: "dg", libelle: "Directeur Général", fonctions: ["dg"], acces: "complet", tableau: true },
  { cle: "pca", libelle: "Président du Conseil (sans administration)", fonctions: ["pca"], acces: "complet" },
  { cle: "dcom", libelle: "Directeur Commercial", fonctions: ["dcom"], acces: "complet" },
  { cle: "dmc", libelle: "Directeur des Marchés de Capitaux", fonctions: ["dmc"], acces: "complet" },
  { cle: "admin", libelle: "Administrateur (membres, lectures, tableau de bord)", fonctions: ["collab"], acces: "complet", admin: true, prerogatives: ["membres", "lectures", "tableau"], tableau: true },
];

export async function cibleCourante(sb: SupabaseClient): Promise<Cible | null> {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return null;
  const { data: s } = await sb.rpc("est_super");
  if (!s) return null;
  if (v.startsWith("profil:")) {
    const p = PROFILS.find((x) => x.cle === v.slice(7)); if (!p) return null;
    return { id: v, email: "", nom: "Profil type — " + p.libelle, fonctions: p.fonctions, admin: !!p.admin, super: false, prerogatives: p.prerogatives || [], acces: p.acces, tableau: !!p.tableau, profil: true, libelle: p.libelle };
  }
  const { data: m } = await sb.from("membres").select("email,user_id,nom,fonctions,admin,super,prerogatives,acces,tableau,actif").eq("email", v).maybeSingle();
  if (!m) return null;
  return { id: m.user_id || "email:" + m.email, email: m.email, nom: m.nom || m.email, fonctions: m.fonctions || [], admin: !!m.admin, super: !!m.super, prerogatives: m.prerogatives || [], acces: m.acces, tableau: !!m.tableau, profil: false, libelle: (m.actif ? "" : "suspendu · ") + (m.acces === "employe" ? "accès employé" : "accès complet") };
}

// Documents d'une cible à accès employé (mêmes règles que pour la personne elle-même)
export async function docsDe(sb: SupabaseClient, c: Cible) {
  const ids = [c.id, "email:" + c.email];
  const { data } = await sb.from("kv").select("path,data").like("path", "lectures/%");
  const docs = new Set<string>();
  for (const r of data || []) {
    const L = (r.data || {}) as { ids?: string[]; consult?: string[]; tous?: boolean };
    const mine = (a?: string[]) => !c.profil && (a || []).some((x) => ids.includes(x));
    if (L.tous || mine(L.ids) || mine(L.consult)) docs.add(String(r.path).slice("lectures/".length));
  }
  return docs;
}
