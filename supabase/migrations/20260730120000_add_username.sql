-- Username login support: a unique, format-constrained username per profile,
-- plus narrowly-scoped lookup functions so sign-in can resolve a username to
-- an email while signed out, without ever exposing emails through a
-- normal client-queryable table/view.

alter table public.profiles
  add column username text unique
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$');

-- Set username atomically at signup (mirrors display_name below), so it's
-- populated even for accounts still pending email confirmation, when no
-- session exists yet for a follow-up client-side update.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (new.id, new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

-- Resolves a username to its account email for sign-in. Security definer so
-- it can read auth.users regardless of caller; deliberately returns null
-- (rather than raising) for a non-existent username so callers can produce
-- the same generic "invalid credentials" message used for a bad email,
-- without revealing whether the username exists.
create or replace function public.get_email_for_username(lookup_username text)
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select auth.users.email
  from auth.users
  join public.profiles on public.profiles.id = auth.users.id
  where public.profiles.username = lookup_username
  limit 1
$$;

revoke all on function public.get_email_for_username(text) from public;
grant execute on function public.get_email_for_username(text) to anon, authenticated;

-- Lightweight availability check for the sign-up form. Not the source of
-- truth (the unique constraint above is), just avoids surfacing the opaque
-- trigger-failure error GoTrue returns when handle_new_user()'s insert hits
-- a duplicate username.
create or replace function public.is_username_taken(check_username text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles where public.profiles.username = check_username
  )
$$;

revoke all on function public.is_username_taken(text) from public;
grant execute on function public.is_username_taken(text) to anon, authenticated;
