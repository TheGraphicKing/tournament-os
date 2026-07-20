/**
 * Supabase env presence check. Until a hosted Supabase project is wired up
 * (URL + anon key in Vercel), the app must still boot: the middleware
 * no-ops and Supabase-backed pages show a friendly "not configured" state
 * instead of crashing the whole site. Never publish an unusable app.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Non-throwing placeholders so clients can be constructed pre-config. */
export const PLACEHOLDER_URL = "https://placeholder.supabase.co";
export const PLACEHOLDER_ANON_KEY = "placeholder-anon-key";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
