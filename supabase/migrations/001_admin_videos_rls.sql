-- Admin RLS for videos catalog. Run in Supabase SQL editor.
-- Participant APIs use service_role and bypass RLS.

alter table videos enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

drop policy if exists videos_admin_select on videos;
drop policy if exists videos_admin_insert on videos;
drop policy if exists videos_admin_update on videos;
drop policy if exists videos_admin_delete on videos;

create policy videos_admin_select on videos
  for select to authenticated
  using (public.is_admin());

create policy videos_admin_insert on videos
  for insert to authenticated
  with check (public.is_admin());

create policy videos_admin_update on videos
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy videos_admin_delete on videos
  for delete to authenticated
  using (public.is_admin());

-- Table-level grants required before RLS policies apply
grant usage on schema public to authenticated;
grant select, insert, update, delete on table videos to authenticated;
