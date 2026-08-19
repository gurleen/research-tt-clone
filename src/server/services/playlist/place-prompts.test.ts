import { describe, expect, test } from "bun:test";
import type { VideoType } from "../../../shared/api/events.ts";
import {
  placePrompts,
  type PlaylistSlot,
  type PromptPlacementConfig,
} from "./place-prompts.ts";

function slot(id: string, videoType: VideoType): PlaylistSlot {
  return {
    video_id: id,
    video_type: videoType,
    show_interest_prompt: false,
  };
}

function flaggedIds(slots: PlaylistSlot[], videoType?: VideoType): string[] {
  return slots
    .filter((item) => item.show_interest_prompt)
    .filter((item) => (videoType ? item.video_type === videoType : true))
    .map((item) => item.video_id);
}

const mixedPlaylist: PlaylistSlot[] = [
  slot("f0", "filler"),
  slot("i0", "ingroup"),
  slot("f1", "filler"),
  slot("f2", "filler"),
  slot("i1", "ingroup"),
  slot("f3", "filler"),
  slot("i2", "ingroup"),
  slot("f4", "filler"),
];

describe("placePrompts", () => {
  test("never flags fillers when probability is 0", () => {
    const result = placePrompts(mixedPlaylist, {
      prompt_probability: 0,
      prompt_min_spacing: 1,
    });

    expect(flaggedIds(result, "filler")).toEqual([]);
  });

  test("guarantees at least one stimulus prompt when probability is 0", () => {
    const result = placePrompts(mixedPlaylist, {
      prompt_probability: 0,
      prompt_min_spacing: 1,
    });

    expect(flaggedIds(result, "ingroup")).toHaveLength(1);
    expect(flaggedIds(result, "filler")).toEqual([]);
  });

  test("treats control videos as stimulus for the topic prompt", () => {
    const playlist = [
      slot("f0", "filler"),
      slot("c0", "control"),
      slot("f1", "filler"),
      slot("c1", "control"),
    ];

    const result = placePrompts(playlist, {
      prompt_probability: 0,
      prompt_min_spacing: 1,
    });

    expect(flaggedIds(result, "control")).toHaveLength(1);
    expect(flaggedIds(result, "filler")).toEqual([]);
  });

  test("does not invent a stimulus prompt when the playlist is fillers only", () => {
    const playlist = [slot("f0", "filler"), slot("f1", "filler")];
    const result = placePrompts(playlist, {
      prompt_probability: 0,
      prompt_min_spacing: 1,
    });

    expect(flaggedIds(result)).toEqual([]);
  });

  test("flags every eligible slot when probability is 1 and spacing is 0", () => {
    const result = placePrompts(mixedPlaylist, {
      prompt_probability: 1,
      prompt_min_spacing: 0,
    });

    expect(flaggedIds(result, "ingroup").sort()).toEqual(["i0", "i1", "i2"]);
    expect(flaggedIds(result, "filler").sort()).toEqual([
      "f0",
      "f1",
      "f2",
      "f3",
      "f4",
    ]);
  });

  test("enforces min spacing independently within each pool", () => {
    const result = placePrompts(mixedPlaylist, {
      prompt_probability: 1,
      prompt_min_spacing: 1,
    });

    expect(flaggedIds(result, "ingroup")).toEqual(["i0", "i2"]);
    expect(flaggedIds(result, "filler")).toEqual(["f0", "f2", "f4"]);
  });

  test("does not mutate the input slots", () => {
    const config: PromptPlacementConfig = {
      prompt_probability: 1,
      prompt_min_spacing: 0,
    };
    const original = mixedPlaylist.map((item) => ({ ...item }));
    placePrompts(mixedPlaylist, config);
    expect(mixedPlaylist).toEqual(original);
  });
});
