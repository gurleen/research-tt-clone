-- Global platform settings (survey URL, debrief copy). Admin update-only; rows pre-seeded.

create table platform_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

insert into platform_settings (key, value) values
  (
    'survey_url',
    'https://survey.example.com?session_id={session_id}'
  ),
  ('debrief_title', 'Study Debrief'),
  (
    'debrief_body',
    'Thank you for participating. Your responses did not alter the content shown.'
  ),
  (
    'debrief_withdrawal',
    'To withdraw your data, contact the research team at research@example.com.'
  ),
  ('debrief_contact', 'research@example.com');

alter table platform_settings enable row level security;

drop policy if exists platform_settings_admin_select on platform_settings;
drop policy if exists platform_settings_admin_update on platform_settings;

create policy platform_settings_admin_select on platform_settings
  for select to authenticated
  using (public.is_admin());

create policy platform_settings_admin_update on platform_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, update on table platform_settings to authenticated;
grant all on table platform_settings to service_role;
