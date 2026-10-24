import { coquille } from "../../lib/coquille";
import RailClient from "../membres/rail";
import Activite from "./activite";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activité — Référentiel Purpose Capital" };

// Journal d'activité : super administrateur, ou membres à qui il a donné la prérogative « activite » (vérifié aussi par la base)
export default async function Page() {
  const { moi, docs, css, rail } = await coquille("activite", false);
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: rail }} />
      <div className="shell"><Activite moi={{ email: moi.email, super: moi.super, prerogatives: moi.prerogatives }} docs={docs.map((d) => ({ id: d.id, titre: d.titre, type: d.type }))} /></div>
      <RailClient />
    </>
  );
}
