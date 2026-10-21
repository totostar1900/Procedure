// Relie la page du référentiel (écrite pour l'environnement claude.ai : window.claude.use(...))
// à Supabase : connexion Microsoft 365, base partagée, téléchargements.
// Mêmes chemins que l'artefact : roles/<id>, lectures/<doc>, annuaire/<id>, sig/<id>/items/<clé>, dossiers/<id>.
import { createBrowserClient } from "@supabase/ssr";

const CFG = window.__REF_CFG || {};
const VC = window.__VOIR_COMME || null;
const lectureSeule = () => { const e = new Error("Lecture seule : vous voyez le référentiel comme une autre personne."); e.code = "permission-denied"; return e; };
if (VC) {
  document.documentElement.classList.add("voir-comme");
  // Les boutons qui écriraient restent visibles mais ne font rien : on le dit plutôt que d'ouvrir une confirmation inutile
  const ACT = "[data-vact],[data-vlectsave],[data-vetat],[data-edit-doc],[data-ed],[data-new],[data-del],[data-dup],[data-vcirc],#btn-nouveau";
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest(ACT); if (!b) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    let t = document.getElementById("vc-toast");
    if (!t) { t = document.createElement("div"); t.id = "vc-toast"; t.setAttribute("role", "status"); t.style.cssText = "position:fixed;z-index:90;left:50%;bottom:24px;transform:translateX(-50%);background:#0B2E52;color:#fff;padding:9px 14px;font:500 13px Inter,Arial,sans-serif;box-shadow:0 6px 20px rgba(6,27,51,.3);max-width:calc(100vw - 32px)"; document.body.appendChild(t); }
    t.textContent = "Lecture seule : cette action serait proposée à " + VC.nom + ", mais elle n'est pas possible en « Voir comme ».";
    clearTimeout(t._h); t._h = setTimeout(() => t.remove(), 4000);
  }, true);
}
const sb = createBrowserClient(CFG.url, CFG.key);
let ME = null; // { id, nom, email, admin, fonctions }
const meP = (async () => {
  const { data } = await sb.rpc("rattacher");
  const { data: u } = await sb.auth.getUser();
  if (data && data.autorise) ME = { id: data.id, nom: data.nom || "", email: (u && u.user && u.user.email) || "", admin: !!data.admin, fonctions: data.fonctions || [] };
  // « Voir comme » (super administrateur) : la page se comporte comme pour la personne visée, sans pouvoir écrire
  if (ME && VC) ME = { id: VC.id, nom: VC.nom, email: VC.email, admin: VC.admin, fonctions: VC.fonctions };
  return ME;
})();

// ---------- membres <-> roles/<id> ----------
let membresCache = [];
const idOf = (m) => m.user_id || "email:" + m.email;
async function lireMembres() {
  const { data, error } = await sb.from("membres").select("email,user_id,nom,fonctions,actif,admin,super,prerogatives,acces,tableau,cree_le").order("email");
  if (error) throw { code: "unavailable", message: error.message };
  membresCache = data || [];
  return membresCache;
}
const err = (e) => ({ code: e && /permission|policy|violates/i.test(e.message || "") ? "invalid_argument" : "unavailable", message: (e && e.message) || "erreur" });

function snap(rows) {
  const docs = rows.map((r) => ({ id: r.id, exists: true, data: () => r.data, metadata: { fromCache: false, hasPendingWrites: false } }));
  return { docs, size: docs.length, empty: !docs.length, docChanges: () => docs.map((d, i) => ({ type: "added", doc: d, oldIndex: -1, newIndex: i })), metadata: { fromCache: false, hasPendingWrites: false } };
}
const lastSeg = (p) => p.split("/").pop();

