import { NextResponse } from "next/server";
import { supabaseServeur } from "@/lib/supabase-serveur";

// Retour de Microsoft 365. Refus : la session est fermée et l'adresse utilisée est gardée 10 minutes (cookie privé)
// pour l'afficher sur la page de connexion. Succès : l'adresse est retenue un an pour être proposée en premier.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const supabase = await supabaseServeur();
  if (code) await supabase.auth.exchangeCodeForSession(code);
  const { data: { user } } = await supabase.auth.getUser();
  const email = (user?.email || "").toLowerCase();
  const { data } = await supabase.rpc("rattacher");
  if (!data || !(data as { autorise?: boolean }).autorise) {
    await supabase.auth.signOut();
    const r = NextResponse.redirect(new URL("/connexion?refus=1", url.origin));
    if (email) r.cookies.set("pc-ref-refus", email, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
    return r;
  }
  const r = NextResponse.redirect(new URL("/", url.origin));
  if (email) r.cookies.set("pc-ref-compte", email, { httpOnly: false, secure: true, sameSite: "lax", maxAge: 31536000, path: "/" });
  r.cookies.delete("pc-ref-refus");
  return r;
}
