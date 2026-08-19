# AGENTS.md

Guidance for coding agents working in this repo.

## What this app is

A **TikTok-style short-video feed** used as a research experiment (diaspora mobilization study). The UI copies TikTok *layout patterns* but must **not** use TikTok branding, logos, watermarks, or the cyan/red Create button.

Participants open a recruitment link with `?community=armenian|sikh|iranian`. The server assigns a between-subjects `source_type` (`micro_influencer`, `institutional`, or `control`), composes a **fixed playlist**, and logs behavioral events. Treatment arms get community-matched ingroup videos plus fillers. The control arm gets a shared control catalog plus fillers. Researchers manage the stimulus catalog and experiment knobs from `/admin`.

Communities: `armenian`, `sikh`, `iranian`.  
Video types: `ingroup` (community + treatment source), `filler` (shared), `control` (shared, no community).  
Source types on videos: `micro_influencer`, `institutional`. Session arm also includes `control`.

## Stack

| Layer | Choice |
| --- | --- |
| Runtime / bundler / tests | **Bun** (`Bun.serve`, HTML imports, `bun test`) |
| Frontend | React 19, React Router 7 |
| Styling | Tailwind CSS v4 (mobile-first, dark feed) |
| Validation | Zod (`src/shared/api/`) |
| Database | Supabase Postgres (`@supabase/supabase-js`) |
| Media | Cloudflare R2 (S3-compatible, presigned uploads) |
| Admin UI primitives | Radix + CVA in `src/components/ui/` |

Do **not** introduce Node, Vite, Express, npm, pnpm, webpack, or extra HTTP frameworks. Bun loads `.env` automatically.

## Commands

```bash
bun install          # install
bun dev              # hot-reload server (src/index.ts)
bun start            # production server
bun run build        # static assets → dist/
bun test             # bun:test, colocated *.test.ts
bun run gen:types    # regenerate src/server/db/database.types.ts
bun run configure:r2-cors
```

Dev URL is printed by Bun (default `http://localhost:3000`).

Participant entry: `/?community=sikh&external_id=R_…`  
Admin: `/admin` (Supabase Auth; user `app_metadata.role` must be `"admin"`)

## Architecture

One Bun process serves the SPA and the API:

```
src/index.ts          Bun.serve — /api/* → handleApiRequest, /* → index.html
src/index.html        HTML entry
src/frontend.tsx      React mount
src/App.tsx           Routes
src/server/router.ts  Manual pathname/method routing (no Express)
```

Layers:

- **Routes** (`src/server/routes/`) — parse request, call a service, return JSON.
- **Services** (`src/server/services/`) — session, playlist, events, R2, export.
- **Shared API** (`src/shared/api/`) — Zod schemas + types used by server *and* client.
- **Client** (`src/client/`) — `PlatformApiClient` for participant/admin HTTP.
- **Study UI** (`src/study/`, `src/components/study/`, `src/pages/`) — session bootstrap and feed instrumentation.
- **Admin UI** (`src/admin/`) — researcher CRUD; most writes go through the **browser Supabase client + RLS**. Bun routes are only for secrets (R2 presign, deactivate/reactivate + object delete, export, session list/summary).

Env is read in `src/server/config/env.ts`. Copy `.env.example`.

## Where to find things

### Participant feed

| Feature | Location |
| --- | --- |
| Feed route `/` | `src/pages/FeedPage.tsx` |
| Session bootstrap / restore | `src/study/session-context.tsx` |
| Loading / error / complete gate | `src/components/study/StudySessionGate.tsx` |
| Vertical snap feed | `src/components/feed/VideoFeed.tsx` |
| Per-slide chrome | `VideoSlide`, `VideoPlayer`, `VideoOverlay`, `VideoInfo`, `SideActions` |
| Feed index (free bidirectional scroll) | `src/hooks/useVideoCompletion.ts` |
| Likes (in-memory UI + `like` events) | `src/hooks/useLikes.ts` |
| Comments sheet (catalog comments + `comments_open`) | `src/components/comments/` |
| Phone frame + dummy top/bottom nav | `src/components/layout/` |
| Playlist item → feed video | `src/study/map-playlist-item.ts` |
| HTTP + sendBeacon helpers | `src/client/platform-api.ts`, `src/study/events.ts` |

