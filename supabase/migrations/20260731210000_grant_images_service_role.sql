-- Same "no default privileges" gotcha as authenticated (see
-- grant_data_api_access.sql) bites service_role too: it's never been granted
-- anything on public.images, since every write used to go through the
-- authenticated-scoped client. r2-confirm-upload's service-role insert
-- (added to verify uploads server-side before creating the row) needs this
-- to actually reach the table — service_role bypasses RLS, not base grants.
grant select, insert, update, delete on public.images to service_role;
