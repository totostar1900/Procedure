"use client";
import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

// Comportement du rail sur la page Membres : mêmes boutons que dans le référentiel (ils y renvoient),
// repli mémorisé, ouverture sur téléphone.
export default function RailClient() {
  // Présence sur les pages d'administration (journal d'activité) : même séance que dans le référentiel
  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    let geste = Date.now();
    const g = () => { geste = Date.now(); };
    ["pointerdown", "keydown", "scroll", "mousemove"].forEach((e) => addEventListener(e, g, { passive: true }));
    const battre = () => {
      if (document.visibilityState !== "visible" || Date.now() - geste > 300000) return;
      let sid = "", vu = 0;
      try { const x = JSON.parse(sessionStorage.getItem("pc-ref-seance") || "null"); if (x) { sid = x.id; vu = x.vu; } } catch { /* stockage indisponible */ }
      if (!sid || Date.now() - vu > 1800000) sid = crypto.randomUUID();
      try { sessionStorage.setItem("pc-ref-seance", JSON.stringify({ id: sid, vu: Date.now() })); } catch { /* idem */ }
      sb.rpc("battement", { sid, v: "page:" + location.pathname.slice(1) }).then(() => {}, () => {});
    };
    const t0 = setTimeout(battre, 1500), t1 = setInterval(battre, 60000);
    return () => { clearTimeout(t0); clearInterval(t1); ["pointerdown", "keydown", "scroll", "mousemove"].forEach((e) => removeEventListener(e, g)); };
  }, []);
  useEffect(() => {
    const body = document.body;
    let t: ReturnType<typeof setTimeout> | null = null;
    const peek = (on: boolean) => { if (t) clearTimeout(t); t = null; if (on) body.classList.add("rail-peek"); else t = setTimeout(() => { body.classList.remove("rail-peek"); t = null; }, 250); };
    // Page réservée à l'administrateur : le tableau de bord lui est toujours ouvert
    const nt = document.getElementById("nav-tableau"); if (nt) nt.hidden = false;
    const fold = (on: boolean) => { body.classList.toggle("rail-folded", on); body.classList.remove("rail-peek"); try { localStorage.setItem("pc-ref-rail", on ? "1" : "0"); } catch { /* stockage indisponible */ } };
    try { if (localStorage.getItem("pc-ref-rail") === "1") body.classList.add("rail-folded"); } catch { /* stockage indisponible */ }
    const mobile = (on: boolean) => { body.classList.toggle("rail-open", on); const s = document.getElementById("rail-scrim"); if (s) s.hidden = !on; };
    const click = (ev: MouseEvent) => {
      const el = ev.target as HTMLElement;
      const o = el.closest("[data-open]");
      if (o) { ev.preventDefault(); const v = o.getAttribute("data-open"); location.href = v === "registre" ? "/" : "/#" + v; return; }
      if (el.closest("#rail-fold")) { fold(!body.classList.contains("rail-folded")); return; }
      if (el.closest("#rail-show")) { fold(false); return; }
      if (el.closest("#rail-open")) { mobile(true); return; }
      if (el.closest("#rail-scrim")) mobile(false);
    };
    document.addEventListener("click", click);
    const enter = () => { if (body.classList.contains("rail-folded")) peek(true); };
    const els = ["rail-edge"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    els.forEach((e) => e.addEventListener("mouseenter", enter));
    // Repli dès que la souris s'éloigne du menu (suivi de la position : le menu glisse sous le pointeur)
    const move = (ev: MouseEvent) => {
      if (!body.classList.contains("rail-folded") || !body.classList.contains("rail-peek")) return;
      const r = document.getElementById("rail")?.getBoundingClientRect(); if (!r) return;
      if (ev.clientX <= r.right + 16) { if (t) clearTimeout(t); t = null; } else if (!t) peek(false);
    };
    document.addEventListener("mousemove", move);
    return () => { document.removeEventListener("click", click); document.removeEventListener("mousemove", move); els.forEach((e) => e.removeEventListener("mouseenter", enter)); };
  }, []);
  return null;
}
