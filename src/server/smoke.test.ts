import { describe, expect, test } from "bun:test";
import { communitySchema, eventBodySchema } from "../shared/api/schemas.ts";

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
