import fs from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { supabaseServeur } from "../../lib/supabase-serveur";
import Gestion from "./gestion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Membres — Référentiel Purpose Capital" };

// Réservée à l'administrateur ; la base le vérifie de nouveau à chaque écriture (règles RLS).
export default async function Membres() {
  const sb = await supabaseServeur();
  const { data: admin } = await sb.rpc("est_admin");
  if (!admin) redirect("/");
  const { data: { user } } = await sb.auth.getUser();
  // Liste des documents du référentiel (pour désigner ceux mis à la disposition des employés)
  let docs: { id: string; titre: string; type: string }[] = [];
  try {
    const html = fs.readFileSync(path.join(process.cwd(), "site", "index.html"), "utf8");
    const m = html.match(/<script type="application\/json" id="ref-data">([\s\S]*?)<\/script>/);
    if (m) docs = JSON.parse(m[1]).docs.map((d: { id: string; titre: string; type: string }) => ({ id: d.id, titre: d.titre, type: d.type }));
  } catch { /* liste indisponible */ }
  return <Gestion moi={(user?.email || "").toLowerCase()} docs={docs} />;
}
