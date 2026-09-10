-- 20260902120000_enforce_global_storage_quota.sql granted SELECT on
-- storage_totals to `authenticated` only — needed for enforce_storage_quota()
-- to read it while running as the invoking user's own role, same as every
-- other select that trigger makes. But `service_role` isn't a superuser: its
-- bypassrls attribute skips RLS checks, not ordinary table grants, so a
-- service-role client (scripts/storage-usage.ts) got a bare "permission
-- denied for table storage_totals" until this.
grant select on public.storage_totals to service_role;
