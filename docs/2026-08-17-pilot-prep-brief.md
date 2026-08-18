# Pilot prep brief — 2026-08-17

Self-contained handoff for coding agents. Implements requests from a researcher voice note (advisor wants forced-watch gone before a Qualtrics pilot in ~1 week). Do not require the originating chat.

Canonical architecture: `AGENTS.md` and `.cursor/PLATFORM_DESIGN.md`. Prefer those over `docs/PROJECT.md` (early UI-only spec).

---

## What this app is

TikTok-style short-video feed used as a **diaspora mobilization research experiment**. Layout copies TikTok patterns but must **not** use TikTok branding, logos, watermarks, or the cyan/red Create button.

Participants open a recruitment link with `?community=armenian|sikh|iranian`. The server assigns a between-subjects `source_type` (`micro_influencer` or `institutional`), composes a **fixed playlist** of ingroup + filler videos, and logs behavioral events. Researchers manage the stimulus catalog from `/admin`.

| | |
| --- | --- |
| Runtime | Bun (`Bun.serve`, HTML imports, `bun test`) — not Node/Vite/Express |
| Frontend | React 19, React Router 7, Tailwind v4, mobile-only ~390×844 |
| DB | Supabase Postgres |
| Media | Cloudflare R2 |
| Shared contracts | Zod in `src/shared/api/` — change these first; keep client and server in lockstep |

Dev: `bun dev` → `http://localhost:3000`. Participant: `/?community=sikh`. Admin: `/admin`.

---

## Voice-note requests (source of work)

1. **Drop forced compliance / full-video watch.** Advisor wants people able to skip. In lieu of that, **measure engagement**: dwell per video, returns, duration of returns, rewatches.
2. **Pilot through Qualtrics.** Two options they named:
   - A: embed the whole platform in Qualtrics via JavaScript
   - B: route Qualtrics → app, match ID tags, flag incompletes, prevent link reuse after a point
3. **Treatments narrowed:** only **two diaspora (ingroup) videos per arm** (institutional vs micro-influencer). They will deactivate unused ingroup videos and add more filler. Also tailoring stub language.
4. **Stimulus authenticity:** real comments on videos; real follower stats for authentic accounts, varied for filler; **track likes** (UI may already exist).

---

## Integrity rules (do not break)

Enforced in server/DB, not as frontend promises. Full list in `AGENTS.md` and `.cursor/PLATFORM_DESIGN.md`.

1. **Condition is server-assigned and immutable.** Randomization in `POST /api/sessions`. DB trigger rejects updates to `source_type` / `community`. Refresh uses `GET /api/sessions/:id` — never re-roll. `source_type` override only if `STAGING_MODE=true`.
2. **No PII.** No IP, geo, or `cint_id` columns. Strip IP headers before handlers (`src/server/middleware/strip-ip.ts`). A Qualtrics **ResponseID** is an anonymous join token, not a Cint panel ID — still confirm with the researcher/IRB before persisting it as `sessions.external_id`.
3. **Client never sends condition fields** on events. Server copies `source_type`, `community`, `video_type` from session/video rows. Zod rejects extra keys (`src/server/smoke.test.ts`).
4. **Playlist is non-adaptive.** Order and prompt flags written once to `session_videos`. Interest responses are logged and ignored by the composer.
5. **Logging is idempotent.** Client UUID `event_id`; `ON CONFLICT (event_id) DO NOTHING`.
6. **Do not surface `source_type` as a label** in the participant UI.
7. **Stub body is constant per community**; only attribution (account name/handle/thumb) differs by video/condition.
8. **Forward scroll used to be gated until 95% watched**; `PATCH /position` rejects moving backward. After this work, the resume pointer stays **monotonic (high-water mark)**; free rewind is client-only and must **not** call PATCH with a lower index. Dwell is logged per visit instead of forcing watch.

Event ingest: `POST /api/events`, discriminated on `event`. Current names: `content_link_display`, `content_link_click`, `content_stub_exit`, `interest_prompt_display`, `interest_response`, `playlist_complete`, `survey_complete`.

---

## Recommended build order

