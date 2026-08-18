-- One row per comments-sheet open. Written on close (or pagehide) with
-- time_on_sheet_ms. Participant ingest uses the service-role Bun client.

create table evt_comments_open (
  event_id           uuid primary key,
  session_id         uuid not null references sessions(session_id),
  video_id           text not null references videos(video_id),
  video_type         video_type  not null,
  source_type        source_type not null,
  community          community   not null,
  timestamp_open     timestamptz not null,
  time_on_sheet_ms   integer     not null,
  server_received_at timestamptz not null default now()
);

create index evt_comments_open_session_id_idx on evt_comments_open (session_id);

alter table evt_comments_open enable row level security;

grant select, insert, update, delete on table evt_comments_open to service_role;
