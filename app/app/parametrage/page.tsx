import { coquille } from "../../lib/coquille";
import RailClient from "../membres/rail";
import Reglages from "./reglages";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paramétrage — Référentiel Purpose Capital" };

// Super administrateur (toutes les sections) ou administrateur ayant la prérogative « circuits » (circuits et délais) ;
// vérifié ici et, pour chaque écriture, par la base.
export default async function Parametrage() {
  const { moi, docs, css, rail } = await coquille("parametrage", false);
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: rail }} />
      <div className="shell"><Reglages moi={{ email: moi.email, super: moi.super, prerogatives: moi.prerogatives }} docs={docs} /></div>
      <RailClient />
    </>
  );
}