1. Free scroll + `video_view` dwell events + new playlist-complete trigger
2. Qualtrics `external_id` join, one-session-per-token, return URL (option B — **do not iframe**)
3. Like events (UI already exists)
4. Catalog fields for comments, caption, like/follower counts + admin form + playlist payload
5. Researcher ops: experiment_config counts, deactivate unused ingroup, upload filler, stub copy

---

## 1. Drop forced watch, log dwell / rewatch

### Current behavior

There is **no third treatment arm**. Arms are only `micro_influencer` vs `institutional`. “Forced compliance” in the product is the watch-to-continue gate.

| Mechanism | File | Detail |
| --- | --- | --- |
| 95% completion | `src/hooks/useVideoCompletion.ts` | `COMPLETION_THRESHOLD = 0.95`; `canGoForward` false until threshold or `ended` |
| Snap-back + banner | `src/components/feed/VideoFeed.tsx` | `onScroll` resets if `index > currentIndex && !canGoForward`; pill “Watch the full video to continue” |
| Swipe next/prev | `src/components/feed/VideoInteractionLayer.tsx` | Gestures call `goNext`/`goPrev`; gate is in `goToIndex`, not the gesture layer |
| Resume pointer | `src/server/services/sessions/advance-position.ts` | Rejects `position < current_position` |
| Client PATCH | `src/study/session-context.tsx` `patchPosition` | Called from `VideoFeed` on **every** index change, including rewind → 400 |
| Loop | `src/components/feed/VideoPlayer.tsx` | `loop` + `currentTime = 0` on activate; HTML `ended` almost never fires |
| Playlist complete | `VideoFeed.onVideoEnded` → `completePlaylist()` | Only when last index’s `onEnded` fires |

Existing events **do not** record per-video dwell. Closest analog is `content_stub_exit.time_on_stub_ms`. Fillers with no prompt currently log nothing.

`current_position` is a **resume high-water mark**, not “currently viewing” (see PLATFORM_DESIGN “Resume / reconnect”). On refresh, `GET /api/sessions/:id` restores that index.

### Code changes

**Remove / loosen the gate**

- `src/hooks/useVideoCompletion.ts` — stop blocking forward motion on 95%. Either delete the hook’s completion gating or reduce it to index state only (`currentIndex`, `goToIndex`).
- `src/components/feed/VideoFeed.tsx` — remove snap-back and the watch banner. Allow swipe/scroll in both directions among already-reachable slides.
- Keep `advancePosition` **monotonic**. In `VideoFeed` / `session-context`, call `patchPosition` **only when the new index is greater than the high-water mark**. Rewind must not PATCH a lower value. Resume-on-refresh can still jump to furthest reached (product decision: furthest vs last-viewed — default **furthest**, matching today’s contract unless the researcher asks otherwise).

**New completion rule (required)**

`completePlaylist()` in `src/study/session-context.tsx` posts `playlist_complete` and sets UI state to `complete`. `StudySessionGate` then shows a dead-end “Session complete” screen and **does not** use the `{ route: "survey", url }` the server already returns from `writePlaylistComplete`.

Because videos loop, last-clip `onEnded` is an unreliable trigger. Implement an explicit rule, for example:

- A **Continue / I’m done** control on the last slide, or
- Fire complete when the participant **reaches the last video** (first time `currentIndex === length - 1`) and optionally after a short dwell.

Then POST `playlist_complete` and **follow the returned survey URL** (see Qualtrics section). Confirm the exact rule with the researcher if still open; do not leave complete wired only to `onEnded`.

**New event: `video_view` (name can be `video_dwell`; pick one and use it everywhere)**

One **row per visit** so first view vs return vs rewatch are first-class (`visit_index` 1, 2, … per session+video).

Client payload (timing only — no `source_type` / `community` / `video_type`):

