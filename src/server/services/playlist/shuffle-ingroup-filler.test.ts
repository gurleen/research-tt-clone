import { describe, expect, test } from "bun:test";
import type { VideoRow } from "../../db/tables.ts";
import {
  hasValidIngroupSpacing,
  minFillerCountForIngroupSpacing,
  shuffleIngroupIntoFiller,
} from "./shuffle-ingroup-filler.ts";

function mockVideo(id: string, type: "ingroup" | "filler" | "control"): VideoRow {
  return {
    video_id: id,
    video_type: type,
    community: type === "ingroup" ? "sikh" : null,
    source_type: type === "ingroup" ? "micro_influencer" : null,
    media_url: `https://example.com/${id}.mp4`,
    profile_thumbnail_url: `https://example.com/${id}.jpg`,
    account_name: "Creator",
    account_handle: "@creator",
    duration_ms: 1000,
    central_issue: null,
    created_at: "2026-01-01T00:00:00.000Z",
    active: true,
    caption: "",
    like_count: 0,
    comment_count: 0,
    follower_count: 0,
    share_count: 0,
    save_count: 0,
    comments: [],
  };
}

describe("minFillerCountForIngroupSpacing", () => {
  test("requires two fillers between each ingroup pair", () => {
    expect(minFillerCountForIngroupSpacing(1)).toBe(0);
    expect(minFillerCountForIngroupSpacing(3)).toBe(4);
    expect(minFillerCountForIngroupSpacing(5)).toBe(8);
  });
});

describe("shuffleIngroupIntoFiller", () => {
  test("keeps 2 filler videos between consecutive ingroup slots", () => {
    const ingroup = [
      mockVideo("ingroup_1", "ingroup"),
      mockVideo("ingroup_2", "ingroup"),
      mockVideo("ingroup_3", "ingroup"),
    ];
    const filler = Array.from({ length: 8 }, (_, index) =>
      mockVideo(`filler_${index}`, "filler"),
    );

    for (let run = 0; run < 50; run++) {
      const slots = shuffleIngroupIntoFiller(ingroup, filler);
      expect(slots).toHaveLength(ingroup.length + filler.length);
      expect(hasValidIngroupSpacing(slots)).toBe(true);
    }
  });

  test("throws when filler count is too low for spacing", () => {
    const ingroup = [
      mockVideo("ingroup_1", "ingroup"),
      mockVideo("ingroup_2", "ingroup"),
      mockVideo("ingroup_3", "ingroup"),
    ];
    const filler = [mockVideo("filler_0", "filler")];

    expect(() => shuffleIngroupIntoFiller(ingroup, filler)).toThrow(
      /need at least 4, have 1/,
    );
  });

  test("allows a single ingroup with any filler count", () => {
    const slots = shuffleIngroupIntoFiller(
      [mockVideo("ingroup_1", "ingroup")],
      [mockVideo("filler_0", "filler"), mockVideo("filler_1", "filler")],
    );

    expect(slots).toHaveLength(3);
    expect(slots.filter((slot) => slot.video_type === "ingroup")).toHaveLength(1);
  });

  test("keeps 2 filler videos between consecutive control slots", () => {
    const control = [
      mockVideo("control_1", "control"),
      mockVideo("control_2", "control"),
    ];
    const filler = Array.from({ length: 6 }, (_, index) =>
      mockVideo(`filler_${index}`, "filler"),
    );

    for (let run = 0; run < 20; run++) {
      const slots = shuffleIngroupIntoFiller(control, filler);
      expect(slots.filter((slot) => slot.video_type === "control")).toHaveLength(
        2,
      );
      expect(hasValidIngroupSpacing(slots)).toBe(true);
    }
  });
});
