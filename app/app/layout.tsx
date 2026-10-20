import Langue from "../lib/langue";
export const metadata = { title: "Référentiel documentaire — Purpose Capital" };
export default function Racine({ children }: { children: React.ReactNode }) {
  return (<html lang="fr"><body style={{ margin: 0 }}>{children}<Langue /></body></html>);
}
