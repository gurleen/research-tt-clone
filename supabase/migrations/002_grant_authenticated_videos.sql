-- Run if you already applied 001_admin_videos_rls.sql without the GRANT lines.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table videos to authenticated;
