-- Resolves a project owner's username, but only when that owner has at
-- least one public project — lets /play/:slug (PlayView.vue) show "by
-- <username>" for a public project's creator without granting any broader
-- read access to public.profiles, which stays owner-only in RLS (see
-- 20260725055820_create_projects_schema.sql). Same reasoning as
-- get_email_for_username/is_username_taken in 20260730120000_add_username.sql:
-- never expose profiles rows wholesale through a client-queryable path.
create or replace function public.get_public_creator_username(creator_id uuid)
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select username
  from public.profiles
  where profiles.id = creator_id
  and exists (
    select 1 from public.projects
    where projects.owner_id = creator_id
    and projects.is_public
  )
  limit 1
$$;

revoke all on function public.get_public_creator_username(uuid) from public;
grant execute on function public.get_public_creator_username(uuid) to anon, authenticated;
