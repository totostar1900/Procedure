import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Toute la page et tous les fichiers sont réservés aux personnes connectées par Microsoft 365
// ET activées par l'administrateur (table membres, actif = vrai).
const LIBRE = [/^\/connexion/, /^\/auth\//, /^\/_next\//, /^\/favicon/, /^\/shim\.js$/];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const p = req.nextUrl.pathname;
  if (LIBRE.some((r) => r.test(p))) return res;
  const vers = (q: string) => { const u = req.nextUrl.clone(); u.pathname = "/connexion"; u.search = q; return NextResponse.redirect(u); };
  if (!user) return vers("");
  const { data: actif } = await supabase.rpc("est_actif");
  if (!actif) return vers("?refus=1");
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
