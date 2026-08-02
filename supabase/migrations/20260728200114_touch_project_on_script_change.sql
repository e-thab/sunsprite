-- Bumps a project's updated_at whenever one of its scripts is created,
-- edited, or deleted, so "most recently modified" reflects actual content
-- changes rather than only project-level renames.
create function public.touch_project_on_script_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.projects
  set updated_at = now()
  where id = coalesce(new.project_id, old.project_id);
  return coalesce(new, old);
end;
$$;

create trigger touch_project_on_script_insert
  after insert on public.scripts
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_script_update
  after update on public.scripts
  for each row execute procedure public.touch_project_on_script_change();

create trigger touch_project_on_script_delete
  after delete on public.scripts
  for each row execute procedure public.touch_project_on_script_change();
