import { describe, expect, test } from "bun:test";
import { secondsToDurationMs } from "../../../admin/lib/read-video-duration.ts";
import {
  stimulusObjectKey,
  stimulusPrefix,
} from "./object-keys.ts";

describe("secondsToDurationMs", () => {
  test("rounds seconds to integer milliseconds", () => {
    expect(secondsToDurationMs(12.345)).toBe(12345);
    expect(secondsToDurationMs(1)).toBe(1000);
  });
});

describe("stimulus object keys", () => {
  test("stimulusObjectKey builds upload path", () => {
    expect(stimulusObjectKey("ingroup_sikh_micro_01", "media", "mp4")).toBe(
      "stimulus/ingroup_sikh_micro_01/media.mp4",
    );
  });

  test("stimulusPrefix groups objects for a video", () => {
    expect(stimulusPrefix("ingroup_sikh_micro_01")).toBe(
      "stimulus/ingroup_sikh_micro_01/",
    );
  });
});
