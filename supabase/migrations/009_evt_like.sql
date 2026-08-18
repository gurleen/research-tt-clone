-- Behavioral like/unlike DV. Not a social graph — one row per toggle.
-- Participant ingest uses the service-role Bun client (bypasses RLS).

create table evt_like (
  event_id           uuid primary key,
  session_id         uuid not null references sessions(session_id),
  video_id           text not null references videos(video_id),
  video_type         video_type  not null,
  source_type        source_type not null,
  community          community   not null,
  liked              boolean     not null,
  "timestamp"        timestamptz not null,
  server_received_at timestamptz not null default now()
);

create index evt_like_session_id_idx on evt_like (session_id);

alter table evt_like enable row level security;

grant select, insert, update, delete on table evt_like to service_role;