| Field | Type | Meaning |
| --- | --- | --- |
| `event_id` | uuid | Client-generated, idempotent |
| `session_id` | uuid | |
| `event` | `"video_view"` | |
| `video_id` | string | |
| `visit_index` | int ≥ 1 | nth visit to this video in this session |
| `started_at` | ISO timestamptz | |
| `ended_at` | ISO timestamptz | |
| `dwell_ms` | int | Wall clock while the slide is active (see open questions for pause/hidden) |
| `playback_ms` | int | Time the `<video>` was actually playing (not paused) |
| `max_progress` | number | Peak `currentTime/duration`; may exceed 1.0 if looped |
| `loop_count` | int | How many times the clip looped this visit |
| `ended_reason` | enum | e.g. `swipe`, `hidden`, `pagehide`, `playlist_complete` |

Server: enrich from session/video rows; insert `evt_video_view`; include in export.

**Wire-up checklist**

| Layer | Files |
| --- | --- |
| Event name + table map | `src/shared/api/events.ts` (`EVENT_NAMES`, `EVENT_TO_TABLE`, `VIDEO_EVENTS`) |
| Zod | `src/shared/api/schemas.ts` — new schema, add to `eventBodySchema` discriminated union **and** the `knownKeys` superRefine list |
| Types re-export | `src/shared/api/types.ts` if it re-exports schemas |
| Dispatch | `src/server/routes/events/ingest.ts` |
| Writer | `src/server/services/events/writers.ts` |
| Enrich | `src/server/services/events/enrich-from-session.ts` (reuse `enrichVideoEvent`) |
| Idempotent insert | `src/server/services/events/idempotent-insert.ts` (generic enough already) |
| DB | New Supabase migration for `evt_video_view` (mirror other `evt_*` tables: `event_id` PK, `session_id` FK, denormalized `source_type`/`community`/`video_type`, `server_received_at`) |
| Generated types | `bun run gen:types` → `src/server/db/database.types.ts`; `src/server/db/tables.ts` `EventTableName` if listed there |
| Export / admin | `src/server/services/sessions/session-events.ts` `SESSION_EVENT_TABLES`; `export-session.ts`; `session-summary.ts`; admin `src/shared/api/admin-schemas.ts` if it lists event tables |
| Smoke | `src/server/smoke.test.ts` — accept new event; still reject client-sent `source_type` |
| Client | New hook (e.g. `src/hooks/useVideoDwell.ts`) driven from `VideoFeed` / `VideoOverlay`. Flush with `postEventBeacon` (`src/study/events.ts`) on slide leave, `visibilitychange` → hidden, `pagehide`. |
| Player | `VideoPlayer` — expose loop ticks / pause so `playback_ms` and `loop_count` are accurate. Today `onTimeUpdate` only feeds the progress bar + completion gate. |

Update `AGENTS.md` and `.cursor/PLATFORM_DESIGN.md`: replace “Advancement only on videoEnded” with “resume pointer monotonic; per-visit dwell logged.”

Tests: colocate `*.test.ts`, run `bun test`. At minimum: Zod accept/reject; `advancePosition` still rejects backward; dwell payload shape; playlist complete no longer requires `ended`.

---

## 2. Qualtrics linking (option B — do not embed)

### Decision

**Do not implement Qualtrics iframe / JS embed (option A).** Autoplay, third-party `sessionStorage` partitioning, and the 390×844 phone frame will fight Qualtrics. The app is already a redirect-style experiment platform.

### Current session lifecycle

```
/?community=sikh  →  POST /api/sessions { community }
                 →  sessionStorage study_session_id
                 →  feed
                 →  playlist_complete event
                 →  server returns { route: "survey", url }  (CLIENT IGNORES)
                 →  StudySessionGate "Session complete" dead end
```

| Piece | Location |
| --- | --- |
| Create body | `src/shared/api/schemas.ts` `createSessionBodySchema` — `{ community, source_type? }` only |
| Route | `src/server/routes/sessions/create.ts` — staging-only `source_type` |
| Insert | `src/server/services/sessions/create-session.ts` — no recruitment token |
| Bootstrap | `src/study/session-context.tsx` — `?community=`, `?session_id=`, `?source_type=`; `STORAGE_KEY = "study_session_id"` |
| Survey URL template | `platform_settings.survey_url` via `/admin/handoff-settings`; `buildSurveyUrl` replaces `{session_id}` in `src/server/services/platform-settings/load-settings.ts` |
| Complete UI | `src/components/study/StudySessionGate.tsx` |
| Status enum | `in_progress` \| `playlist_complete` \| `survey_complete` \| `debriefed` |

