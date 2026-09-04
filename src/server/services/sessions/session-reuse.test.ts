import { describe, expect, test } from "bun:test";
import {
  isSessionLinkReusable,
  shouldReplayDemoSession,
} from "./session-reuse.ts";

describe("session link reuse", () => {
  test("study sessions are reusable only while in progress", () => {
    expect(
      isSessionLinkReusable({ demo_mode: false, status: "in_progress" }),
    ).toBe(true);
    expect(
      isSessionLinkReusable({ demo_mode: false, status: "playlist_complete" }),
    ).toBe(false);
    expect(
      isSessionLinkReusable({ demo_mode: false, status: "survey_complete" }),
    ).toBe(false);
    expect(
      isSessionLinkReusable({ demo_mode: false, status: "debriefed" }),
    ).toBe(false);
  });

  test("demo sessions stay reusable after the playlist is finished", () => {
    expect(
      isSessionLinkReusable({ demo_mode: true, status: "in_progress" }),
    ).toBe(true);
    expect(
      isSessionLinkReusable({ demo_mode: true, status: "playlist_complete" }),
    ).toBe(true);
    expect(
      isSessionLinkReusable({ demo_mode: true, status: "survey_complete" }),
    ).toBe(true);
    expect(
      isSessionLinkReusable({ demo_mode: true, status: "debriefed" }),
    ).toBe(true);
  });

  test("completed demo sessions replay from the start on the next open", () => {
    expect(
      shouldReplayDemoSession({ demo_mode: true, status: "playlist_complete" }),
    ).toBe(true);
    expect(
      shouldReplayDemoSession({ demo_mode: true, status: "in_progress" }),
    ).toBe(false);
    expect(
      shouldReplayDemoSession({
        demo_mode: false,
        status: "playlist_complete",
      }),
    ).toBe(false);
  });
});
