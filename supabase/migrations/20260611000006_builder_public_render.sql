-- ════════════════════════════════════════════════════════════════════
-- Public render access for generated landing pages. A published landing
-- page is meant to be public, so expose the brief (only) by id, without
-- the edit_token. Editing still requires the token (builder_save_brief).
-- ════════════════════════════════════════════════════════════════════
create function public.builder_render_brief(p_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select brief from builder_briefs where id = p_id;
$$;

grant execute on function public.builder_render_brief(uuid) to anon, authenticated;
