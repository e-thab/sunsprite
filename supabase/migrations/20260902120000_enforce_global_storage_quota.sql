-- Backstop one tier above enforce_storage_quota() (see
-- 20260901073551_enforce_storage_quota.sql): that migration caps what a
-- single account can use, but says nothing about the *platform-wide* total
-- across every account — which is what actually determines whether this
-- project stays inside Supabase's free 500MB database / Cloudflare R2's free
-- 10GB storage tier or starts incurring real charges. This adds that check.
--
-- A live, exactly-consistent global counter would mean triggers on every
-- insert/update/delete across scripts/text_files/images (including cascade
-- deletes from project/account removal) — more moving parts, more ways for
-- the counter to silently drift from reality. Instead this keeps a cached
-- snapshot (storage_totals, refreshed every 5 minutes by pg_cron below) and
-- checks writes against that. Briefly stale, never wrong for long, and the
-- 90%-of-real-ceiling caps below leave headroom for both that staleness and
-- for Postgres-side overhead (indexes/TOAST/other tables/WAL) that this
-- query's own SUMs don't account for.
--
-- global_db_cap/global_r2_cap are a hand-kept mirror of GLOBAL_DB_SIZE/
-- GLOBAL_R2_SIZE in supabase/functions/_shared/uploadLimits.ts, same
-- unavoidable-duplication reason as project_cap/account_cap in
-- enforce_storage_quota() — plpgsql can't import a Deno/TS module.

create extension if not exists pg_cron with schema extensions;

-- Singleton table: `id boolean primary key default true` plus the check
-- means a second row can never be inserted (there are only two boolean
-- values, and the check rules out `false`), so `where id = true` always
-- means "the one row."
create table public.storage_totals (
  id boolean primary key default true,
  db_bytes bigint not null default 0,
  r2_bytes bigint not null default 0,
  computed_at timestamptz not null default now(),
  constraint storage_totals_singleton check (id)
);

-- Seed it from the real current totals rather than starting at 0 — a cold 0
-- would let writes through unchecked against the global cap until the first
-- cron tick fixes it up to 5 minutes later.
insert into public.storage_totals (id, db_bytes, r2_bytes, computed_at)
select
  true,
  coalesce((select sum(octet_length(content)) from public.scripts), 0)
    + coalesce((select sum(octet_length(content)) from public.text_files), 0),
  coalesce((select sum(size) from public.images), 0),
  now();

-- Every account's own writes are already gated by project/account caps far
-- below this table's grain, so exposing the platform-wide total to
-- authenticated is not a meaningfully sensitive disclosure — and reading it
-- directly (rather than through an RPC) is what lets enforce_storage_quota()
-- below read it while still running as the invoking role, same as every
-- other select it already makes. RLS enabled (matching every other public
-- table in this schema) with a single unconditional-select policy, rather
-- than leaving RLS off — there's only ever one row and grant already limits
-- this to select-only, but an ungated public table is exactly what this
-- project's own security-review conventions flag.
alter table public.storage_totals enable row level security;

create policy "storage_totals_select_authenticated"
  on public.storage_totals
  for select
  to authenticated
  using (true);

grant select on public.storage_totals to authenticated;

-- security definer (unlike enforce_storage_quota() itself): this runs on a
-- schedule as whatever role owns the cron job, not as a particular request's
-- authenticated user, so it needs its own privileges to read across every
-- account's rows rather than being scoped by anyone's RLS.
create function public.refresh_storage_totals()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.storage_totals
  set
    db_bytes = coalesce((select sum(octet_length(content)) from public.scripts), 0)
             + coalesce((select sum(octet_length(content)) from public.text_files), 0),
    r2_bytes = coalesce((select sum(size) from public.images), 0),
    computed_at = now()
  where id = true;
end;
$$;

-- Not meant to be called directly (see lock_down_trigger_functions.sql for
-- the same reasoning applied to other internal functions) — only cron.schedule
-- below should ever invoke it.
revoke execute on function public.refresh_storage_totals() from public;

select cron.schedule(
  'refresh-storage-totals',
  '*/5 * * * *',
  $$select public.refresh_storage_totals();$$
);

-- Adds the global check to the existing scripts/text_files trigger function.
-- Project and account checks (unchanged, still run first — they're the
-- checks almost every write will actually hit) stay exactly as they were;
-- this only adds one more check afterward, using the cached snapshot above
-- instead of an aggregate query, since summing *every* scripts/text_files
-- row platform-wide on every single write would be a full-table scan on the
-- hot path rather than the one cheap indexed/project-scoped scan the
-- existing checks do.
create or replace function public.enforce_storage_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  project_cap constant bigint := 10 * 1024 * 1024;
  account_cap constant bigint := 25 * 1024 * 1024;
  global_db_cap constant bigint := 450 * 1024 * 1024; -- 90% of Supabase free tier's 500MB database
  delta bigint;
  project_bytes bigint;
  account_owner_id uuid;
  owned_project_ids uuid[];
  account_bytes bigint;
  global_db_bytes bigint;
begin
  if TG_OP = 'UPDATE' then
    delta := octet_length(new.content) - octet_length(old.content);
  else
    delta := octet_length(new.content);
  end if;

  if delta <= 0 then
    return new;
  end if;

  select coalesce(sum(bytes), 0) into project_bytes
  from (
    select octet_length(content)::bigint as bytes from public.scripts where project_id = new.project_id
    union all
    select octet_length(content)::bigint as bytes from public.text_files where project_id = new.project_id
    union all
    select size as bytes from public.images where project_id = new.project_id
  ) project_rows;

  if project_bytes + delta > project_cap then
    raise exception 'This project has reached its %MB storage limit', project_cap / 1024 / 1024;
  end if;

  select owner_id into account_owner_id from public.projects where id = new.project_id;
  select coalesce(array_agg(id), '{}') into owned_project_ids from public.projects where owner_id = account_owner_id;

  select coalesce(sum(bytes), 0) into account_bytes
  from (
    select octet_length(content)::bigint as bytes from public.scripts where project_id = any(owned_project_ids)
    union all
    select octet_length(content)::bigint as bytes from public.text_files where project_id = any(owned_project_ids)
    union all
    select size as bytes from public.images where project_id = any(owned_project_ids)
  ) account_rows;

  if account_bytes + delta > account_cap then
    raise exception 'Your account has reached its %MB storage limit across all projects', account_cap / 1024 / 1024;
  end if;

  select db_bytes into global_db_bytes from public.storage_totals where id = true;

  if global_db_bytes + delta > global_db_cap then
    raise exception 'Sunsprite has hit its overall storage limit right now — please try again later';
  end if;

  return new;
end;
$$;
