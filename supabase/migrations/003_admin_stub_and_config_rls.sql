-- Admin RLS for stub_content and experiment_config (update-only; rows pre-seeded).

alter table stub_content enable row level security;
alter table experiment_config enable row level security;

drop policy if exists stub_content_admin_select on stub_content;
drop policy if exists stub_content_admin_update on stub_content;
drop policy if exists experiment_config_admin_select on experiment_config;
drop policy if exists experiment_config_admin_update on experiment_config;

create policy stub_content_admin_select on stub_content
  for select to authenticated
  using (public.is_admin());

create policy stub_content_admin_update on stub_content
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy experiment_config_admin_select on experiment_config
  for select to authenticated
  using (public.is_admin());

create policy experiment_config_admin_update on experiment_config
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, update on table stub_content to authenticated;
grant select, update on table experiment_config to authenticated;
