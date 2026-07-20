import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { PLACEHOLDER_URL } from "./env";

/**
 * Service-role client — bypasses RLS. Server-only (webhooks, cron sweep,
 * core integration). NEVER import from client components.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? PLACEHOLDER_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-key",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
