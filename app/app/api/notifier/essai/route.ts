import { NextResponse } from "next/server";
import { supabaseServeur } from "../../../../lib/supabase-serveur";
import { essai, executer } from "../../../../lib/notifier";

// Super administrateur : e-mail d'essai vers la boîte partagée, ou exécution immédiate (hors heures comprises)
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(req: Request) {
  const sb = await supabaseServeur();
  const { data: s } = await sb.rpc("est_super");
  if (!s) return NextResponse.json({ ok: false }, { status: 403 });
  const { data: { user } } = await sb.auth.getUser();
  const q = new URL(req.url).searchParams.get("quoi");
  try {
    if (q === "maintenant") return NextResponse.json(await executer({ force: true }));
    await essai(user?.email || "");
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ ok: false, erreur: String((e as Error).message) }, { status: 500 }); }
}
