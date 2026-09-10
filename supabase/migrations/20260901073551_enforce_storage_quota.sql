-- Every scripts/text_files write lands here as the last gate before Postgres
-- actually commits new content — unlike images (whose real boundary is
-- r2-sign-upload/r2-confirm-upload's service-role-only insert path, see
-- 20260731200000_restrict_images_writes.sql), there is no edge function in
-- front of these two tables. A raw Data API insert/update with a valid JWT
-- was otherwise gated only by ordinary grants/RLS, neither of which says
-- anything about aggregate size. This closes that gap.
--
-- "Combined storage" means what it means everywhere else in this codebase:
-- scripts + text_files content in real bytes (Postgres `text` is stored
-- UTF-8-internally on every Supabase database, so octet_length() here is the
-- exact SQL equivalent of the client/edge-function side's
-- `new TextEncoder().encode(content).length`) plus images' own
-- already-byte-denominated `size` column.
--
-- project_cap/account_cap below are a hand-kept mirror of MAX_PROJECT_SIZE/
-- MAX_ACCOUNT_SIZE in supabase/functions/_shared/uploadLimits.ts. plpgsql
-- can't import a Deno/TS module, so unlike src/stores/projectStore.ts's own
-- re-export of that exact file, there is no single source of truth possible
-- across this boundary — if either constant ever changes, update both sides
-- by hand. Written as `10 * 1024 * 1024` / `25 * 1024 * 1024` rather than
-- the multiplied-out literal specifically so this stays trivially
-- eyeball-diffable against uploadLimits.ts's own identical expressions.

-- projects.owner_id has never had an index (Postgres doesn't auto-index a
-- referencing FK column) — harmless until now, but the account-wide check
-- below runs "every project this owner has" on every qualifying
-- scripts/text_files write site-wide, so this is what keeps that a narrow
-- lookup instead of a sequential scan over all of public.projects.
create index projects_owner_id_idx on public.projects (owner_id);

-- Shared by both tables' triggers below (scripts and text_files have
-- identical `content text` / `project_id uuid` columns, so one generic body
-- covers both) — same "one function, several tables" shape as
-- touch_project_on_script_change(). Deliberately NOT security definer: it
-- runs as the invoking `authenticated` role, so every select inside it is
-- naturally scoped by that role's own RLS policies — a user's own totals are
-- always fully visible to them (the "own projects/scripts/text_files/images"
-- policies are unconditional on ownership), and an attempted write into a
-- project the caller doesn't own is independently, unconditionally rejected
-- by that table's existing ownership-based WITH CHECK policy regardless of
-- what this function computes or decides.
create function public.enforce_storage_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  project_cap constant bigint := 10 * 1024 * 1024;
  account_cap constant bigint := 25 * 1024 * 1024;
  delta bigint;
  project_bytes bigint;
  account_owner_id uuid;
  owned_project_ids uuid[];
  account_bytes bigint;
begin
  -- How much bigger (or smaller/unchanged) this row's content is becoming.
  -- OLD is an unassigned record on INSERT — referencing OLD.anything at all
  -- in that case raises "record 'old' is not assigned yet" — hence the
  -- TG_OP guard rather than a bare NEW-minus-OLD.
  if TG_OP = 'UPDATE' then
    delta := octet_length(new.content) - octet_length(old.content);
  else
    delta := octet_length(new.content);
  end if;

  -- A write that only shrinks or leaves content the same size can never push
  -- either total higher than it already (rightly or wrongly) is, so renames,
  -- folder moves, position changes, and shrinking edits always go through
  -- unchecked — even on a project/account already over its cap for some
  -- unrelated reason (a since-lowered cap, rows predating this migration,
  -- etc). Also means neither aggregation below ever runs on the common case
  -- of a no-op or shrinking save.
  if delta <= 0 then
    return new;
  end if;

  -- Project-level total first — cheaper (one project_id-filtered scan per
  -- table; all three already indexed via each table's own
  -- unique(project_id, name) constraint) and the tighter cap, so the one
  -- most rejections will actually hit. Only pay for the account-wide
  -- cross-project join below if this passes.
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

  return new;
end;
$$;

create trigger enforce_storage_quota_on_script_write
  before insert or update on public.scripts
  for each row execute procedure public.enforce_storage_quota();

create trigger enforce_storage_quota_on_text_file_write
  before insert or update on public.text_files
  for each row execute procedure public.enforce_storage_quota();