Feed is **mobile-only** (~390×844). Desktop is a centered phone frame, not a desktop layout (`MobileShell`). Overlay z-index lives in `src/utils/layout.ts`.

### Study instrumentation (Learn more + interest prompt)

| Feature | Location |
| --- | --- |
| “Learn more” on ingroup videos | `src/components/study/LearnMoreLink.tsx` |
| Stub overlay in the feed | `src/components/study/StubSheet.tsx` + `StubContent.tsx` |
| Full-page stub (legacy `/stub`) | `src/pages/StubPage.tsx` |
| Topic / see-more overlay | `src/components/study/InterestPrompt.tsx` |
| Click logging before stub open | `postEventBeacon` in `src/study/events.ts` (must fire *before* UI opens) |

Ingroup videos get `show_learn_more` (stub link). Stimulus videos (ingroup or control) may get a topic overlay via `show_interest_prompt`, with at least one per session. Fillers may get a “see more of this content” overlay with Yes/No/Maybe. Prompt answers are logged and **must not** change the playlist. The overlay appears after a configurable fraction of the video (`interest_prompt_reveal_fraction`, default 0.3 / 30%). Set it globally on `/admin/experiment-config`.

### Server: sessions, playlist, events

| Feature | Location |
| --- | --- |
| Create session + balanced randomization | `src/server/services/sessions/create-session.ts`, `…/randomization/assign-source-type.ts` |
| Playlist composition | `src/server/services/playlist/compose-playlist.ts` |
| Ingroup or control interleaved with fillers (min 2 fillers between consecutive stimulus videos) | `shuffle-ingroup-filler.ts` |
| Prompt probability / min-spacing (stimulus + filler pools) | `place-prompts.ts` |
| Resume pointer (monotonic) | `advance-position.ts` |
| Session JSON for the client | `build-session-response.ts` |
| Stub body (community-constant copy) | `get-stub.ts` |
| Event ingest | `src/server/routes/events/ingest.ts` → `services/events/writers.ts` |
| Enrich events from session/video rows | `enrich-from-session.ts` (client must not send condition fields) |
| Idempotent insert (`event_id`) | `idempotent-insert.ts` |
| Survey complete → debrief URL | `handle-survey-complete.ts` |
| Debrief copy | `services/debrief/get-debrief.ts` |
| CSV/JSON export | `services/export/export-session.ts` |

### Admin (`/admin`)

| Page | Path | Code |
| --- | --- | --- |
| Dashboard | `/admin` | `src/admin/pages/DashboardPage.tsx` |
| Stimulus catalog | `/admin/videos` | `VideosPage.tsx`, `VideoForm.tsx` |
| Stub copy per community | `/admin/stub-content` | `StubContentPage.tsx` |
| Playlist counts / prompt rules / global prompt timing | `/admin/experiment-config` | `ExperimentConfigPage.tsx` |
| Survey URL + debrief | `/admin/handoff-settings` | `HandoffSettingsPage.tsx` |
| Forced walkthrough | `/admin/test-session` | `TestSessionPage.tsx` |
| Session list | `/admin/sessions` | `SessionsPage.tsx` |
| Per-session events | `/admin/sessions/:sessionId` | `SessionStatsPage.tsx` |

Auth: `src/admin/auth/`. Nav: `src/admin/nav.ts`. Admin flag: `src/shared/auth/admin.ts`.

Video files upload: browser → `POST /api/admin/uploads/presign` → PUT to R2. Keys: `stimulus/{videoId}/{kind}.{ext}` (`src/server/services/r2/`).

### Database

Schema lives in `supabase/migrations/` (RLS + `platform_settings`; core experiment tables are also described in `.cursor/PLATFORM_DESIGN.md`).

Typed accessors: `src/server/db/tables.ts` (wraps generated `database.types.ts`). Server client uses the **secret** key (`src/server/db/client.ts`). Admin browser client uses the **publishable** key + RLS (`src/admin/lib/supabase-browser.ts`).

Tables that matter: `videos` (including caption, comments JSONB, and social-stat counts), `stub_content`, `experiment_config`, `sessions`, `session_videos`, `platform_settings`, plus `evt_*` event tables.

