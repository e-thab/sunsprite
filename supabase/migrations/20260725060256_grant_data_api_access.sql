-- These tables have no default privileges yet, so the Data API rejects all
-- requests before RLS is even evaluated. Grant only what each table's
-- policies actually support, and only to the authenticated role — none of
-- this data is meant to be reachable anonymously.
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.scripts to authenticated;
