-- Profiles: one row per auth user, auto-created on signup.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Auto-insert a profile row whenever a new auth user is created.
-- security definer is required here: the inserting role otherwise can't get
-- past RLS on first signup. Pinned search_path per Supabase hardening guidance.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Projects: owned by a single user.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can create own projects"
  on public.projects for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Users can update own projects"
  on public.projects for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users can delete own projects"
  on public.projects for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- Scripts: multiple per project, ownership resolved through the parent project.
create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

alter table public.scripts enable row level security;

create policy "Users can view scripts in own projects"
  on public.scripts for select
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = scripts.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can create scripts in own projects"
  on public.scripts for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects
      where projects.id = scripts.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can update scripts in own projects"
  on public.scripts for update
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = scripts.project_id
      and projects.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = scripts.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

create policy "Users can delete scripts in own projects"
  on public.scripts for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = scripts.project_id
      and projects.owner_id = (select auth.uid())
    )
  );

-- Shared updated_at maintenance trigger.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

create trigger set_scripts_updated_at
  before update on public.scripts
  for each row execute procedure public.set_updated_at();
