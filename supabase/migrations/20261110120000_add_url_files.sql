-- URL files: file-tree entries that point at an image or sound hosted on
-- another site. Like library_images they own no file data (no R2 object, no
-- size, nothing counted against storage quota), so they can be inserted
-- directly under ordinary RLS. They're a table of their own rather than rows in
-- library_images because that table's path check exists precisely so a row
-- there can never point outside the Library.
--
-- kind is stored rather than read off the URL: plenty of URLs don't end in a
-- file extension, so the user says which it is when adding one.
--
-- https only: the game fetches these with XHR from an https page, and a browser
-- blocks a plain-http request from one, so an http URL could never load.
create table public.url_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete cascade,
  name text not null,
  url text not null check (url ~ '^https://[^\s]+$' and char_length(url) <= 2048),
  kind text not null check (kind in ('image', 'audio')),
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

alter table public.url_files enable row level security;

create policy "Users can view url files in own projects"
  on public.url_files for select
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = url_files.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can create url files in own projects"
  on public.url_files for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects
      where projects.id = url_files.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can update url files in own projects"
  on public.url_files for update
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = url_files.project_id
      and projects.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = url_files.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can delete url files in own projects"
  on public.url_files for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = url_files.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

-- Same public-project read access as every other file table, so /play/:slug
-- can load these too.
create policy "Anyone can view url files in public projects"
  on public.url_files for select
  to public
  using (
    exists (
      select 1 from public.projects
      where projects.id = url_files.project_id
      and projects.is_public
    )
  );

grant select, insert, update, delete on public.url_files to authenticated;
grant select on public.url_files to anon;

create trigger set_url_files_updated_at
  before update on public.url_files
  for each row execute procedure public.set_updated_at();

create trigger touch_project_on_url_file_insert
  after insert on public.url_files
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_url_file_update
  after update on public.url_files
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_url_file_delete
  after delete on public.url_files
  for each row execute procedure public.touch_project_on_script_change();
