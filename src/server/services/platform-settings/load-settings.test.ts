import { describe, expect, test } from "bun:test";
import { buildSurveyUrl } from "./load-settings.ts";

describe("buildSurveyUrl", () => {
  test("replaces session_id, external_id, and status placeholders", () => {
    const url = buildSurveyUrl(
      "sess-1",
      "https://survey.example.com?sid={session_id}&eid={external_id}&st={status}",
      { externalId: "R_abc123", status: "playlist_complete" },
    );
    expect(url).toBe(
      "https://survey.example.com?sid=sess-1&eid=R_abc123&st=playlist_complete",
    );
  });

  test("appends external_id and status when placeholders are absent", () => {
    const url = buildSurveyUrl(
      "sess-1",
      "https://survey.example.com?session_id={session_id}",
      { externalId: "R_abc123", status: "playlist_complete" },
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get("session_id")).toBe("sess-1");
    expect(parsed.searchParams.get("external_id")).toBe("R_abc123");
    expect(parsed.searchParams.get("status")).toBe("playlist_complete");
    expect(parsed.searchParams.has("source_type")).toBe(false);
  });

  test("does not leak source_type", () => {
    const url = buildSurveyUrl(
      "sess-1",
      "https://survey.example.com?session_id={session_id}",
      { externalId: "R_abc123", status: "playlist_complete" },
    );
    expect(url).not.toContain("source_type");
    expect(url).not.toContain("institutional");
    expect(url).not.toContain("micro_influencer");
  });
});
