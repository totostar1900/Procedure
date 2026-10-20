import { coquille } from "../../lib/coquille";
import Gestion from "./gestion";
import RailClient from "./rail";

export const dynamic = "force-dynamic";
export const metadata = { title: "Membres — Référentiel Purpose Capital" };

// Réservée aux administrateurs ; la base vérifie de nouveau chaque écriture (règles RLS et déclencheur membres_garde).
export default async function Membres() {
  const { moi, docs, css, rail } = await coquille("membres", false);
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: rail }} />
      <div className="shell"><Gestion moi={{ email: moi.email, super: moi.super, prerogatives: moi.prerogatives }} docs={docs} /></div>
      <RailClient />
    </>
  );
}
