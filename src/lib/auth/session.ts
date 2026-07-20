/**
 * Session + role helpers (server-side).
 * Roles are per-organisation (APP_RULES 1.3): owner | manager | desk.
 * A player is a user with no membership in the org running the event —
 * roles are contextual, so every check takes an org_id.
 */
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Role } from "@/lib/domain/enums";

/** Current auth user, or null. Cached per request. */
export const getUser = cache(async () => {
  // No hosted Supabase yet → treat everyone as signed-out so the site
  // still renders (landing, login, styleguide, builder).
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Redirects to /login when unauthenticated. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** The current user's profile row (name etc.), or null. Cached per request. */
export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, phone, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});

/** All org memberships for the current user (drives the org switcher). */
export const getMemberships = cache(async () => {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("id, org_id, role, organisations(id, name, slug, logo_url)")
    .eq("user_id", user.id);
  if (error) throw error;
  return data;
});

/** The user's role in one org, or null if they're a player there. */
export async function getOrgRole(orgId: string): Promise<Role | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.role ?? null;
}

/** Role gates. RLS is the real enforcement; these guard routes/UI. */
const ROLE_RANK: Record<Role, number> = { owner: 3, manager: 2, desk: 1 };

export async function requireOrgRole(orgId: string, minimum: Role = "desk") {
  const user = await requireUser();
  const role = await getOrgRole(orgId);
  if (!role || ROLE_RANK[role] < ROLE_RANK[minimum]) redirect("/");
  return { user, role };
}

export function canManage(role: Role | null): boolean {
  return role === "owner" || role === "manager";
}
