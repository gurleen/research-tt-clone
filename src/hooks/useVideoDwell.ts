import { useCallback, useEffect, useRef } from "react";
import { newEventId, postEventBeacon } from "../study/events.ts";
import {
  allocateVisitIndex,
  applyPlaybackProgress,
  buildVideoViewEvent,
  createDwellClock,
  freezeClock,
  noteLoop,
  parseVisitCounts,
  setDocumentVisible,
  setPlaying,
  visitIndexStorageKey,
  type DwellClock,
  type VideoViewEndedReason,
} from "./video-dwell.ts";

type ActiveVisit = {
  sessionId: string;
  videoId: string;
  visitIndex: number;
  clock: DwellClock;
};

function isDocumentVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

function readVisitCounts(sessionId: string): Record<string, number> {
  if (typeof sessionStorage === "undefined") return {};
  return parseVisitCounts(
    sessionStorage.getItem(visitIndexStorageKey(sessionId)),
  );
}

function writeVisitCounts(
  sessionId: string,
  counts: Record<string, number>,
): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    visitIndexStorageKey(sessionId),
    JSON.stringify(counts),
  );
}

export function useVideoDwell(args: {
  sessionId: string | undefined;
  videoId: string | undefined;
}) {
  const visitRef = useRef<ActiveVisit | null>(null);
  const playingRef = useRef(false);

  const flush = useCallback((reason: VideoViewEndedReason) => {
    const visit = visitRef.current;
    if (!visit) return;

    const now = Date.now();
    const frozen = freezeClock(visit.clock, now);
    visitRef.current = null;

    postEventBeacon(
      buildVideoViewEvent({
        eventId: newEventId(),
        sessionId: visit.sessionId,
        videoId: visit.videoId,
        visitIndex: visit.visitIndex,
        startedAtMs: visit.clock.startedAtMs,
        endedAtMs: now,
        dwellMs: frozen.dwell_ms,
        playbackMs: frozen.playback_ms,
        maxProgress: frozen.max_progress,
        loopCount: frozen.loop_count,
        endedReason: reason,
      }),
    );
  }, []);

  const startVisit = useCallback((sessionId: string, videoId: string) => {
    const now = Date.now();
    const allocated = allocateVisitIndex(readVisitCounts(sessionId), videoId);
    writeVisitCounts(sessionId, allocated.counts);
    visitRef.current = {
      sessionId,
      videoId,
      visitIndex: allocated.visitIndex,
      clock: createDwellClock(now, isDocumentVisible()),
    };
    if (playingRef.current) {
      visitRef.current.clock = setPlaying(
        visitRef.current.clock,
        now,
        true,
        isDocumentVisible(),
      );
    }
  }, []);

  useEffect(() => {
    const previous = visitRef.current;
    if (previous) {
      const sameVisit =
        previous.sessionId === args.sessionId &&
        previous.videoId === args.videoId;
      if (!sameVisit) {
        flush("swipe");
      } else {
        return;
      }
    }

    if (args.sessionId && args.videoId) {
      startVisit(args.sessionId, args.videoId);
    }

    return () => {
      // Next effect run or unmount flushes via the explicit paths.
    };
  }, [args.sessionId, args.videoId, flush, startVisit]);

  useEffect(() => {
    function onVisibilityChange() {
      const visit = visitRef.current;
      const now = Date.now();
      const visible = isDocumentVisible();

      if (!visible) {
        flush("hidden");
        return;
      }

      if (!visit && args.sessionId && args.videoId) {
        startVisit(args.sessionId, args.videoId);
        return;
      }

      if (visit) {
        visit.clock = setDocumentVisible(
          visit.clock,
          now,
          true,
          playingRef.current,
        );
      }
    }

    function onPageHide() {
      flush("pagehide");
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [args.sessionId, args.videoId, flush, startVisit]);

  const onTimeUpdate = useCallback((currentTime: number, duration: number) => {
    const visit = visitRef.current;
    if (!visit) return;
    visit.clock = applyPlaybackProgress(visit.clock, currentTime, duration);
  }, []);

  const onLoop = useCallback(() => {
    const visit = visitRef.current;
    if (!visit) return;
    visit.clock = noteLoop(visit.clock);
  }, []);

  const onPlayingChange = useCallback((playing: boolean) => {
    playingRef.current = playing;
    const visit = visitRef.current;
    if (!visit) return;
    visit.clock = setPlaying(
      visit.clock,
      Date.now(),
      playing,
      isDocumentVisible(),
    );
  }, []);

  return {
    onTimeUpdate,
    onLoop,
    onPlayingChange,
    flush,
  };
}