Anyone with `/?community=sikh` can create unlimited sessions. Restore is by `session_id` in URL or sessionStorage, not by Qualtrics ID.

### Target pilot flow

```
Qualtrics (consent / screening)
  → redirect to https://<app>/?community=sikh&external_id={ResponseID}
  → app: create or restore the unique session for that token
  → feed (free scroll + dwell logging)
  → playlist_complete
  → redirect back to Qualtrics with session_id + status (and/or follow survey_url)
  → Qualtrics Embedded Data + branch: finished vs incomplete
```

Exact Qualtrics query param name (`ResponseID`, `RID`, `external_id`) must match what Qualtrics piped text can inject. Default in code: `external_id`, also accept a documented alias if needed.

### Code changes

1. **Migration:** `sessions.external_id text unique` (nullable for staging/test sessions created from `/admin/test-session`). Do **not** name it `cint_id`.
2. **`createSessionBodySchema`:** optional `external_id` string (min length, charset — Qualtrics ResponseIDs are typically `R_` + alphanumerics). Production should **require** it if you add an env flag, or require it whenever present in the URL so anonymous `/?community=` cannot mint sessions during the pilot.
3. **`createSession` / `createSessionRecord`:** persist `external_id`. On conflict unique: **restore** that session if `status = in_progress`; **409** (or a dedicated participant error screen) if `playlist_complete` / `survey_complete` / `debriefed` — “this link has already been used.”
4. **`session-context.tsx`:** read `external_id` from search params; pass into `createSession`; if create returns existing session, use it. Do not create a second session when sessionStorage has a *different* id than the URL token — URL token wins.
5. **Reuse / incomplete:**
   - Incomplete = `sessions.status = in_progress` (and maybe never returned to Qualtrics). Qualtrics can also time out on its side.
   - “Don’t let people reuse the link after a certain point” = reject create/restore once playlist is complete (confirm TTL vs complete-only with researcher).
6. **Return trip:** `completePlaylist` must use `EventResponse` when it includes `route`/`url`. `writePlaylistComplete` already builds the survey URL. Also append `external_id` if Qualtrics needs it. Expand `buildSurveyUrl` if the template needs more placeholders (`{external_id}`, `{status}`).
7. **`StudySessionGate`:** on complete, redirect (`window.location`) instead of a static thank-you, unless the survey URL is missing.
8. **Do not leak `source_type`** on query params to Qualtrics.
9. **Test session page** (`src/admin/pages/TestSessionPage.tsx`): still works without `external_id` in staging.

Docs to update: `AGENTS.md` HTTP API table, PLATFORM_DESIGN “Session lifecycle” (today: “Recruitment/Cint params are read for routing but never persisted” — that sentence must change for `external_id` only).

Participant-facing errors: missing community, missing token (if required), link already used, not enough catalog videos (already in `catalogErrorMessage`).

---

## 3. Real comments, follower stats, tracked likes

### Likes — UI exists, not logged

| File | Role |
| --- | --- |
| `src/hooks/useLikes.ts` | In-memory `Set`; `isLiked` / `toggleLike` |
| `src/components/feed/LikeButton.tsx` | Heart + count (`liked ? count + 1 : count`) |
| `src/components/feed/VideoFeed.tsx` | Double-tap like (like-only, no unlike) |
| `src/components/feed/SideActions.tsx` | Rail |

**Add `evt_like`:** `event_id`, `session_id`, `video_id`, `liked` (boolean), `timestamp`. Log both like and unlike. Fire from `toggleLike` (and double-tap). Same ingest/export path as other video events. Do **not** persist a social graph; this is a behavioral DV.

Still no condition fields from the client. Enrich from session/video.

### Comments and social stats — chrome exists, data is stubbed

`src/types/feed.ts`: `FeedVideo` has `likeCount`, `commentCount`, `shareCount`, `comments: FeedComment[]`. `CommentsSheet` / `CommentList` / `CommentItem` render that.

