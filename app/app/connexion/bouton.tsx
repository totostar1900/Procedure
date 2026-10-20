"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

// Connexion Microsoft 365 : le sélecteur de compte s'affiche toujours (plusieurs comptes sur un même appareil),
// avec en tête la dernière adresse acceptée. « Autre compte » ferme d'abord la session du site.
const derniere = () => { const m = document.cookie.match(/(?:^|; )pc-ref-compte=([^;]+)/); return m ? decodeURIComponent(m[1]) : ""; };

export default function Bouton({ autre }: { autre?: boolean }) {
  const [attente, setAttente] = useState(false);
  const go = async () => {
    setAttente(true);
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    if (autre) { try { await sb.auth.signOut(); } catch { /* déjà déconnecté */ } }
    const hint = autre ? "" : derniere();
    await sb.auth.signInWithOAuth({ provider: "azure", options: { scopes: "openid email profile", redirectTo: window.location.origin + "/auth/callback",
      queryParams: { prompt: "select_account", ...(hint ? { login_hint: hint } : {}) } } });
  };
  return (
    <button type="button" onClick={go} disabled={attente} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 16px", background: autre ? "#fff" : "#0B2E52", color: autre ? "#0B2E52" : "#fff", border: autre ? "1px solid #0B2E52" : 0, borderRadius: 4, fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: attente ? 0.6 : 1 }}>
      <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>
      {attente ? "Redirection…" : autre ? "Se connecter avec un autre compte" : "Se connecter avec Microsoft 365"}
    </button>
  );
}
