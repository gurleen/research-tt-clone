# Experiment Platform — Data Model & API Design

Backing store for the TikTok-style diaspora mobilization study. Your web app
renders the feed; this layer assigns conditions, serves the per-session
playlist, and logs the behavioral events in Section 8 of the checklist.

PostgreSQL throughout. Timestamps are `timestamptz` stored UTC; latencies and
durations are integer milliseconds.

---

## Design principles (where the CRITICAL rules live)

The integrity rules can't be frontend promises — a refresh, a tampered request,
or a retry on a flaky mobile connection would break them. They're enforced at
the layer that can actually guarantee them:

- **Condition is server-assigned and immutable.** Randomization happens in
  `POST /api/sessions`; an `UPDATE` trigger rejects any change to `source_type`
  or `community`. Refresh/reconnect re-reads the existing row, never re-rolls.
- **No PII, ever.** There are no `ip`, `geo`, or `cint_id` columns anywhere.
  IP stripping is middleware that runs before body parsing and logging, so the
  address never reaches application code. `sessions.external_id` is an anonymous
  Qualtrics ResponseID join token, not a Cint panel ID.
- **The client never supplies condition fields.** Requests send `session_id`,
  `video_id`, and timing only. The server fills `source_type`, `community`, and
  `video_type` from the session/video rows. A participant can't spoof their own
  condition, and the denormalized copies on each event are always correct.
- **Non-adaptive playlist.** The realized order and the prompt subset are
  computed once at session creation and persisted in `session_videos`. No
  endpoint reorders or re-composes based on responses. Responses are logged and
  ignored by the controller.
- **Idempotent logging.** Every event carries a client-generated `event_id`
  (UUID). Writes are `ON CONFLICT (event_id) DO NOTHING`, so a reconnect that
  replays queued events can't double-log.

---

## Enums

```sql
create type source_type as enum ('micro_influencer', 'institutional', 'control');
create type community   as enum ('armenian', 'sikh', 'iranian');
create type video_type  as enum ('ingroup', 'filler', 'control');
```

## Reference tables (stimulus catalog)

```sql
-- Every video the platform can serve. Ingroup videos are community- and
-- treatment-specific; filler and control videos are shared (no community).
create table videos (
  video_id     text primary key,           -- stable slug, e.g. 'ingroup_sikh_micro_03'
  video_type   video_type not null,
  community    community,                   -- set for ingroup, null for filler/control
  source_type  source_type,                 -- set for ingroup, null for filler/control
  media_url    text not null,
  duration_ms  integer,                     -- optional; lets the server sanity-check videoEnded

  -- attribution overlay shown on every video (thumbnail, name, handle)
  account_name          text not null,
  account_handle        text not null,
  profile_thumbnail_url text not null,

  -- feed chrome (researcher-authored; like_count is a display baseline)
  caption         text not null default '',
  like_count      integer not null default 0,
  comment_count   integer not null default 0,
  follower_count  integer not null default 0,
  share_count     integer not null default 0,
  save_count      integer not null default 0,
  comments        jsonb not null default '[]',  -- [{ username, text, timestamp? }]

  central_issue text,                       -- metadata for ingroup videos
  created_at    timestamptz not null default now(),

  constraint video_type_fields check (
    (video_type = 'ingroup' and community is not null
      and source_type in ('micro_influencer', 'institutional'))
    or (video_type = 'filler' and community is null and source_type is null)
    or (video_type = 'control' and community is null and source_type is null)
  )
);

-- The constant issue-information body, one per community (Ellen-supplied;
-- text not finalized yet, so body is nullable and seeded later). The stub's
-- attribution header is pulled from the ingroup video's source, so body is
-- constant within a community and only attribution varies — the required invariant.
create table stub_content (
  community  community primary key,
  body       text,                            -- null until Ellen provides the copy
  updated_at timestamptz not null default now()
);

-- Researcher-tunable knobs per community. The playlist composer reads this at
-- session creation. Counts may be a fixed value or a [min,max] range to vary
-- per participant; prompt placement is the configurable rule from Section 4.
create table experiment_config (
  community            community primary key,
  ingroup_count_min    integer not null,      -- set min = max for a fixed count
  ingroup_count_max    integer not null,
  filler_count_min     integer not null,
  filler_count_max     integer not null,
  prompt_probability   numeric not null default 0.45,  -- chance each pool item carries a prompt
  prompt_min_spacing   integer not null default 1,     -- min same-pool videos between two prompts
  updated_at           timestamptz not null default now(),
  constraint sane_counts check (
    ingroup_count_min <= ingroup_count_max
    and filler_count_min <= filler_count_max
    and ingroup_count_min >= 0 and filler_count_min >= 0
  ),
  constraint sane_prob check (prompt_probability between 0 and 1)
);
```

