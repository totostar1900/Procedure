import type { SupabaseClient } from "@supabase/supabase-js";

// Documents mis à la disposition d'un membre à accès « employé » : ceux que l'administrateur lui a désignés,
// à lire et attester (lectures/<doc>.ids ou « tous ») ou en consultation seule (lectures/<doc>.consult).
export async function profilAcces(sb: SupabaseClient) {
  const { data: { user } } = await sb.auth.getUser();
  const { data: employe } = await sb.rpc("est_employe");
  if (!user || !employe) return { employe: false as const, docs: null as Set<string> | null };
  const ids = [user.id, "email:" + (user.email || "").toLowerCase()];
  const { data } = await sb.from("kv").select("path,data").like("path", "lectures/%");
  const docs = new Set<string>();
  for (const r of data || []) {
    const L = (r.data || {}) as { ids?: string[]; consult?: string[]; tous?: boolean };
    const mine = (a?: string[]) => (a || []).some((x) => ids.includes(x));
    if (L.tous || mine(L.ids) || mine(L.consult)) docs.add(String(r.path).slice("lectures/".length));
  }
  return { employe: true as const, docs };
}

// Un fichier (PDF, Word) appartient-il à l'un des documents autorisés ? PC-XXX-001_v1.0.pdf, PC-XXX-001-A1_v1.0.pdf…
export const fichierAutorise = (nom: string, docs: Set<string>) => [...docs].some((id) => nom.startsWith(id + "_") || nom.startsWith(id + "-"));
