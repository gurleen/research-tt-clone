import { describe, expect, test } from "bun:test";
import { eventBodySchema } from "../shared/api/schemas.ts";
import {
  allocateVisitIndex,
  applyPlaybackProgress,
  buildVideoViewEvent,
  createDwellClock,
  detectLoopWrap,
  freezeClock,
  noteLoop,
  parseVisitCounts,
  progressUnits,
  setDocumentVisible,
  setPlaying,
  shouldShowContinue,
} from "./video-dwell.ts";

describe("video dwell helpers", () => {
  test("allocateVisitIndex increments per video", () => {
    const first = allocateVisitIndex({}, "a");
    expect(first.visitIndex).toBe(1);
    const second = allocateVisitIndex(first.counts, "a");
    expect(second.visitIndex).toBe(2);
    const other = allocateVisitIndex(second.counts, "b");
    expect(other.visitIndex).toBe(1);
  });

  test("parseVisitCounts ignores invalid storage", () => {
    expect(parseVisitCounts(null)).toEqual({});
    expect(parseVisitCounts("not-json")).toEqual({});
    expect(parseVisitCounts(JSON.stringify({ a: 2, b: "x" }))).toEqual({
      a: 2,
    });
  });

  test("max_progress exceeds 1 after a loop", () => {
    let clock = createDwellClock(0, true);
    clock = applyPlaybackProgress(clock, 9, 10);
    expect(clock.maxProgress).toBeCloseTo(0.9);
    clock = noteLoop(clock);
    clock = applyPlaybackProgress(clock, 3, 10);
    expect(clock.maxProgress).toBeCloseTo(1.3);
    expect(progressUnits(1, 3, 10)).toBeCloseTo(1.3);
  });

  test("detectLoopWrap fires when time wraps near the end", () => {
    expect(detectLoopWrap(9.5, 0.1, 10)).toBe(true);
    expect(detectLoopWrap(0, 0.1, 10)).toBe(false);
    expect(detectLoopWrap(4, 4.2, 10)).toBe(false);
  });

  test("playback pauses while dwell continues", () => {
    let clock = createDwellClock(0, true);
    clock = setPlaying(clock, 0, true, true);
    clock = setPlaying(clock, 400, false, true);
    const frozen = freezeClock(clock, 1000);
    expect(frozen.playback_ms).toBe(400);
    expect(frozen.dwell_ms).toBe(1000);
  });

  test("hidden pauses both dwell and playback", () => {
    let clock = createDwellClock(0, true);
    clock = setPlaying(clock, 0, true, true);
    clock = setDocumentVisible(clock, 250, false, true);
    const frozen = freezeClock(clock, 900);
    expect(frozen.dwell_ms).toBe(250);
    expect(frozen.playback_ms).toBe(250);
  });

  test("buildVideoViewEvent matches the ingest payload", () => {
    const body = buildVideoViewEvent({
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      sessionId: "550e8400-e29b-41d4-a716-446655440001",
      videoId: "filler_01",
      visitIndex: 2,
      startedAtMs: Date.parse("2026-08-18T12:00:00.000Z"),
      endedAtMs: Date.parse("2026-08-18T12:00:04.000Z"),
      dwellMs: 4000,
      playbackMs: 3200,
      maxProgress: 1.25,
      loopCount: 1,
      endedReason: "swipe",
    });
    const parsed = eventBodySchema.safeParse(body);
    expect(parsed.success).toBe(true);
    expect(body.event).toBe("video_view");
    expect(body.visit_index).toBe(2);
    expect(body.ended_reason).toBe("swipe");
  });

  test("shouldShowContinue is true only on the last slide", () => {
    expect(shouldShowContinue(0, 0)).toBe(false);
    expect(shouldShowContinue(0, 3)).toBe(false);
    expect(shouldShowContinue(2, 3)).toBe(true);
  });
});
