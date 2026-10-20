import { NextResponse } from "next/server";
import { supabaseServeur } from "../../../lib/supabase-serveur";

// Déclenche la publication automatique (workflow « Appliquer les modifications en ligne ») juste après la soumission
// d'un brouillon ou le dernier visa d'un circuit (la publication revérifie tout avant d'agir). Sans jeton GitHub configuré, la publication horaire prend le relais.
export async function POST() {
  const sb = await supabaseServeur();
  const { data: actif } = await sb.rpc("est_actif");
  if (!actif) return NextResponse.json({ ok: false }, { status: 403 });
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) return NextResponse.json({ ok: true, differe: true, message: "publication à la prochaine heure" });
  const r = await fetch("https://api.github.com/repos/totostar1900/Procedure/actions/workflows/appliquer.yml/dispatches", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    body: JSON.stringify({ ref: "main" }),
  });
  return NextResponse.json({ ok: r.ok, differe: !r.ok }, { status: r.ok ? 200 : 202 });
}