## Session tables

```sql
create table sessions (
  session_id       uuid primary key default gen_random_uuid(),
  source_type      source_type not null,    -- immutable after insert (trigger below)
  community        community   not null,
  assigned_at      timestamptz not null default now(),
  current_position integer     not null default 0,   -- resume index; advances monotonically
  status           text        not null default 'in_progress'
    check (status in ('in_progress','playlist_complete','survey_complete','debriefed')),
  created_at       timestamptz not null default now(),
  external_id      text unique, -- Qualtrics ResponseID join token; nullable for staging test sessions
  demo_mode        boolean not null default false  -- reusable presentation link; skip one-complete-use
  -- deliberately NO ip / geo / cint_id columns
);

-- Lock the condition: any attempt to change source_type or community fails.
create or replace function lock_session_condition() returns trigger as $$
begin
  if new.source_type is distinct from old.source_type
     or new.community is distinct from old.community then
    raise exception 'session condition is immutable (session_id=%)', old.session_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_lock_session_condition
  before update on sessions
  for each row execute function lock_session_condition();

-- The realized, shuffled playlist for one session. Persisted so refresh/reconnect
-- replays the identical order, and so behavior can be tied to position in analysis.
create table session_videos (
  session_id           uuid    not null references sessions(session_id),
  position             integer not null,    -- 0-based order within the session
  video_id             text    not null references videos(video_id),
  show_interest_prompt boolean not null default false,  -- realized overlay subset (stimulus + filler)
  primary key (session_id, position),
  unique (session_id, video_id)
);
create index on session_videos (session_id);
```

## Event tables

One table per event, columns matching Section 8 exactly, so CSV/JSON export and
the data dictionary are a direct dump with no remapping. (`source_type`,
`community`, `video_type` are denormalized copies the server fills at write
time.) Each table carries `event_id` for idempotency and `server_received_at`
for audit; the experimentally meaningful clock is the named `timestamp_*` field.

