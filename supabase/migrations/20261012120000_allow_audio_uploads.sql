-- Audio uploads share public.images rather than getting a table of their own.
-- An uploaded sound is the same thing as an uploaded image as far as storage
-- goes — an R2 object with a verified size and content type, named, foldered,
-- positioned — and every storage-quota path (enforce_storage_quota(),
-- refresh_storage_totals(), r2-sign-upload/r2-confirm-upload, projectStore's
-- usage fetch) already sums images.size. A separate audio table would have
-- meant teaching every one of those about it; widening the content-type check
-- is the whole change. It also keeps one unique(project_id, name) across both,
-- which is what the game runtime needs: a file's name is its asset key there.
--
-- The client tells the two apart by content type. Mirrors ALLOWED_CONTENT_TYPES
-- in supabase/functions/_shared/uploadLimits.ts (the real gate — this check is
-- the same defense-in-depth backstop the original one was).
--
-- `images_content_type_check` is the name Postgres generated for the inline
-- column check in 20260730150000_add_images.sql.
alter table public.images drop constraint images_content_type_check;

alter table public.images add constraint images_content_type_check check (content_type in (
  'image/png', 'image/jpeg', 'image/svg+xml', 'image/webp',
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4'
));
