import Bouton from "./bouton";

export default async function Connexion({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const { refus } = await searchParams;
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0B2E52", fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 6, padding: "36px 32px", maxWidth: 420, width: "100%", boxShadow: "0 12px 40px rgba(0,0,0,.25)" }}>
        <div style={{ letterSpacing: ".18em", fontWeight: 600, color: "#0B2E52", fontSize: 13 }}>PURPOSE CAPITAL</div>
        <div style={{ width: 28, height: 2, background: "#E8A020", margin: "8px 0 22px" }} />
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#0B2E52", fontSize: 26, margin: "0 0 8px" }}>Référentiel documentaire</h1>
        <p style={{ color: "#3E5068", fontSize: 14.5, lineHeight: 1.5, margin: "0 0 24px" }}>Codes, politiques et procédures. Accès réservé au personnel et aux administrateurs, avec votre compte Microsoft 365 de Purpose Capital.</p>
        {refus ? <p role="alert" style={{ background: "#FBF1DC", color: "#6B4A0E", padding: "10px 12px", borderRadius: 4, fontSize: 13.5, margin: "0 0 18px" }}>Votre compte n&apos;a pas, ou plus, accès au référentiel. Adressez-vous à l&apos;administrateur.</p> : null}
        <Bouton />
      </div>
    </main>
  );
}
