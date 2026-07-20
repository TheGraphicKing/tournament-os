import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/** Refreshes the auth session on every request (Supabase SSR pattern). */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  // Not configured yet (no hosted Supabase) → pass through so the site
  // still loads instead of 500-ing on every route.
  if (!isSupabaseConfigured()) return supabaseResponse;

  return refreshSession(request, supabaseResponse);
}

async function refreshSession(request: NextRequest, initial: NextResponse) {
  let supabaseResponse = initial;

  const supabase = createServerClient<Database>(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and getUser() — it can
  // cause random logouts (cookie sync).
  await supabase.auth.getUser();

  return supabaseResponse;
}
