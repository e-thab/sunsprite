-- Which permanent API version tier (see src/assets/api/versions/ and
-- docs/plans/api-versioning.md) a project's code runs against — an "X.Y"
-- string naming one of that folder's snapshot directories verbatim (e.g.
-- "1.0"). There is no persisted third digit: this project's versioning
-- policy treats X.Y as the only user-visible/selectable tier, and a
-- bugfix-level change re-cuts that same X.Y snapshot in place rather than
-- becoming a separately selectable version — see the doc above for the
-- full policy. Set once at project creation to whatever the current latest
-- tier is (src/assets/api/versions/index.ts's latestApiVersion()) and left
-- alone until the user explicitly picks a different one via CodeEditor.vue's
-- dropdown, which writes through immediately (projectStore.ts's
-- setApiVersion) rather than requiring a separate save step.
alter table public.projects add column api_version text;

-- Backfill existing rows to the latest tier as of this migration — same
-- rationale as slug's backfill (20260730140000_add_project_slug.sql): these
-- projects predate the column and have only ever run "latest" so far, and
-- "1.0" is that latest tier right now. Unlike slug's backfill this isn't
-- derivable from the row itself (which permanent version is newest is an
-- application-level fact, not a database one), so it's a plain literal —
-- fine for a one-time historical backfill, not meant to track the tier
-- going forward.
update public.projects set api_version = '1.0' where api_version is null;

alter table public.projects alter column api_version set not null;
alter table public.projects add constraint projects_api_version_format check (api_version ~ '^[0-9]+\.[0-9]+$');
