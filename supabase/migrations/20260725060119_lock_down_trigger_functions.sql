-- Postgres grants EXECUTE to PUBLIC by default on new functions, which makes
-- these SECURITY DEFINER / trigger-only functions publicly callable via the
-- Data API RPC endpoint. They are only meant to run as triggers, so revoke
-- direct execute access from anon/authenticated (and PUBLIC generally).
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;
