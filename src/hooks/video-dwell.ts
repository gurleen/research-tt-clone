import type { EventBody } from "../shared/api/types.ts";
import {
  VIDEO_VIEW_ENDED_REASONS,
  type VideoViewEndedReason,
} from "../shared/api/events.ts";

export { VIDEO_VIEW_ENDED_REASONS };
export type { VideoViewEndedReason };

export const VISIT_INDEX_STORAGE_PREFIX = "study_visit_index:";

export type DwellClock = {
  startedAtMs: number;
  dwellMs: number;
  playbackMs: number;
  dwellOpenAt: number | null;
  playbackOpenAt: number | null;
  loopCount: number;
  maxProgress: number;
};

function closeSegment(
  openAt: number | null,
  now: number,
  accumulated: number,
): { openAt: null; accumulated: number } {
  if (openAt == null) {
    return { openAt: null, accumulated };
  }
  return {
    openAt: null,
    accumulated: accumulated + Math.max(0, now - openAt),
  };
}

export function createDwellClock(
  now: number,
  documentVisible: boolean,
): DwellClock {
  return {
    startedAtMs: now,
    dwellMs: 0,
    playbackMs: 0,
    dwellOpenAt: documentVisible ? now : null,
    playbackOpenAt: null,
    loopCount: 0,
    maxProgress: 0,
  };
}

export function setDocumentVisible(
  clock: DwellClock,
  now: number,
  visible: boolean,
  playing: boolean,
): DwellClock {
  if (visible) {
    return {
      ...clock,
      dwellOpenAt: clock.dwellOpenAt ?? now,
      playbackOpenAt: playing ? (clock.playbackOpenAt ?? now) : null,
    };
  }

  const dwell = closeSegment(clock.dwellOpenAt, now, clock.dwellMs);
  const playback = closeSegment(clock.playbackOpenAt, now, clock.playbackMs);
  return {
    ...clock,
    dwellMs: dwell.accumulated,
    dwellOpenAt: null,
    playbackMs: playback.accumulated,
    playbackOpenAt: null,
  };
}

export function setPlaying(
  clock: DwellClock,
  now: number,
  playing: boolean,
  documentVisible: boolean,
): DwellClock {
  if (playing && documentVisible) {
    return { ...clock, playbackOpenAt: clock.playbackOpenAt ?? now };
  }

  const playback = closeSegment(clock.playbackOpenAt, now, clock.playbackMs);
  return {
    ...clock,
    playbackMs: playback.accumulated,
    playbackOpenAt: null,
  };
}

export function progressUnits(
  loopCount: number,
  currentTime: number,
  duration: number,
): number {
  if (!(duration > 0) || !Number.isFinite(currentTime)) {
    return loopCount;
  }
  return loopCount + currentTime / duration;
}

export function detectLoopWrap(
  prevTime: number,
  currentTime: number,
  duration: number,
): boolean {
  if (!(duration > 0)) return false;
  return prevTime > duration * 0.8 && currentTime < duration * 0.2;
}

export function noteLoop(clock: DwellClock): DwellClock {
  return { ...clock, loopCount: clock.loopCount + 1 };
}

export function applyPlaybackProgress(
  clock: DwellClock,
  currentTime: number,
  duration: number,
): DwellClock {
  const progress = progressUnits(clock.loopCount, currentTime, duration);
  return {
    ...clock,
    maxProgress: Math.max(clock.maxProgress, progress),
  };
}

export function freezeClock(
  clock: DwellClock,
  now: number,
): {
  dwell_ms: number;
  playback_ms: number;
  max_progress: number;
  loop_count: number;
} {
  const dwell = closeSegment(clock.dwellOpenAt, now, clock.dwellMs);
  const playback = closeSegment(clock.playbackOpenAt, now, clock.playbackMs);
  return {
    dwell_ms: Math.round(dwell.accumulated),
    playback_ms: Math.round(playback.accumulated),
    max_progress: clock.maxProgress,
    loop_count: clock.loopCount,
  };
}

export function visitIndexStorageKey(sessionId: string): string {
  return `${VISIT_INDEX_STORAGE_PREFIX}${sessionId}`;
}

export function parseVisitCounts(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const counts: Record<string, number> = {};
    for (const [videoId, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isInteger(value) && value >= 1) {
        counts[videoId] = value;
      }
    }
    return counts;
  } catch {
    return {};
  }
}

export function allocateVisitIndex(
  counts: Record<string, number>,
  videoId: string,
): { visitIndex: number; counts: Record<string, number> } {
  const visitIndex = (counts[videoId] ?? 0) + 1;
  return { visitIndex, counts: { ...counts, [videoId]: visitIndex } };
}

export function shouldShowContinue(
  index: number,
  playlistLength: number,
): boolean {
  return playlistLength > 0 && index === playlistLength - 1;
}

export function buildVideoViewEvent(args: {
  eventId: string;
  sessionId: string;
  videoId: string;
  visitIndex: number;
  startedAtMs: number;
  endedAtMs: number;
  dwellMs: number;
  playbackMs: number;
  maxProgress: number;
  loopCount: number;
  endedReason: VideoViewEndedReason;
}): Extract<EventBody, { event: "video_view" }> {
  return {
    event_id: args.eventId,
    session_id: args.sessionId,
    event: "video_view",
    video_id: args.videoId,
    visit_index: args.visitIndex,
    started_at: new Date(args.startedAtMs).toISOString(),
    ended_at: new Date(args.endedAtMs).toISOString(),
    dwell_ms: args.dwellMs,
    playback_ms: args.playbackMs,
    max_progress: args.maxProgress,
    loop_count: args.loopCount,
    ended_reason: args.endedReason,
  };
}