```sql
-- Redundant with the sessions row today, but kept as its own table so you can
-- attach additional per-start data to it later without a migration.
create table evt_session_start (
  event_id           uuid primary key,
  session_id         uuid not null references sessions(session_id),
  source_type        source_type not null,
  community          community   not null,
  "timestamp"        timestamptz not null,
  server_received_at timestamptz not null default now()
);

create table evt_content_link_display (
  event_id           uuid primary key,
  session_id         uuid not null references sessions(session_id),
  video_id           text not null references videos(video_id),
  video_type         video_type  not null,
  source_type        source_type not null,
  community          community   not null,
  timestamp_display  timestamptz not null,
  server_received_at timestamptz not null default now()
);

create table evt_content_link_click (
  event_id           uuid primary key,
  session_id         uuid not null references sessions(session_id),
  video_id           text not null references videos(video_id),
  video_type         video_type  not null,
  source_type        source_type not null,
  community          community   not null,
  timestamp_click    timestamptz not null,
  latency_ms         integer     not null,  -- timestamp_click − badge timestamp_display
  server_received_at timestamptz not null default now()
);

create table evt_content_stub_exit (
  event_id           uuid primary key,
  session_id         uuid not null references sessions(session_id),
  video_id           text not null references videos(video_id),
  source_type        source_type not null,
  community          community   not null,
  timestamp_exit     timestamptz not null,
  time_on_stub_ms    integer     not null,
  server_received_at timestamptz not null default now()
);

create table evt_interest_prompt_display (
  event_id           uuid primary key,
  session_id         uuid not null references sessions(session_id),
  video_id           text not null references videos(video_id),
  video_type         video_type  not null,
  source_type        source_type not null,
  community          community   not null,
  timestamp_display  timestamptz not null,
  server_received_at timestamptz not null default now()
);

create table evt_interest_response (
  event_id           uuid primary key,
  session_id         uuid not null references sessions(session_id),
  video_id           text not null references videos(video_id),
  video_type         video_type  not null,
  source_type        source_type not null,
  community          community   not null,
  response           text        not null check (response in ('yes','no','maybe')),
  timestamp_response timestamptz not null,
  latency_ms         integer     not null,  -- timestamp_response − prompt timestamp_display
  server_received_at timestamptz not null default now()
);

-- One row per visit to a video (first view vs return vs rewatch).
create table evt_video_view (
  event_id           uuid primary key,
  session_id         uuid not null references sessions(session_id),
  video_id           text not null references videos(video_id),
  video_type         video_type  not null,
  source_type        source_type not null,
  community          community   not null,
  visit_index        integer     not null,
  started_at         timestamptz not null,
  ended_at           timestamptz not null,
  dwell_ms           integer     not null,
  playback_ms        integer     not null,
  max_progress       double precision not null,
  loop_count         integer     not null,
  ended_reason       text        not null,  -- swipe | hidden | pagehide | playlist_complete
  server_received_at timestamptz not null default now()
);

-- One row per like/unlike toggle (behavioral DV, not a social graph).
create table evt_like (
  event_id           uuid primary key,
  session_id         uuid not null references sessions(session_id),
  video_id           text not null references videos(video_id),
  video_type         video_type  not null,
  source_type        source_type not null,
  community          community   not null,
  liked              boolean     not null,  -- true = like, false = unlike
  "timestamp"        timestamptz not null,
  server_received_at timestamptz not null default now()
);

-- One row per comments-sheet open; written on close with time on sheet.
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

-- One per session; unique constraint makes completion idempotent.
create table evt_playlist_complete (
  event_id           uuid primary key,
  session_id         uuid not null unique references sessions(session_id),
  "timestamp"        timestamptz not null,
  server_received_at timestamptz not null default now()
);

create table evt_survey_complete (
  event_id           uuid primary key,
  session_id         uuid not null unique references sessions(session_id),
  "timestamp"        timestamptz not null,
  server_received_at timestamptz not null default now()
);

create index on evt_content_link_display    (session_id);
create index on evt_content_link_click      (session_id);
create index on evt_content_stub_exit       (session_id);
create index on evt_interest_prompt_display (session_id);
create index on evt_interest_response       (session_id);
create index on evt_video_view              (session_id);
create index on evt_like                    (session_id);
create index on evt_comments_open           (session_id);
```

## Deferred — Section 6 familiarity block (not built yet)

Section 6 is N/A pending the Cint/Qualtrics decision. Schema sketched here so
it drops in later without a migration scramble.

```sql
create table familiarity_accounts (
  account_id            text primary key,
  account_name          text not null,
  account_handle        text not null,
  profile_thumbnail_url text,
  is_stimulus           boolean not null,   -- true = real stimulus source, false = decoy
  community             community           -- arm this roster entry belongs to, if applicable
);

create table evt_familiarity_response (
  event_id           uuid primary key,
  session_id         uuid     not null references sessions(session_id),
  account_id         text     not null references familiarity_accounts(account_id),
  rating             smallint not null,     -- graded scale, e.g. 0–3
  position           integer  not null,     -- randomized roster position shown
  "timestamp"        timestamptz not null,
  server_received_at timestamptz not null default now()
);
```

---

## Resume / reconnect strategy

