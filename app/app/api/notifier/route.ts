import { NextResponse } from "next/server";
import { executer } from "../../../lib/notifier";

// Calcule et envoie les avis dus. Appelé par la base (toutes les 15 minutes, jours ouvrés) et par la page après
// chaque action. Sans identifiant : l'exécution ne fait qu'envoyer ce qui est dû, une seule fois, et se limite
// elle-même à une exécution toutes les 20 secondes.
export const dynamic = "force-dynamic";
export const maxDuration = 60;
async function lancer() {
  try { return NextResponse.json(await executer()); }
  catch (e) { console.error("notifier", e); return NextResponse.json({ ok: false, erreur: String((e as Error).message) }, { status: 500 }); }
}
export const POST = lancer;
export const GET = lancer;
