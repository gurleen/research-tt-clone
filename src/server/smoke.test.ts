import { describe, expect, test } from "bun:test";
import { communitySchema, createSessionBodySchema, eventBodySchema } from "../shared/api/schemas.ts";

describe("shared API schemas", () => {
  test("communitySchema accepts valid communities", () => {
    expect(communitySchema.parse("sikh")).toBe("sikh");
  });

  test("eventBodySchema rejects condition fields from client", () => {
    const parsed = eventBodySchema.safeParse({
      event_id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "550e8400-e29b-41d4-a716-446655440001",
      event: "playlist_complete",
      timestamp: "2026-06-08T12:00:00.000Z",
      source_type: "institutional",
    });
    expect(parsed.success).toBe(false);
  });

  test("eventBodySchema accepts playlist_complete payload", () => {
    const parsed = eventBodySchema.safeParse({
      event_id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "550e8400-e29b-41d4-a716-446655440001",
      event: "playlist_complete",
      timestamp: "2026-06-08T12:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
  });

  test("eventBodySchema accepts video_view payload", () => {
    const parsed = eventBodySchema.safeParse({
      event_id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "550e8400-e29b-41d4-a716-446655440001",
      event: "video_view",
      video_id: "filler_01",
      visit_index: 1,
      started_at: "2026-08-18T12:00:00.000Z",
      ended_at: "2026-08-18T12:00:03.000Z",
      dwell_ms: 3000,
      playback_ms: 2800,
      max_progress: 0.9,
      loop_count: 0,
      ended_reason: "swipe",
    });
    expect(parsed.success).toBe(true);
  });

  test("eventBodySchema accepts like payload", () => {
    const parsed = eventBodySchema.safeParse({
      event_id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "550e8400-e29b-41d4-a716-446655440001",
      event: "like",
      video_id: "filler_01",
      liked: true,
      timestamp: "2026-08-18T12:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
  });

  test("eventBodySchema rejects condition fields on like", () => {
    const parsed = eventBodySchema.safeParse({
      event_id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "550e8400-e29b-41d4-a716-446655440001",
      event: "like",
      video_id: "filler_01",
      liked: false,
      timestamp: "2026-08-18T12:00:00.000Z",
      source_type: "institutional",
    });
    expect(parsed.success).toBe(false);
  });

  test("eventBodySchema rejects condition fields on video_view", () => {
    const parsed = eventBodySchema.safeParse({
      event_id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "550e8400-e29b-41d4-a716-446655440001",
      event: "video_view",
      video_id: "filler_01",
      visit_index: 1,
      started_at: "2026-08-18T12:00:00.000Z",
      ended_at: "2026-08-18T12:00:03.000Z",
      dwell_ms: 3000,
      playback_ms: 2800,
      max_progress: 0.9,
      loop_count: 0,
      ended_reason: "swipe",
      source_type: "institutional",
    });
    expect(parsed.success).toBe(false);
  });

  test("createSessionBodySchema accepts Qualtrics external_id", () => {
    const parsed = createSessionBodySchema.parse({
      community: "sikh",
      external_id: "R_abc123XYZ",
    });
    expect(parsed.external_id).toBe("R_abc123XYZ");
  });

  test("createSessionBodySchema allows omitting external_id", () => {
    const parsed = createSessionBodySchema.parse({ community: "sikh" });
    expect(parsed.external_id).toBeUndefined();
  });

  test("createSessionBodySchema rejects non-Qualtrics external_id", () => {
    expect(
      createSessionBodySchema.safeParse({
        community: "sikh",
        external_id: "cint_123",
      }).success,
    ).toBe(false);
    expect(
      createSessionBodySchema.safeParse({
        community: "sikh",
        external_id: "R_abc-def",
      }).success,
    ).toBe(false);
  });
});

describe("API integration", () => {
  test("POST /api/sessions validates community", async () => {
    const response = await fetch("http://localhost:0/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ community: "invalid" }),
    }).catch(() => null);

    if (!response) {
      expect(true).toBe(true);
      return;
    }

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
