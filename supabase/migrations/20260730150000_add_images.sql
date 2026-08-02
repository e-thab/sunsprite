-- Uploaded images: R2-backed leaf nodes in a project's file tree, alongside
-- scripts and folders. object_key is the R2 key (never derivable from other
-- columns); content_type/size are validated authoritatively by the
-- r2-sign-upload edge function before it ever signs an upload URL — these
-- column checks are just a defense-in-depth backstop.
create table public.images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete cascade,
  name text not null,
  object_key text not null unique,
  content_type text not null check (content_type in ('image/png', 'image/jpeg', 'image/svg+xml', 'image/webp')),
  size bigint not null check (size > 0 and size <= 10485760),
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

alter table public.images enable row level security;

create policy "Users can view images in own projects"
  on public.images for select
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = images.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can create images in own projects"
  on public.images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects
      where projects.id = images.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can update images in own projects"
  on public.images for update
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = images.project_id
      and projects.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = images.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can delete images in own projects"
  on public.images for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = images.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.images to authenticated;

create trigger set_images_updated_at
  before update on public.images
  for each row execute procedure public.set_updated_at();

create trigger touch_project_on_image_insert
  after insert on public.images
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_image_update
  after update on public.images
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_image_delete
  after delete on public.images
  for each row execute procedure public.touch_project_on_script_change();
