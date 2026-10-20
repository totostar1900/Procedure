import fs from "node:fs";
import path from "node:path";

// La page du référentiel, générée par build.mjs, avec le module qui la relie à Supabase
export async function GET() {
  const html = fs.readFileSync(path.join(process.cwd(), "site", "index.html"), "utf8");
  const cfg = `<script>window.__REF_CFG=${JSON.stringify({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY })};</script><script src="/shim.js"></script>`;
  const out = /^\s*(<!doctype[^>]*>\s*)?<html[\s>]/i.test(html) && /<head(\s[^>]*)?>/i.test(html) ? html.replace(/<head(\s[^>]*)?>/i, (m) => m + '<meta charset="utf-8">' + cfg) : '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + cfg + "</head><body>" + html + "</body></html>";
  return new Response(out, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" } });
}
