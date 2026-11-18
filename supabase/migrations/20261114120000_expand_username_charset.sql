-- Allow hyphens and periods in usernames alongside lowercase letters, digits,
-- and underscores. Still no '@', which sign-in relies on to tell a username
-- apart from an email. Every existing username already satisfies the wider
-- pattern, so the swap needs no data migration.

alter table public.profiles
  drop constraint profiles_username_format,
  add constraint profiles_username_format check (username ~ '^[a-z0-9_.-]{3,20}$');