The session row holds `current_position`, a monotonic high-water mark bumped
only when the feed advances past the furthest reached index. Rewind is
client-only and must not PATCH a lower value. Per-visit dwell is logged as
`video_view` (`dwell_ms`, `playback_ms`, `visit_index`, `loop_count`). Playlist
complete is an explicit Continue control on the last slide, not `videoEnded`.
On refresh/reconnect the client does `GET /api/sessions/:id`, gets the same
condition, the same `session_videos` order, and `current_position`, and resumes
at furthest reached. No re-randomization, no new `session_start`.

---

## API outline

REST/JSON. IP-stripping middleware runs first on every route. Write endpoints
are idempotent on `event_id`.

### Session lifecycle

**`POST /api/sessions`** — initialize a participant.
- Input: `community` from the recruitment link param (e.g. `?community=sikh`)
  and optional `external_id` (Qualtrics ResponseID, typically `R_` +
  alphanumerics). Production requires `external_id` so bare `?community=`
  cannot mint sessions. Staging (`STAGING_MODE=true`) may omit it for
  `/admin/test-session`. Recruitment/Cint params are never persisted;
  `external_id` is the only recruitment token stored (anonymous join key).
- If `external_id` already exists and `status = in_progress`, restore that
  session (same condition and playlist, no re-roll). If status is
  `playlist_complete` / `survey_complete` / `debriefed`, return 409
  ("this link has already been used"). Demo sessions (`demo_mode=true`) skip
  this one-complete-use rule so the same feed link can be presented again.
- Server (new token): generate UUID → balanced randomization of `source_type`
  (block or stratified, per-community counters) → insert `sessions` → read
  `experiment_config` for the community → compose playlist (pick stimulus and
  filler counts within their configured ranges; treatment arms select ingroup
  matching `community`+`source_type`, the control arm selects shared
  `video_type=control`; shuffle interleaved with filler, apply the prompt
  rule from config) → insert `session_videos` → write `session_start`.
- Returns: `session_id`, `community`, and the ordered playlist. Each item:
  `{ position, video_id, video_type, media_url, duration_ms,
  attribution: { account_name, account_handle, profile_thumbnail_url },
  show_learn_more, show_interest_prompt }`.
  `source_type` is not surfaced as a label — it's implicit in which ingroup
  videos are served, so the UI can't accidentally reveal the condition.
  Survey handoff URLs may include `session_id`, `external_id`, and `status`;
  they must not include `source_type`.

**`GET /api/sessions/:session_id`** — restore on refresh/reconnect. Same
condition, same order, same `current_position`. Idempotent read.

**`PATCH /api/sessions/:session_id/position`** — advance the resume pointer.
Body `{ position }`. Monotonic; a request to move backward is rejected. Called
by the client only when the feed index exceeds the high-water mark. Rewind
must not PATCH a lower index.

### Stub

**`GET /api/sessions/:session_id/videos/:video_id/stub`** — returns
`{ attribution: { account_name, account_handle, profile_thumbnail_url },
body }`. The body is `stub_content.body` for the session's community — constant
across both conditions; only attribution differs. Returns 400 if `video_id`
isn't an ingroup video (filler has no stub).

### Event ingestion

**`POST /api/events`** — single endpoint, discriminated on `event`.
- Body: `{ event_id, session_id, event, ... }` with the timing fields for that
  event type only. The server validates the event name and timing fields,
  derives `source_type`/`community`/`video_type` from the session/video, and
  upserts `ON CONFLICT (event_id) DO NOTHING`.
- Per-event timing payloads:
  - `content_link_display` → `video_id, timestamp_display`
  - `content_link_click` → `video_id, timestamp_click, latency_ms`
  - `content_stub_exit` → `video_id, timestamp_exit, time_on_stub_ms`
  - `interest_prompt_display` → `video_id, timestamp_display`
  - `interest_response` → `video_id, response ('yes'|'no'|'maybe'), timestamp_response, latency_ms`
  - `playlist_complete` → `timestamp`
  - `survey_complete` → `timestamp`

The latency-critical path is `content_link_click`. Fire it with
`navigator.sendBeacon` (or `fetch(..., { keepalive: true })`) at the moment of
click, *before* navigating to the stub, so it survives the participant leaving
immediately. Keep the handler thin — a single insert — to stay under the 50 ms
target. Measure `latency_ms` on the client with `performance.now()` (monotonic,
immune to wall-clock skew) and also send the ISO timestamps; the server can
cross-check against the matched display event.

