import { NextResponse } from "next/server";
import { supabaseServeur } from "../../../lib/supabase-serveur";

// Diagnostic de session : qui suis-je pour le serveur ?
export async function GET() {
  const sb = await supabaseServeur();
  const { data: { user }, error } = await sb.auth.getUser();
  const [a, b] = await Promise.all([sb.rpc("est_admin"), sb.rpc("est_actif")]);
  return NextResponse.json({ email: user?.email || null, erreur: error?.message || null, admin: a.data, adminErr: a.error?.message || null, actif: b.data });
}
