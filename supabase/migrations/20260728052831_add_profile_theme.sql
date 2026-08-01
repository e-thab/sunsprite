-- Signed-in users' theme preference. Free-form text (no enum constraint)
-- so adding a new theme id later doesn't require a migration; the app
-- falls back to the default theme if the stored value is unrecognized.
alter table public.profiles add column theme text;
