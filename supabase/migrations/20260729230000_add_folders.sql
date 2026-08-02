-- Folders: hierarchical containers for a project's scripts. Ownership is
-- resolved through the parent project, same pattern as scripts. A folder's
-- parent_id is null for a top-level folder.
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  parent_id uuid references public.folders (id) on delete cascade,
  name text not null,
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.folders enable row level security;

create policy "Users can view folders in own projects"
  on public.folders for select
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = folders.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can create folders in own projects"
  on public.folders for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects
      where projects.id = folders.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can update folders in own projects"
  on public.folders for update
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = folders.project_id
      and projects.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = folders.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can delete folders in own projects"
  on public.folders for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = folders.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.folders to authenticated;

create trigger set_folders_updated_at
  before update on public.folders
  for each row execute procedure public.set_updated_at();

-- Reuses the existing script trigger's function: it already just bumps the
-- parent project's updated_at off whichever row (new or old) carries
-- project_id, which folders also have.
create trigger touch_project_on_folder_insert
  after insert on public.folders
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_folder_update
  after update on public.folders
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_folder_delete
  after delete on public.folders
  for each row execute procedure public.touch_project_on_script_change();

-- Scripts gain folder membership (null = project root) and a manual sort
-- position, so the tree can be freely reordered/reparented via drag-drop.
alter table public.scripts add column folder_id uuid references public.folders (id) on delete cascade;
alter table public.scripts add column position double precision not null default 0;
