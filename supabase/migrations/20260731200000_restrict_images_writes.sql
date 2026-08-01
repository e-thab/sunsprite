-- images.size/content_type must reflect what r2-confirm-upload verified
-- against the real R2 object (via a HEAD request), not whatever a client
-- claims — otherwise a raw Data API call could report an arbitrary size and
-- silently defeat the per-project storage quota. Row creation now happens
-- only through r2-confirm-upload's service-role client (which re-checks
-- project ownership itself, since a service-role client bypasses RLS
-- entirely); rename/reparent/reorder stay directly client-writable.
revoke insert on public.images from authenticated;
revoke update on public.images from authenticated;
grant update (name, folder_id, position) on public.images to authenticated;
