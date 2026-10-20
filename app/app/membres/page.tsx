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
  return <Gestion moi={(user?.email || "").toLowerCase()} />;
}
