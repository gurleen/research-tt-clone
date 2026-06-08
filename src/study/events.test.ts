import { describe, expect, test } from "bun:test";
import { newEventId, nowIso } from "./events.ts";

describe("study events helpers", () => {
  test("newEventId returns a uuid", () => {
    expect(newEventId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test("nowIso returns an iso timestamp", () => {
    expect(nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
