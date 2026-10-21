import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServeur } from "../../../lib/supabase-serveur";
import { COOKIE } from "../../../lib/comme";

// Fin d'un « Voir comme » : journalisée, retour à sa propre vue
export async function GET(req: Request) {
  const url = new URL(req.url), cible = (await cookies()).get(COOKIE)?.value;
  if (cible) { const sb = await supabaseServeur(); await sb.rpc("journaliser_vue", { cible, debut: false }); }
  const vers = url.searchParams.get("vers") === "choix" ? "/comme" : "/";
  const r = NextResponse.redirect(new URL(vers, url.origin));
  r.cookies.delete(COOKIE);
  return r;
}
