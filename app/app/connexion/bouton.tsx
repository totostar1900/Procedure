"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

export default function Bouton() {
  const [attente, setAttente] = useState(false);
  const go = async () => {
    setAttente(true);
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await sb.auth.signInWithOAuth({ provider: "azure", options: { scopes: "openid email profile", redirectTo: window.location.origin + "/auth/callback" } });
  };
  return (
    <button type="button" onClick={go} disabled={attente} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 16px", background: "#0B2E52", color: "#fff", border: 0, borderRadius: 4, fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: attente ? 0.6 : 1 }}>
      <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>
      {attente ? "Redirection…" : "Se connecter avec Microsoft 365"}
    </button>
  );
}