### Shared contracts

- Events + enums: `src/shared/api/events.ts`
- Request/response Zod: `src/shared/api/schemas.ts`
- Admin schemas: `src/shared/api/admin-schemas.ts`

Change these first when adding fields; keep client and server in lockstep.

## HTTP API

All `/api/*` requests run through IP-header stripping first (`src/server/middleware/strip-ip.ts`).

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/sessions` | Create or restore session. Optional `external_id` (Qualtrics `R_…` token). **Required unless `STAGING_MODE=true`**. Unique token restores `in_progress`; `409` if already used. Optional `source_type` **only if `STAGING_MODE=true`** |
| `GET` | `/api/sessions/:id` | Restore same condition, playlist, `current_position` |
| `PATCH` | `/api/sessions/:id/position` | Advance resume index (monotonic) |
| `GET` | `/api/sessions/:id/videos/:videoId/stub` | Stub attribution + community body |
| `POST` | `/api/sessions/:id/survey-complete` | Survey callback → debrief |
| `POST` | `/api/events` | Discriminated event ingest |
| `GET` | `/api/debrief?session_id=` | Debrief text |
| `GET` | `/api/export?session_id=&format=` | Auth: `EXPORT_API_KEY` |
| `GET` | `/api/admin/config` | Publishable Supabase config for the admin SPA |
| `POST` | `/api/admin/uploads/presign` | Admin Bearer JWT |
| `POST` | `/api/admin/videos/:id/deactivate\|reactivate` | Soft-delete + R2 cleanup |
| `GET` | `/api/admin/sessions` | Admin session list (Bearer JWT) |
| `GET` | `/api/admin/sessions/:id/summary` | Admin event summary |

Event names: `content_link_display`, `content_link_click`, `content_stub_exit`, `interest_prompt_display`, `interest_response`, `video_view`, `like`, `comments_open`, `playlist_complete`, `survey_complete`. Each needs a client-generated UUID `event_id`.

## Experiment integrity (do not break)

These are enforced in the server/DB, not as frontend promises:

1. **Condition is server-assigned and immutable.** Randomization in `POST /api/sessions`. DB trigger rejects updates to `source_type` / `community`. Refresh uses `GET /api/sessions/:id` — never re-roll.
2. **No PII.** No IP, geo, or Cint IDs stored. Strip IP headers before handlers run. `sessions.external_id` is an anonymous Qualtrics join token only.
3. **Client never sends condition fields** on events. Server copies `source_type`, `community`, `video_type` from session/video rows. Zod rejects extra keys (see `src/server/smoke.test.ts`).
4. **Playlist is non-adaptive.** Order and prompt flags are written once to `session_videos`. Interest responses are logged and ignored by the composer.
5. **Logging is idempotent.** `ON CONFLICT (event_id) DO NOTHING`.
6. **Do not surface `source_type` as a label** in the participant UI. Condition is implied by which ingroup videos appear.
7. **Stub body is constant per community**; only attribution (account name/handle/thumb) differs by video/condition.
8. **Resume pointer is monotonic.** Participants can scroll freely; `PATCH /position` is a high-water mark and rejects moving backward. Rewind is client-only and must not PATCH a lower index. Refresh resumes at furthest reached.

`STAGING_MODE=true` allows `source_type` on create so researchers can force an arm. That override must stay rejected in production.

## Conventions

- TypeScript ESM (`.ts` / `.tsx` imports include the extension).
- Colocate tests next to the code (`foo.test.ts`). Use `bun:test`.
- Throw `ApiError` from `src/server/lib/http.ts` for expected 4xx/5xx; the router maps it to JSON.
- Feed chrome that is display-only (share, save, search, bottom nav, Explore/Following) should stay non-functional unless the study spec changes.
- `src/data/feed.ts` + `useFeed()` are leftover static-prototype pieces. The live feed uses the study session playlist, not that seed file.
- `docs/PROJECT.md` describes an early UI-only v1. Prefer this file and `.cursor/PLATFORM_DESIGN.md` for the experiment platform.

## Further reading

- `.cursor/PLATFORM_DESIGN.md` — data model, integrity rules, API design
- `.env.example` — required secrets and R2 notes
- `README.md` — short setup
