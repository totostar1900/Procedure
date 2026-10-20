import { NextResponse } from "next/server";
import { supabaseServeur } from "../../../../lib/supabase-serveur";

// État de la configuration des envois (super administrateur) : quelles variables Vercel sont renseignées.
// Les valeurs ne sont jamais renvoyées.
export const dynamic = "force-dynamic";
export async function GET() {
  const sb = await supabaseServeur();
  const { data: s } = await sb.rpc("est_super");
  if (!s) return NextResponse.json({ ok: false }, { status: 403 });
  const v = (k: string) => !!process.env[k];
  return NextResponse.json({ ok: true, variables: { SUPABASE_SERVICE_ROLE_KEY: v("SUPABASE_SERVICE_ROLE_KEY"), M365_TENANT_ID: v("M365_TENANT_ID"), M365_CLIENT_ID: v("M365_CLIENT_ID"), M365_CLIENT_SECRET: v("M365_CLIENT_SECRET") } });
}