### Handoff & debrief

**`POST /api/events` (`playlist_complete`)** — on final-video completion the
client logs this; the server sets `status='playlist_complete'` and returns
`{ route: 'survey', url }` where `url` is the Cint/Qualtrics link with
`session_id` as a param.

**`POST /api/sessions/:session_id/survey-complete`** — completion callback from
the survey tool. Writes `survey_complete`, sets status, returns the debrief
route.

**`GET /api/debrief?session_id=...`** — debrief text, data-withdrawal
instructions, contact info (researcher-supplied). If any personalization framing
is shown on the interest prompt, include the disclosure that responses did not
alter the content shown.

### Operations

**`GET /api/export?session_id=...&format=csv|json`** — auth-protected. Dumps all
events for a session, one section/table per event type, exact Section 8 field
names. This is also the data dictionary deliverable.

**Staging mode** — a deployment flag enabling an end-to-end walkthrough of each
condition, including a `source_type` override so the researcher can force any
arm. The override is rejected in production.

---

## CRITICAL requirements → enforcement point

| Requirement | Enforced by |
| --- | --- |
| Condition between-subjects & immutable | Server randomization + `trg_lock_session_condition` |
| Discard IP before logging | IP-strip middleware; no IP column exists |
| No geo / Cint identifiers stored | No such columns in any table |
| Randomized order, persisted | `session_videos` rows written once at creation |
| Correct video set per condition | Playlist composer: ingroup by `community`+`source_type`, or shared `video_type=control` |
| Source handle non-functional | Frontend; API exposes attribution as data only, no URL |
| Resume pointer monotonic (high-water) | `PATCH /position` rejects backward; client skips rewind PATCHes |
| Per-visit dwell logged | `evt_video_view`; client sends timing only, server enriches condition |
| Like/unlike logged | `evt_like`; client sends `liked` only, server enriches condition |
| Comments sheet open logged | `evt_comments_open`; client sends open time + `time_on_sheet_ms`, server enriches condition |
| Playlist complete without `ended` | Continue on last slide → `playlist_complete` → survey URL redirect |
| Identical badge across conditions | API returns identical badge config; only attribution differs |
| Log click before navigation | `sendBeacon` on click + thin insert handler |
| Stub body constant, attribution-only difference | `stub_content` keyed by community; attribution from video |
| Stub has no other affordances | Stub endpoint returns body + attribution + nothing else |
| Interest prompt non-adaptive | Controller never reads responses; playlist fixed |
| Intermittent prompt placement | `show_interest_prompt` subset set once at creation; stimulus pool guaranteed ≥1 |
| Refresh without re-randomizing / double-logging | `GET /sessions/:id` replays; `event_id` idempotency |
| Encrypted at rest, restricted access | Storage layer (encrypted volume / managed PG) + DB roles |

---

## Resolved decisions & remaining gaps

Settled:
- **Variable counts** — `experiment_config` holds per-community ingroup/filler
  ranges; the composer picks within them per session. Set min = max for a fixed
  count.
- **Prompt rule** — the ~45% / min-spacing-1 default ships as `experiment_config`
  defaults and is applied independently to the stimulus pool (ingroup or
  control) and the filler pool. Stimulus is guaranteed at least one topic
  prompt per session. Copy is derived from `video_type`: topic Yes/No on
  stimulus, “see more of this content” Yes/No/Maybe on fillers. Researchers
  can change `prompt_probability` and `prompt_min_spacing` per community
  without a deploy.
- **No purge** — data is retained indefinitely; there's no scheduled purge job.
  Export is read-only.
- **`session_start`** — stays its own table so per-start data can be attached
  later.

Still needed before launch:
- The video files per community and source type (to populate `videos`).
- The constant stub body per community (`stub_content.body`) — left null until
  Ellen provides the copy; the stub endpoint should return a clear "not yet
  configured" rather than null in the meantime.