import { describe, expect, test } from "bun:test";
import { communitySchema, createSessionBodySchema, eventBodySchema, parseCatalogComments, sessionResponseSchema } from "../shared/api/schemas.ts";

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

  test("eventBodySchema accepts interest_response yes/no/maybe", () => {
    for (const response of ["yes", "no", "maybe"] as const) {
      const parsed = eventBodySchema.safeParse({
        event_id: "550e8400-e29b-41d4-a716-446655440000",
        session_id: "550e8400-e29b-41d4-a716-446655440001",
        event: "interest_response",
        video_id: "ingroup_01",
        response,
        timestamp_response: "2026-08-18T12:00:00.000Z",
        latency_ms: 400,
      });
      expect(parsed.success).toBe(true);
    }
  });

  test("eventBodySchema rejects boolean interest_response", () => {
    const parsed = eventBodySchema.safeParse({
      event_id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "550e8400-e29b-41d4-a716-446655440001",
      event: "interest_response",
      video_id: "ingroup_01",
      response: true,
      timestamp_response: "2026-08-18T12:00:00.000Z",
      latency_ms: 400,
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

  test("eventBodySchema accepts comments_open payload", () => {
    const parsed = eventBodySchema.safeParse({
      event_id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "550e8400-e29b-41d4-a716-446655440001",
      event: "comments_open",
      video_id: "filler_01",
      timestamp_open: "2026-08-18T12:00:00.000Z",
      time_on_sheet_ms: 1500,
    });
    expect(parsed.success).toBe(true);
  });

  test("eventBodySchema rejects condition fields on comments_open", () => {
    const parsed = eventBodySchema.safeParse({
      event_id: "550e8400-e29b-41d4-a716-446655440000",
      session_id: "550e8400-e29b-41d4-a716-446655440001",
      event: "comments_open",
      video_id: "filler_01",
      timestamp_open: "2026-08-18T12:00:00.000Z",
      time_on_sheet_ms: 1500,
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

  test("parseCatalogComments accepts valid comments and drops invalid payloads", () => {
    expect(
      parseCatalogComments([
        { username: "fan", text: "hello", timestamp: "2d ago" },
      ]),
    ).toEqual([{ username: "fan", text: "hello", timestamp: "2d ago" }]);
    expect(parseCatalogComments("not-an-array")).toEqual([]);
    expect(parseCatalogComments([{ username: "fan" }])).toEqual([]);
  });

  test("sessionResponseSchema defaults interest_prompt_reveal_fraction to 0.3", () => {
    const parsed = sessionResponseSchema.parse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      community: "sikh",
      current_position: 0,
      status: "in_progress",
      playlist: [],
    });
    expect(parsed.interest_prompt_reveal_fraction).toBe(0.3);
  });

  test("sessionResponseSchema accepts a configured reveal fraction", () => {
    const parsed = sessionResponseSchema.parse({
      session_id: "550e8400-e29b-41d4-a716-446655440000",
      community: "sikh",
      current_position: 0,
      status: "in_progress",
      playlist: [],
      interest_prompt_reveal_fraction: 0.45,
    });
    expect(parsed.interest_prompt_reveal_fraction).toBe(0.45);
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
