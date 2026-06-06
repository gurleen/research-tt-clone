# TikTok Clone — Project Specification

## 1. Project Overview

**Purpose:** A TikTok-like short-video feed for a research experiment. Reference mockups show feeds themed by research condition (e.g. Placebo, State media, Culture, Economy, Politics)—each uses the same shell UI with different seeded video content.

**Scope (v1):** UI/UX prototype with static content. No analytics/tracking yet; backend API deferred until video sourcing and research instrumentation are defined.

**Branding rule:** Must match TikTok's *layout patterns* but **must not** use TikTok logos, watermarks, trademarked icons, or the distinctive cyan/red split on the Create button. Use generic icons and neutral naming where needed.

---

## 2. Platform & Stack

| Layer | Choice |
|-------|--------|
| Runtime / server | Bun (`Bun.serve`, HTML imports) |
| Frontend | React 19 + React Router 7 |
| Styling | Tailwind CSS v4 (mobile-first) |
| Data (v1) | Static seed files the researcher fills in manually |
| Data (future) | REST API endpoints (stub interfaces documented, not implemented) |

---

## 3. Design Constraints

- **Mobile only:** App is designed for a phone viewport (~390×844). Desktop shows a centered phone frame—not a responsive desktop layout.
- **Theme:** Dark mode. White text and icons overlaid on full-screen video. Semi-transparent backgrounds (`bg-black/20`, `backdrop-blur-sm`) on fixed chrome where needed.
- **Tailwind:** Utility-first styling; overlays use `relative` container + `absolute` positioned children.

### 3.1 Screen layout

```
┌─────────────────────────────┐
│ ☰   Explore Following ForYou 🔍│  ← TopNav (For You active)
├─────────────────────────────┤
│                         (👤)│
│                         ♥ 64K│  ← SideActions rail (right)
│                         💬 2K│
│                         🔖   │
│                         ↗ 5K │
│                             │
│  @username                  │  ← VideoInfo (bottom-left)
│  caption #hashtags          │
│  ♫ track name               │
│                        (disc)│  ← MusicDisc (bottom-right)
├─────────────────────────────┤
│ 🏠  👥  [+]  ✉  👤         │  ← BottomNav (Home active)
└─────────────────────────────┘
```

### 3.2 Top navigation bar (`TopNav.tsx`)

- **Left:** Hamburger menu icon (non-functional).
- **Center:** Three text tabs—**Explore**, **Following**, **For You**. "For You" is active (bold + white underline). Non-functional in v1.
- **Right:** Search icon (non-functional).

### 3.3 Right-side action rail (`SideActions.tsx`)

| Element | Behavior (v1) |
|---------|---------------|
| Circular creator avatar | Display only |
| Heart + count | **Functional** — toggle like |
| Speech bubble + count | **Functional** — open read-only comments sheet |
| Bookmark + count | Display only |
| Share arrow + count | Display only |

**`MusicDisc.tsx`:** Small rotating disc icon bottom-right above bottom nav (display only).

### 3.4 Bottom-left video info (`VideoInfo.tsx`)

- **Username:** Bold white `@handle`.
- **Caption:** Description with hashtags.
- **Audio:** Musical-note icon + track title.

### 3.5 Bottom navigation bar (`BottomNav.tsx`)

Five icons—**all non-functional** in v1: Home (active), Friends, Create (+), Inbox, Profile. Generic plus button (no TikTok cyan/red styling).

---

## 4. Core User Flows

### 4.1 Video feed

- Full-viewport vertical scroll/snap (one video per page).
- **Forward gating:** Cannot advance until current video is watched to completion (≥ 95% of duration or `ended` event).
- **Backward freedom:** May scroll back to any previously viewed video at any time.
- **Persistent completion:** Once a video is watched to completion, it stays completed for the session. Scrolling back to a previously finished video does not require watching it again.

### 4.2 Like

- Tap heart to toggle. Optimistic UI update; client state only in v1 (localStorage optional for session continuity).

### 4.3 Comments (read-only)

- Tap comment icon opens bottom sheet with seeded comments.
- No comment input, reply, or post actions.
- Dismiss via close control or tapping backdrop.

### 4.4 Out of scope (v1)

- Creating comments, profiles, follow, share, save, search, upload, auth, notifications.
- Explore / Following tabs, hamburger menu, bottom-nav navigation.
- Any TikTok logo or watermark on video content.

---

## 5. Static Data Model

Types live in `src/types/feed.ts`. Seed data in `src/data/feed.ts`.

```ts
type FeedVideo = {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  creator: { username: string; avatarUrl?: string };
  caption: string;
  hashtags?: string[];
  audioTrack: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount?: number;
  comments: FeedComment[];
};

type FeedComment = {
  id: string;
  username: string;
  text: string;
  timestamp?: string;
};

type FeedCondition = "placebo" | "state-media" | "culture" | "economy" | "politics";
```

### How to add videos

1. Place video files in `public/videos/`.
2. Add entries to the `feedVideos` array in `src/data/feed.ts`.
3. Set `videoUrl` to `/videos/your-file.mp4`.
4. Fill in creator info, caption, counts, and comments.
5. Optionally group feeds by `FeedCondition` for different research arms.

### Future API swap

Components consume `useFeed()`. v1 returns static data; later swap to `fetch('/api/feed')`.

Count display uses `formatCount()` (e.g. `64800` → `"64.8K"`).

---

## 6. Component Architecture

```
src/
  components/
    layout/       MobileShell, TopNav, BottomNav
    feed/         VideoFeed, VideoSlide, VideoPlayer, VideoOverlay,
                  VideoInfo, SideActions, ActionButton, LikeButton,
                  CommentButton, CreatorAvatar, MusicDisc
    comments/     CommentsSheet, CommentList, CommentItem
  hooks/          useFeed, useVideoCompletion, useLikes
  utils/          formatCount
  data/           feed.ts
  types/          feed.ts
  pages/          FeedPage
```

**Key logic:**

- `useVideoCompletion`: tracks index, per-visit completion, `canGoForward`.
- `VideoFeed`: intercepts scroll; blocks forward when `!canGoForward`.
- `App.tsx`: router with single `/` route.

---

## 7. Routing & Shell

- Route: `/` → feed.
- `MobileShell` wraps all routes with top/bottom nav.

---

## 8. Future Extension Points

- **API:** `GET /api/feed`, `POST /api/videos/:id/like`, research event ingestion.
- **Tracking:** video start/complete, like, comment open, scroll back — hook stubs, not wired.
- **Auth / sessions:** not required for v1.
- **FeedCondition:** select feed via query param or API.

---

## 9. Acceptance Criteria (v1)

- [ ] Mobile-only feed matches mockup layout
- [ ] No TikTok branding
- [ ] Forward scroll blocked until video completes; backward scroll always works
- [ ] Like toggles with count update
- [ ] Read-only comments sheet
- [ ] Non-functional chrome (share, save, search, nav tabs)
- [ ] Small components in separate files
