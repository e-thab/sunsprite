-- Short, memorable, URL-facing slug for projects (e.g. "sparkly-brave-otter"),
-- generated client-side. The uuid id column remains the real primary key and
-- FK target for scripts/folders; this is purely a second unique lookup key
-- for routing.

alter table public.projects add column slug text;

-- Backfill existing rows with a simple, non-pretty fallback so the NOT NULL
-- constraint below can apply; new rows going forward get a real word-based
-- slug from the app.
update public.projects set slug = 'project-' || substr(id::text, 1, 8) where slug is null;

alter table public.projects alter column slug set not null;
alter table public.projects add constraint projects_slug_key unique (slug);
alter table public.projects add constraint projects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
