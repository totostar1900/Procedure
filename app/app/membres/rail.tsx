"use client";
import { useEffect } from "react";

// Comportement du rail sur la page Membres : mêmes boutons que dans le référentiel (ils y renvoient),
// repli mémorisé, ouverture sur téléphone.
export default function RailClient() {
  useEffect(() => {
    const body = document.body;
    const fold = (on: boolean) => { body.classList.toggle("rail-folded", on); try { localStorage.setItem("pc-ref-rail", on ? "1" : "0"); } catch { /* stockage indisponible */ } };
    try { if (localStorage.getItem("pc-ref-rail") === "1") body.classList.add("rail-folded"); } catch { /* stockage indisponible */ }
    const mobile = (on: boolean) => { body.classList.toggle("rail-open", on); const s = document.getElementById("rail-scrim"); if (s) s.hidden = !on; };
    const click = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement;
      const o = t.closest("[data-open]");
      if (o) { ev.preventDefault(); const v = o.getAttribute("data-open"); location.href = v === "registre" ? "/" : "/#" + v; return; }
      if (t.closest("#rail-fold")) { fold(!body.classList.contains("rail-folded")); return; }
      if (t.closest("#rail-open")) { mobile(true); return; }
      if (t.closest("#rail-scrim")) mobile(false);
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  return null;
}