`src/study/map-playlist-item.ts` hardcodes `likeCount: 0`, `commentCount: 0`, `comments: []`. Caption is currently `item.attribution.account_name` (account name, not a real caption). `audioTrack` is `"original sound"`.

`src/server/services/sessions/build-session-response.ts` selects from `videos`: `video_id`, `video_type`, `media_url`, `duration_ms`, `account_name`, `account_handle`, `profile_thumbnail_url` only.

`videos` catalog (PLATFORM_DESIGN) has no caption, comments, like_count, or follower_count. Admin `VideoForm` / `videoFormSchema` (`src/shared/api/admin-schemas.ts`, `src/admin/components/VideoForm.tsx`) match that.

**Add catalog fields** (migration + RLS already allows authenticated admin writes on `videos` — extend columns, not a new Bun route):

| Column | Use |
| --- | --- |
| `caption` text | Overlay caption (replace using account_name as caption) |
| `like_count` int | Display baseline (participant like adds +1 in UI only) |
| `follower_count` int | Authentic = real; filler = varied fake |
| `share_count` / `save_count` optional ints | Chrome already shows these; can stay 0 |
| Comments | JSONB array `{ username, text, timestamp? }` **or** table `video_comments (video_id, …)` |

Thread: migration → `videoFormSchema` + `VideoForm` → `playlistItemSchema` → `buildSessionResponse` select → `mapPlaylistItem` → `SideActions` / `VideoInfo` / `CommentsSheet`.

**Followers:** `CreatorAvatar` (`src/components/feed/CreatorAvatar.tsx`) is image-only, not tappable. Show `follower_count` under the avatar or under `@handle` in `VideoInfo`. Do not add a real profile URL (handles are non-functional by design).

Optional: `evt_comments_open` for time on the sheet. Only if the researcher wants it; authenticity display does not require it.

`src/data/feed.ts` / `useFeed()` are leftover prototype — live feed uses the study playlist. Do not wire catalog through the seed file.

---

## 4. Two ingroup videos per arm + more filler

**Mostly researcher ops.** Composer already samples from `experiment_config`.

| Step | Where |
| --- | --- |
| Set `ingroup_count_min = ingroup_count_max = 2` per community | `/admin/experiment-config` → `ExperimentConfigForm` → table `experiment_config` |
| Deactivate unused ingroup videos | `/admin/videos` → `POST /api/admin/videos/:id/deactivate` (`deactivate-video.ts`). Soft-delete; R2 objects kept if the video was ever in a session |
| Upload extra filler | `/admin/videos` new video, `video_type = filler` |
| Raise `filler_count_min` / `max` | Same experiment config page |

Composer: `src/server/services/playlist/compose-playlist.ts` — loads config, picks counts in range, filters `videos` `active = true`, `ingroup` by `community` + `source_type`, fillers shared. Shuffle: `src/server/services/playlist/shuffle-ingroup-filler.ts` — **1–2 fillers between consecutive ingroup** (`MIN_FILLERS_BETWEEN_INGROUP = 1`). Two ingroup videos need **at least one filler** in the playlist.

Catalog requirement if all three communities are in the pilot: **2 active ingroup videos × 3 communities × 2 source types = 12** ingroup rows, plus enough fillers for `filler_count_max` (and spacing). If a community is not piloted, still leave config consistent so 503 “not enough videos” does not surprise staging.

No need to hardcode “2” in composer unless they want to freeze it in code; admin knobs are the intended control. Changes apply to **new sessions only**.

---

## 5. Stub language

Ops: `/admin/stub-content` → `StubContentEditor` / `stub_content.body`. Body is **constant per community**. Attribution header comes from the ingroup video (`get-stub` service). Do **not** split stub copy by `source_type` unless the researcher explicitly abandons that invariant.

In-feed stub: `src/components/study/StubSheet.tsx` + `StubContent.tsx`. Legacy full page: `src/pages/StubPage.tsx`. Learn-more click must still `sendBeacon` **before** UI opens (`LearnMoreLink.tsx`).

---

## Open questions (defaults if they do not answer in time)

