"use client";
import { useEffect } from "react";

// Charge la traduction de l'interface (même moteur et même dictionnaire que la page du référentiel) après l'hydratation
export default function Langue() {
  useEffect(() => {
    if (document.getElementById("pc-i18n")) return;
    const s = document.createElement("script"); s.id = "pc-i18n"; s.src = "/i18n.js"; s.onload = () => window.dispatchEvent(new Event("pci18n")); document.body.appendChild(s);
  }, []);
  return null;
}
