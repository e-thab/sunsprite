-- Projects gain a public/private visibility flag, private by default. A
-- public project's data (but never another user's private one) becomes
-- readable by anyone, signed in or not, so the /play/:slug route can load
-- and run it without an account. Editing (/edit/:slug) stays owner-only
-- regardless of this flag — that's enforced at the application layer, since
-- RLS can't tell "reading in order to play" apart from "reading in order to
-- edit" the same rows; it can only gate the rows themselves.
alter table public.projects add column is_public boolean not null default false;

-- Additional, permissive policies — RLS OR's every matching policy together,
-- so these sit alongside the existing owner-only ones (see
-- 20260725055820_create_projects_schema.sql and friends) without changing
-- them. `to public` (every Postgres role) rather than `to authenticated`,
-- since an anonymous guest playing a public project needs the same read
-- access as a signed-in non-owner doing the same thing.
create policy "Anyone can view public projects"
  on public.projects for select
  to public
  using (is_public);

create policy "Anyone can view scripts in public projects"
  on public.scripts for select
  to public
  using (
    exists (
      select 1 from public.projects
      where projects.id = scripts.project_id
      and projects.is_public
    )
  );

create policy "Anyone can view folders in public projects"
  on public.folders for select
  to public
  using (
    exists (
      select 1 from public.projects
      where projects.id = folders.project_id
      and projects.is_public
    )
  );

create policy "Anyone can view images in public projects"
  on public.images for select
  to public
  using (
    exists (
      select 1 from public.projects
      where projects.id = images.project_id
      and projects.is_public
    )
  );

create policy "Anyone can view text files in public projects"
  on public.text_files for select
  to public
  using (
    exists (
      select 1 from public.projects
      where projects.id = text_files.project_id
      and projects.is_public
    )
  );

-- The Data API rejects a request before RLS is even evaluated without a
-- matching grant (see 20260725060256_grant_data_api_access.sql) — these
-- tables have only ever granted `authenticated`. `anon` (guests) needs the
-- same read-only grant now that the policies above let it legitimately reach
-- these rows. Deliberately select-only: none of the write policies changed,
-- and anon was never granted insert/update/delete.
grant select on public.projects to anon;
grant select on public.scripts to anon;
grant select on public.folders to anon;
grant select on public.images to anon;
grant select on public.text_files to anon;
