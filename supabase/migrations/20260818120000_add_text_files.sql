-- Text files: plain-text leaf nodes in a project's file tree, alongside
-- scripts and images. Structurally the same as scripts (inline content,
-- same folder/position tree membership) but a separate table rather than a
-- shared "kind" column: they're never executed or import()-able, don't count
-- toward "a project always has at least one script", and keeping them out of
-- the scripts table means no call site that assumes scripts.* means
-- runnable JS has to remember to filter them out.
create table public.text_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete cascade,
  name text not null,
  content text not null default '',
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name),
  -- Soft guardrail matching the client's upload size cap — content lives
  -- inline in the row (no R2 object backing it), so this is the only limit.
  check (char_length(content) <= 1000000)
);

alter table public.text_files enable row level security;

create policy "Users can view text files in own projects"
  on public.text_files for select
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = text_files.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can create text files in own projects"
  on public.text_files for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects
      where projects.id = text_files.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can update text files in own projects"
  on public.text_files for update
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = text_files.project_id
      and projects.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = text_files.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can delete text files in own projects"
  on public.text_files for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = text_files.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.text_files to authenticated;

create trigger set_text_files_updated_at
  before update on public.text_files
  for each row execute procedure public.set_updated_at();

-- Reuses the same trigger function scripts/folders/images already do: it
-- just bumps the parent project's updated_at off whichever row (new or old)
-- carries project_id, which text_files also has.
create trigger touch_project_on_text_file_insert
  after insert on public.text_files
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_text_file_update
  after update on public.text_files
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_text_file_delete
  after delete on public.text_files
  for each row execute procedure public.touch_project_on_script_change();
