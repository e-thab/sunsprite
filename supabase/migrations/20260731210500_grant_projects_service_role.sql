-- r2-confirm-upload's service-role insert into images fires
-- touch_project_on_image_insert, which updates the parent project's
-- updated_at. That trigger function isn't security definer, so it runs as
-- whichever role did the insert — service_role needs select/update on
-- projects for the same reason it needed grants on images itself.
grant select, update on public.projects to service_role;
