import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServeur } from "../../../lib/supabase-serveur";
import { COOKIE, PROFILS } from "../../../lib/comme";

// Début d'un « Voir comme » (super administrateur) : journalisé, puis retour à la page du référentiel
export async function GET(req: Request) {
  const url = new URL(req.url), cible = (url.searchParams.get("cible") || "").trim().toLowerCase();
  const sb = await supabaseServeur();
  const { data: s } = await sb.rpc("est_super");
  if (!s || !cible) return NextResponse.redirect(new URL("/", url.origin));
  if (cible.startsWith("profil:") ? !PROFILS.some((p) => "profil:" + p.cle === cible) : !(await sb.from("membres").select("email").eq("email", cible).maybeSingle()).data) return NextResponse.redirect(new URL("/comme", url.origin));
  const avant = (await cookies()).get(COOKIE)?.value;
  if (avant && avant !== cible) await sb.rpc("journaliser_vue", { cible: avant, debut: false });
  const { error } = await sb.rpc("journaliser_vue", { cible, debut: true });
  if (error) return NextResponse.redirect(new URL("/comme", url.origin));
  const r = NextResponse.redirect(new URL("/", url.origin));
  r.cookies.set(COOKIE, cible, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 4 * 3600, path: "/" });
  return r;
}
