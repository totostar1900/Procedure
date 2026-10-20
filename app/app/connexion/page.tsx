import { cookies } from "next/headers";
import { supabaseServeur } from "@/lib/supabase-serveur";
import Bouton from "./bouton";

export default async function Connexion({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const { refus: refusQ } = await searchParams;
  let refus = refusQ;
  // Compte refusé : celui qui vient d'être essayé (retour Microsoft) ou celui encore connecté (accès retiré depuis)
  let compte = "";
  if (refus) {
    compte = (await cookies()).get("pc-ref-refus")?.value || "";
    if (!compte) { try { const sb = await supabaseServeur(); const { data: { user } } = await sb.auth.getUser(); compte = user?.email || ""; if (user) { const { data: actif } = await sb.rpc("est_actif"); if (actif) { refus = undefined; compte = ""; } } } catch { /* sans session */ } }
  }
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0B2E52", fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 6, padding: "36px 32px", maxWidth: 420, width: "100%", boxShadow: "0 12px 40px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ letterSpacing: ".18em", fontWeight: 600, color: "#0B2E52", fontSize: 13 }}>PURPOSE CAPITAL</div>
          <div data-i18n="no" style={{ display: "flex", gap: 2, fontSize: 12, fontWeight: 600 }}>
            <button type="button" data-lang="fr" title="Français" style={{ background: "none", border: "1px solid #DCE4EE", padding: "2px 8px", cursor: "pointer", color: "#0B2E52" }}>FR</button>
            <button type="button" data-lang="en" title="English" style={{ background: "none", border: "1px solid #DCE4EE", padding: "2px 8px", cursor: "pointer", color: "#0B2E52" }}>EN</button>
          </div>
        </div>
        <div style={{ width: 28, height: 2, background: "#E8A020", margin: "8px 0 22px" }} />
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#0B2E52", fontSize: 26, margin: "0 0 8px" }}>Référentiel documentaire</h1>
        <p style={{ color: "#3E5068", fontSize: 14.5, lineHeight: 1.5, margin: "0 0 24px" }}>Codes, politiques et procédures. Accès réservé au personnel et aux administrateurs, avec votre compte Microsoft 365 de Purpose Capital.</p>
        {refus ? <div role="alert" style={{ background: "#FBF1DC", color: "#6B4A0E", padding: "10px 12px", borderRadius: 4, fontSize: 13.5, margin: "0 0 18px", lineHeight: 1.45 }}>
          {compte ? <p style={{ margin: "0 0 6px" }}>Vous vous êtes connecté avec <b data-i18n="no">{compte}</b>, qui n&apos;a pas, ou plus, accès au référentiel.</p> : <p style={{ margin: "0 0 6px" }}>Votre compte n&apos;a pas, ou plus, accès au référentiel.</p>}
          <p style={{ margin: 0 }}>Utilisez votre adresse @purposecapital.africa. Si c&apos;est déjà le cas, adressez-vous à l&apos;administrateur.</p>
        </div> : null}
        {refus ? <Bouton autre /> : <Bouton />}
        <p style={{ color: "#5B6B80", fontSize: 12.5, margin: "14px 0 0", lineHeight: 1.45 }}>Microsoft vous demande de choisir le compte : prenez celui de Purpose Capital.</p>
      </div>
    </main>
  );
}
