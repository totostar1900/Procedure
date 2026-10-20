import fs from "node:fs";
import path from "node:path";
import { supabaseServeur } from "../../../lib/supabase-serveur";
import { profilAcces, fichierAutorise } from "../../../lib/acces";

const TYPES: Record<string, string> = { ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8", ".ttf": "font/ttf", ".json": "application/json; charset=utf-8" };

export async function GET(_req: Request, ctx: { params: Promise<{ chemin: string[] }> }) {
  const { chemin } = await ctx.params;
  const [dossier, ...reste] = chemin;
  if (!["pdf", "word", "fonts", "source"].includes(dossier) || reste.some((s) => s.includes("..") || s.includes("/"))) return new Response("Introuvable", { status: 404 });
  if (dossier !== "fonts") {
    const acces = await profilAcces(await supabaseServeur());
    if (acces.employe && (dossier === "source" || !fichierAutorise(reste.join("/"), acces.docs!))) return new Response("Accès réservé", { status: 403 });
  }
  const f = path.join(process.cwd(), "site", dossier, ...reste);
  if (!fs.existsSync(f)) return new Response("Introuvable", { status: 404 });
  return new Response(fs.readFileSync(f), { headers: { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": dossier === "source" ? "private, no-store" : "private, max-age=300" } });
}
