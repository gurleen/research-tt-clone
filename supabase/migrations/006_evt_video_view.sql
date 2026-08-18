-- Per-visit dwell / playback for engagement after free scroll.
-- Participant ingest uses the service-role Bun client (bypasses RLS).

create table evt_video_view (
  event_id           uuid primary key,
  session_id         uuid not null references sessions(session_id),
  video_id           text not null references videos(video_id),
  video_type         video_type  not null,
  source_type        source_type not null,
  community          community   not null,
  visit_index        integer     not null check (visit_index >= 1),
  started_at         timestamptz not null,
  ended_at           timestamptz not null,
  dwell_ms           integer     not null check (dwell_ms >= 0),
  playback_ms        integer     not null check (playback_ms >= 0),
  max_progress       double precision not null,
  loop_count         integer     not null check (loop_count >= 0),
  ended_reason       text        not null check (
    ended_reason in ('swipe', 'hidden', 'pagehide', 'playlist_complete')
  ),
  server_received_at timestamptz not null default now()
);

create index evt_video_view_session_id_idx on evt_video_view (session_id);

alter table evt_video_view enable row level security;
