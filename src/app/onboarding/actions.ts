"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOrgSchema, profileNameSchema } from "@/lib/domain/schemas";
import { slugify } from "@/lib/slug";

type ActionResult = { ok: true } | { ok: false; error: string };

/** O1 — persist the user's name on their profile. */
export async function saveProfileName(input: unknown): Promise<ActionResult> {
  const parsed = profileNameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("users")
    .update({ name: parsed.data.name })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

/**
 * O2 — create the organisation + owner membership atomically via the
 * create_organisation RPC (slug is auto-generated and deduped server-side).
 * The logo is uploaded client-side to the org-logos bucket; we receive the
 * public URL here.
 */
export async function createOrganisation(
  input: unknown
): Promise<ActionResult & { slug?: string }> {
  const parsed = createOrgSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase.rpc("create_organisation", {
    org_name: parsed.data.name,
    org_slug: slugify(parsed.data.name),
    org_city: parsed.data.city ?? null,
    org_logo_url: parsed.data.logo_url ?? null,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true, slug: data?.slug };
}

/** Convenience server action used by the wizard's final redirect. */
export async function finishOnboarding() {
  redirect("/dashboard");
}
