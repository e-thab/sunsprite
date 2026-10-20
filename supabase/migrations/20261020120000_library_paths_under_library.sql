-- The Library moved from public/images/<category>/<file> to src/library,
-- served at /library/... (see scripts/libraryPlugin.ts). Its paths are now
-- nested arbitrarily deep, cover sounds as well as images, and can contain
-- spaces (sounds/jingles/8 bit/...), none of which the original
-- /images/<category>/<file> check allows.
--
-- Old-shape paths stay valid: existing links still point at public/images,
-- which is kept for them. New ones must sit under /library/images or
-- /library/sounds, one plain name per segment. A segment can't start with a
-- dot, which rules out . and .. so a row still can't point outside the
-- Library.
alter table public.library_images
  drop constraint library_images_library_path_check;

alter table public.library_images
  add constraint library_images_library_path_check check (
    library_path ~ '^/images/[A-Za-z0-9_-]+/[A-Za-z0-9_.-]+$'
    or library_path ~ '^/library/(images|sounds)(/[A-Za-z0-9_-][A-Za-z0-9_. -]*)+$'
  );
