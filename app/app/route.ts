import fs from "node:fs";
import path from "node:path";
import { supabaseServeur } from "../lib/supabase-serveur";
import { profilAcces } from "../lib/acces";

// La page du référentiel, générée par build.mjs, avec le module qui la relie à Supabase
export async function GET() {
  let html = fs.readFileSync(path.join(process.cwd(), "site", "index.html"), "utf8");
  // Accès « employé » : la page ne contient que les documents désignés pour cette personne (versions en vigueur, sans projet de révision)
  const acces = await profilAcces(await supabaseServeur());
  if (acces.employe && acces.docs) {
    const allowed = acces.docs;
    html = html.replace(/(<script type="application\/json" id="ref-data">)([\s\S]*?)(<\/script>)/, (_m, a, json, b) => {
      const D = JSON.parse(json);
      D.docs = D.docs.filter((d: { id: string }) => allowed.has(d.id)).map((d: Record<string, unknown>) => ({ ...d, projet: undefined, notes_redaction: [] }));
      D.prevus = [];
      D.restreint = true;
      return a + JSON.stringify(D).replace(/</g, "\\u003c") + b;
    });
  }
  const cfg = `<script>window.__REF_CFG=${JSON.stringify({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY })};</script><script src="/shim.js"></script>`;
  const out = /^\s*(<!doctype[^>]*>\s*)?<html[\s>]/i.test(html) && /<head(\s[^>]*)?>/i.test(html) ? html.replace(/<head(\s[^>]*)?>/i, (m) => m + '<meta charset="utf-8">' + cfg) : '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + cfg + "</head><body>" + html + "</body></html>";
  return new Response(out, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" } });
}