async function lireCollection(coll, opts) {
  if (coll === "roles") {
    const ms = await lireMembres();
    const rs = ms.map((m) => ({ id: idOf(m), data: { fonctions: m.fonctions, actif: m.actif, admin: m.admin, super: !!m.super, prerogatives: m.prerogatives || [], acces: m.acces, tableau: m.tableau, cree_le: m.cree_le, connecte: !!m.user_id } }));
    if (VC && VC.profil) rs.push({ id: VC.id, data: { fonctions: VC.fonctions, actif: true, admin: VC.admin, super: false, prerogatives: VC.prerogatives, acces: VC.acces, tableau: VC.tableau, cree_le: new Date().toISOString(), connecte: true } });
    return rs;
  }
  if (coll === "journal") {
    // Journal des opérations (administrateur et personnes ayant le tableau de bord) : 400 dernières entrées
    const { data, error } = await sb.from("journal").select("id,le,par,par_email,action,path,data").order("le", { ascending: false }).limit(400);
    if (error) throw err(error);
    return (data || []).map((r) => ({ id: String(r.id), data: r }));
  }
  let q = sb.from("kv").select("path,data,maj_le").eq("collection", coll);
  if (opts && opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw err(error);
  let rows = (data || []).map((r) => ({ id: lastSeg(r.path), data: r.data }));
  if (coll === "lectures") {
    // une lecture désignée par adresse avant la première connexion suit la personne après
    const ms = membresCache.length ? membresCache : await lireMembres();
    const map = {}; ms.forEach((m) => { if (m.user_id) map["email:" + m.email] = m.user_id; });
    rows = rows.map((r) => ({ id: r.id, data: { ...r.data, ids: (r.data.ids || []).map((x) => map[x] || x) } }));
  }
  if (opts && opts.orderBy) { const [f, dir] = opts.orderBy; rows.sort((a, b) => ((a.data[f] || "") < (b.data[f] || "") ? -1 : 1) * (dir === "desc" ? -1 : 1)); }
  return rows;
}

// Abonnements : rafraîchis après chaque écriture de cette page, par le temps réel, et toutes les 20 s
const subs = new Set();
const refreshAll = () => subs.forEach((s) => s.run());
// Après une écriture : le site calcule les avis par e-mail dus (visa attendu, lecture, renvoi…) ; rien n'est envoyé deux fois
let avisT = null;
const avis = () => { clearTimeout(avisT); avisT = setTimeout(() => { try { fetch("/api/notifier", { method: "POST", keepalive: true }); } catch (e) { /* le passage suivant enverra */ } }, 4000); };
setInterval(refreshAll, 20000);
sb.channel("kv-tout").on("postgres_changes", { event: "*", schema: "public", table: "kv" }, refreshAll)
  .on("postgres_changes", { event: "*", schema: "public", table: "membres" }, refreshAll).subscribe();

function collection(coll, opts = {}) {
  return {
    doc: (id) => doc(coll + "/" + id),
    orderBy: (f, dir) => collection(coll, { ...opts, orderBy: [f, dir] }),
    limit: (n) => collection(coll, { ...opts, limit: n }),
    where: () => collection(coll, opts),
    get: async () => snap(await lireCollection(coll, opts)),
    onSnapshot(next, error) {
      let live = true, last = "";
      const s = { run: async () => {
        if (!live) return;
        try { const rows = await lireCollection(coll, opts); const k = JSON.stringify(rows); if (k !== last) { last = k; next(snap(rows)); } }
        catch (e) { if (error) error(e); }
      } };
      subs.add(s); s.run();
      return () => { live = false; subs.delete(s); };
    },
  };
}

function doc(p) {
  return {
    id: lastSeg(p),
    collection: (c) => collection(p + "/" + c),
    async get() {
      if (p.startsWith("roles/")) { const ms = await lireMembres(); const m = ms.find((x) => idOf(x) === lastSeg(p)); return { id: lastSeg(p), exists: !!m, data: () => (m ? { fonctions: m.fonctions, actif: m.actif } : undefined) }; }
      const { data, error } = await sb.from("kv").select("data").eq("path", p).maybeSingle();
      if (error) throw err(error);
      return { id: lastSeg(p), exists: !!data, data: () => (data ? data.data : undefined), metadata: { fromCache: false, hasPendingWrites: false } };
    },
    async set(body) {
      if (VC) throw lectureSeule();
      if (p.startsWith("roles/")) {
        const id = lastSeg(p);
        const row = { fonctions: body.fonctions || [], actif: body.actif !== false, maj_le: new Date().toISOString() };
        const r = id.startsWith("email:")
          ? await sb.from("membres").upsert({ email: id.slice(6).toLowerCase(), ...row }, { onConflict: "email" })
          : await sb.from("membres").update(row).eq("user_id", id);
        if (r.error) throw err(r.error);
      } else if (p.startsWith("sig/") || p.startsWith("figes/") || p.startsWith("adoptions/")) {
        const r = await sb.from("kv").insert({ path: p, data: body });
        if (r.error) throw err(r.error);
      } else {
        const r = await sb.from("kv").upsert({ path: p, data: body }, { onConflict: "path" });
        if (r.error) throw err(r.error);
      }
      refreshAll();
      if (!p.startsWith("annuaire/") && !p.startsWith("dossiers/") && !p.startsWith("brouillons/")) avis();
    },
    async update(part) { const cur = await this.get(); await this.set({ ...(cur.data() || {}), ...part }); },
    async delete() { if (VC) throw lectureSeule(); const r = await sb.from("kv").delete().eq("path", p); if (r.error) throw err(r.error); refreshAll(); avis(); },
    onSnapshot(next, error) {
      return collection(p.replace(/\/[^/]+$/, "")).onSnapshot((s) => { const d = s.docs.find((x) => x.id === lastSeg(p)); next(d || { id: lastSeg(p), exists: false, data: () => undefined }); }, error);
    },
  };
}

// ---------- user ----------
const user = {
  id: async () => (await meP) && ME.id,
  me: async () => { await meP; return ME ? { id: ME.id, name: ME.nom, email: ME.email, isOwner: ME.admin, canEdit: ME.admin } : { id: null, name: "", email: null, isOwner: false, canEdit: false }; },
  name: async () => ((await meP) ? ME.nom : ""),
  isOwner: async () => !!((await meP) && ME.admin),
  canEdit: async () => !!((await meP) && ME.admin),
  can: async () => !!(await meP),
  async profiles(ids) {
    const ms = membresCache.length ? membresCache : await lireMembres().catch(() => []);
    const out = {};
    ids.forEach((id) => { const m = ms.find((x) => idOf(x) === id || x.user_id === id); out[id] = { id, name: m ? m.nom || m.email : VC && id === VC.id ? VC.nom : id.startsWith("email:") ? id.slice(6) : "", email: m ? m.email : null, isMe: !!(ME && id === ME.id), guest: false }; });
    return out;
  },
  async search(q) {
    q = String(q || "").trim().toLowerCase();
    const ms = await lireMembres().catch(() => []);
    const hits = ms.filter((m) => !q || m.email.includes(q) || (m.nom || "").toLowerCase().includes(q)).map((m) => ({ id: idOf(m), name: m.nom || m.email, email: m.email }));
    if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(q) && !ms.some((m) => m.email === q)) hits.unshift({ id: "email:" + q, name: q + " (accès à créer)", email: q });
    return hits;
  },
};

// ---------- downloads ----------
const downloads = {
  async save({ filename, data }) {
    const blob = data instanceof Blob ? data : new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return { saved: true };
  },
};

window.claude = { use: async (name) => (name === "db" ? ((await meP) ? { collection, doc } : null) : name === "user" ? user : name === "downloads" ? downloads : null) };

// Nom, fonctions et liens de session : affichés par la page elle-même (bas du rail de navigation).
