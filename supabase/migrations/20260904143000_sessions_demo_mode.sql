-- Reusable presentation sessions. Completing the playlist does not consume
-- the link. Default false so existing study sessions stay one-complete-use.

alter table sessions
  add column demo_mode boolean not null default false;

comment on column sessions.demo_mode is
  'When true, the session link stays reusable after playlist complete for demos and walkthroughs.';
