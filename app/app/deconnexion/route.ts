import { NextResponse } from "next/server";
import { supabaseServeur } from "@/lib/supabase-serveur";

export async function GET(req: Request) {
  const supabase = await supabaseServeur();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/connexion", new URL(req.url).origin));
}
