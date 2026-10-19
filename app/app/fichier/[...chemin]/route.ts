import fs from "node:fs";
import path from "node:path";

const TYPES: Record<string, string> = { ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8", ".ttf": "font/ttf" };

export async function GET(_req: Request, ctx: { params: Promise<{ chemin: string[] }> }) {
  const { chemin } = await ctx.params;
  const [dossier, ...reste] = chemin;
  if (!["pdf", "word", "fonts"].includes(dossier) || reste.some((s) => s.includes("..") || s.includes("/"))) return new Response("Introuvable", { status: 404 });
  const f = path.join(process.cwd(), "site", dossier, ...reste);
  if (!fs.existsSync(f)) return new Response("Introuvable", { status: 404 });
  return new Response(fs.readFileSync(f), { headers: { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "private, max-age=300" } });
}
