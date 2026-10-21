import fs from "node:fs";
const esc = (x: string) => String(x ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
import path from "node:path";
import { supabaseServeur } from "../lib/supabase-serveur";
import { profilAcces } from "../lib/acces";
import { cibleCourante, docsDe } from "../lib/comme";

// La page du référentiel, générée par build.mjs, avec le module qui la relie à Supabase
export async function GET() {
  let html = fs.readFileSync(path.join(process.cwd(), "site", "index.html"), "utf8");
  // Accès « employé » : la page ne contient que les documents désignés pour cette personne (versions en vigueur, sans projet de révision)
  const sb = await supabaseServeur();
  // « Voir comme » (super administrateur) : la page est préparée comme pour la personne visée
  const comme = await cibleCourante(sb);
  const acces = comme ? (comme.acces === "employe" ? { employe: true as const, docs: await docsDe(sb, comme) } : { employe: false as const, docs: null }) : await profilAcces(sb);
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
  const FL: Record<string, string> = { pca: "Président du Conseil", adm: "Administrateur du Conseil", dg: "Directeur Général", rcci: "RCCI", dcom: "Directeur Commercial", dmc: "Directeur des Marchés de Capitaux", redac: "Rédacteur", collab: "Collaborateur" };
  const vc = comme ? `<script>window.__VOIR_COMME=${JSON.stringify(comme).replace(/</g, "\\u003c")};</script>` +
    `<style>.vc-band{position:fixed;z-index:80;top:calc(8px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);max-width:calc(100vw - 24px);display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;background:#8A5A06;color:#fff;padding:7px 12px;border-radius:2px;box-shadow:0 6px 20px rgba(6,27,51,.3);font:500 12.5px Inter,Arial,sans-serif}` +
    `.vc-band b{font-weight:700}.vc-band a{color:#fff;font-weight:700;text-decoration:underline;white-space:nowrap}.vc-band .ro{background:rgba(255,255,255,.18);padding:1px 6px;font-size:11px;letter-spacing:.04em;text-transform:uppercase}` +
    `html.voir-comme [data-vact],html.voir-comme [data-vrole],html.voir-comme [data-vlectsave],html.voir-comme [data-vetat],html.voir-comme [data-edit-doc],html.voir-comme [data-ed],html.voir-comme [data-new],html.voir-comme [data-del],html.voir-comme [data-dup],html.voir-comme [data-vcirc],html.voir-comme #btn-nouveau{opacity:.55;cursor:not-allowed}</style>` : "";
  const bandeau = comme ? `<div class="vc-band" role="status" data-i18n="no">Vous voyez le référentiel comme <b>${esc(comme.nom)}</b>${comme.profil ? "" : " — " + esc(comme.fonctions.map((f) => FL[f] || f).join(", ") || "sans fonction") + (comme.libelle ? " · " + esc(comme.libelle) : "")}<span class="ro">Lecture seule</span><a href="/comme">Changer</a><a href="/comme/quitter">Quitter</a></div>` : "";
  const cfg = vc + `<script>window.__REF_CFG=${JSON.stringify({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY })};</script><script src="/shim.js"></script>`;
  const out = /^\s*(<!doctype[^>]*>\s*)?<html[\s>]/i.test(html) && /<head(\s[^>]*)?>/i.test(html) ? html.replace(/<head(\s[^>]*)?>/i, (m) => m + '<meta charset="utf-8">' + cfg) : '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + cfg + "</head><body>" + html + "</body></html>";
  const page = bandeau ? out.replace(/<body([^>]*)>/i, (m) => m + bandeau) : out;
  return new Response(page, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" } });
}
