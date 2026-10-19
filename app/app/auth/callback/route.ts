import { NextResponse } from "next/server";
import { supabaseServeur } from "@/lib/supabase-serveur";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const supabase = await supabaseServeur();
  if (code) await supabase.auth.exchangeCodeForSession(code);
  const { data } = await supabase.rpc("rattacher");
  if (!data || !(data as { autorise?: boolean }).autorise) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/connexion?refus=1", url.origin));
  }
  return NextResponse.redirect(new URL("/", url.origin));
}
