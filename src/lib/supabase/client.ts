import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { PLACEHOLDER_ANON_KEY, PLACEHOLDER_URL } from "./env";

/** Browser-side typed Supabase client (anon key + user session). */
export function createClient() {
  // Placeholder fallbacks keep construction from throwing during prerender
  // / before a hosted Supabase is configured. Real env is used when present.
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? PLACEHOLDER_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? PLACEHOLDER_ANON_KEY
  );
}