| Question | Suggested default for the pilot |
| --- | --- |
| Completion without forced watch? | Explicit **Continue** on the last video (clearer than “landed on last index”) |
| Link reuse after what point? | Reject after `playlist_complete`; allow restore while `in_progress` (refresh/reconnect) |
| Dwell = wall clock, playback, unique seconds? | Log **both** `dwell_ms` and `playback_ms`; analysts can derive. Unique seconds optional later |
| Freeze clock on pause / comments / stub / background tab? | Pause `playback_ms` when paused; pause both when document hidden; comments/stub **do** count as dwell on that video unless researcher says otherwise (stub already has `time_on_stub_ms`) |
| Resume after refresh: furthest vs last viewed? | Keep **furthest** (`current_position` high-water) |
| Follower UI? | Small count under avatar |
| Log comment-sheet open? | Skip unless asked |
| Qualtrics token required in production? | **Yes** for the pilot deploy so bare `?community=` cannot mint sessions |

---

## Event pipeline (copy this when adding `video_view` / `like`)

1. `src/shared/api/events.ts` — name + `EVENT_TO_TABLE`
2. `src/shared/api/schemas.ts` — Zod + `knownKeys`
3. Migration `evt_*` table with denormalized condition columns, `event_id` PK, `server_received_at`
4. Writer in `writers.ts` via `enrichVideoEvent` + `idempotentInsert`
5. `ingest.ts` switch
6. `SESSION_EVENT_TABLES` + export + admin summary
7. Client: `newEventId()`, ISO timestamps, `sendBeacon` for unload paths
8. `bun run gen:types` after migration
9. `bun test` including smoke “rejects condition fields”

---

## Commands and conventions

```bash
bun install
bun dev
bun test
bun run gen:types    # after schema changes
```

- TypeScript ESM; imports include the `.ts` / `.tsx` extension.
- Colocate tests (`foo.test.ts`).
- Throw `ApiError` from `src/server/lib/http.ts` for expected 4xx/5xx.
- Feed chrome that is display-only (share, save, search, bottom nav) stays non-functional unless the spec changes.
- Do not introduce Node, Vite, Express, npm, webpack.

---

## Key file index

```
src/index.ts                          Bun.serve
src/server/router.ts                  /api/* routing
src/shared/api/events.ts              Event names
src/shared/api/schemas.ts             Zod contracts
src/shared/api/admin-schemas.ts       Video / experiment / stub admin forms
src/study/session-context.tsx         Bootstrap, position, playlist_complete
src/study/map-playlist-item.ts        Playlist → feed video
src/study/events.ts                   postEvent / sendBeacon
src/hooks/useVideoCompletion.ts       95% gate (remove)
src/hooks/useLikes.ts                 Client-only likes (log)
src/components/feed/VideoFeed.tsx     Snap feed, gate UI, complete trigger
src/components/feed/VideoPlayer.tsx   loop, timeupdate
src/components/feed/SideActions.tsx   Like / comments / avatar
src/components/study/StudySessionGate.tsx
src/server/services/sessions/create-session.ts
src/server/services/sessions/advance-position.ts
src/server/services/sessions/build-session-response.ts
src/server/services/playlist/compose-playlist.ts
src/server/services/playlist/shuffle-ingroup-filler.ts
src/server/services/events/writers.ts
src/server/services/events/ingest.ts  (routes/events/ingest.ts)
src/server/services/platform-settings/load-settings.ts
src/admin/pages/ExperimentConfigPage.tsx
src/admin/pages/VideosPage.tsx
src/admin/components/VideoForm.tsx
src/admin/pages/StubContentPage.tsx
src/admin/pages/HandoffSettingsPage.tsx
.cursor/PLATFORM_DESIGN.md
AGENTS.md
supabase/migrations/
```

---

## Out of scope unless asked

- Qualtrics iframe / `X-Frame-Options` / `frame-ancestors` work for option A
- Storing Cint IDs, emails, IPs, geo
- Adaptive playlist based on likes or interest answers
- Making share/save/search/bottom-nav functional
- Per-arm stub bodies
- Familiarity block (PLATFORM_DESIGN “Deferred — Section 6”)
