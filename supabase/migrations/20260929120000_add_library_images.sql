-- Library images: file-tree entries that link to one of the built-in Library
-- assets (served from the site's own public/images/*) instead of an uploaded
-- R2 object. They sit in the tree exactly like an uploaded image — named,
-- foldered, positioned — but own no file data at all, so they're a separate
-- table rather than a nullable object_key on public.images:
--
-- - images rows can only be created by r2-confirm-upload's service-role
--   client (see 20260731200000_restrict_images_writes.sql), because their
--   size has to be verified against a real object. A library link has no
--   object and no size, so it can be inserted directly under ordinary RLS.
-- - Every storage-quota path (enforce_storage_quota(), storage_totals,
--   r2-sign-upload/r2-confirm-upload, projectStore's usage fetch) sums
--   images.size. Keeping links out of that table keeps them out of every
--   quota figure without touching any of those.
--
-- library_path is constrained to the /images/<category>/<file> shape
-- gameAssets.ts's imagePath() produces, so a row can never point somewhere
-- other than the Library itself (an arbitrary external URL, say).
create table public.library_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete cascade,
  name text not null,
  library_path text not null check (library_path ~ '^/images/[A-Za-z0-9_-]+/[A-Za-z0-9_.-]+$'),
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

alter table public.library_images enable row level security;

create policy "Users can view library images in own projects"
  on public.library_images for select
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = library_images.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can create library images in own projects"
  on public.library_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects
      where projects.id = library_images.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can update library images in own projects"
  on public.library_images for update
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = library_images.project_id
      and projects.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = library_images.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can delete library images in own projects"
  on public.library_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = library_images.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

-- Same public-project read access every other file table got in
-- 20260821173708_add_project_visibility.sql, so /play/:slug can load these too.
create policy "Anyone can view library images in public projects"
  on public.library_images for select
  to public
  using (
    exists (
      select 1 from public.projects
      where projects.id = library_images.project_id
      and projects.is_public
    )
  );

grant select, insert, update, delete on public.library_images to authenticated;
grant select on public.library_images to anon;

create trigger set_library_images_updated_at
  before update on public.library_images
  for each row execute procedure public.set_updated_at();

create trigger touch_project_on_library_image_insert
  after insert on public.library_images
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_library_image_update
  after update on public.library_images
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_library_image_delete
  after delete on public.library_images
  for each row execute procedure public.touch_project_on_script_change();
