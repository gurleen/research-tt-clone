-- 006 created evt_video_view with RLS but without DML grants for service_role.
-- Other evt_* tables already have SELECT/INSERT/UPDATE/DELETE; without them
-- POST /api/events (video_view) and GET /api/admin/sessions/:id/summary 500.

grant select, insert, update, delete on table evt_video_view to service_role;
