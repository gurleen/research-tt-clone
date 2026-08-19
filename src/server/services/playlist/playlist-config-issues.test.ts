import { describe, expect, test } from "bun:test";
import {
  catalogCountsFromVideos,
  playlistConfigIssues,
  spacingImpossibleMessage,
  type PlaylistCatalogCounts,
  type PlaylistCountSettings,
} from "./playlist-config-issues.ts";

const ampleCatalog: PlaylistCatalogCounts = {
  filler: 10,
  ingroup: {
    micro_influencer: 5,
    institutional: 5,
    control: 5,
  },
};

const validCounts: PlaylistCountSettings = {
  ingroup_count_min: 3,
  ingroup_count_max: 4,
  filler_count_min: 7,
  filler_count_max: 8,
};

describe("spacingImpossibleMessage", () => {
  test("returns null when filler max covers the 2-filler gap", () => {
    expect(spacingImpossibleMessage(4, 8)).toBeNull();
    expect(spacingImpossibleMessage(1, 0)).toBeNull();
  });

  test("describes the required filler count for max ingroup", () => {
    expect(spacingImpossibleMessage(5, 3)).toBe(
      "Need at least 8 filler videos for 5 ingroup videos (minimum 2 fillers between each ingroup).",
    );
  });
});

describe("catalogCountsFromVideos", () => {
  test("counts shared fillers and per-community ingroup arms", () => {
    const counts = catalogCountsFromVideos(
      [
        { video_type: "filler", community: null, source_type: null },
        { video_type: "filler", community: null, source_type: null },
        {
          video_type: "ingroup",
          community: "sikh",
          source_type: "micro_influencer",
        },
        {
          video_type: "ingroup",
          community: "sikh",
          source_type: "institutional",
        },
        {
          video_type: "ingroup",
          community: "sikh",
          source_type: "control",
        },
        {
          video_type: "ingroup",
          community: "armenian",
          source_type: "micro_influencer",
        },
      ],
      "sikh",
    );

    expect(counts).toEqual({
      filler: 2,
      ingroup: {
        micro_influencer: 1,
        institutional: 1,
        control: 1,
      },
    });
  });
});

describe("playlistConfigIssues", () => {
  test("returns no issues when counts and catalog are feasible", () => {
    expect(playlistConfigIssues(validCounts, ampleCatalog)).toEqual([]);
  });

  test("flags spacing when filler max cannot separate ingroup videos", () => {
    const issues = playlistConfigIssues(
      {
        ingroup_count_min: 5,
        ingroup_count_max: 5,
        filler_count_min: 3,
        filler_count_max: 3,
      },
      ampleCatalog,
    );

    expect(issues).toEqual([
      {
        kind: "spacing",
        message:
          "Need at least 8 filler videos for 5 ingroup videos (minimum 2 fillers between each ingroup).",
      },
    ]);
  });

  test("flags filler catalog shortage against the configured min", () => {
    const issues = playlistConfigIssues(validCounts, {
      ...ampleCatalog,
      filler: 4,
    });

    expect(issues).toEqual([
      {
        kind: "catalog_filler",
        message:
          "Only 4 active filler videos uploaded; filler count min is 7.",
      },
    ]);
  });

  test("flags filler catalog shortage against the configured max", () => {
    const issues = playlistConfigIssues(validCounts, {
      ...ampleCatalog,
      filler: 7,
    });

    expect(issues).toEqual([
      {
        kind: "catalog_filler",
        message:
          "Only 7 active filler videos uploaded; filler count max is 8.",
      },
    ]);
  });

  test("flags a short ingroup arm", () => {
    const issues = playlistConfigIssues(validCounts, {
      ...ampleCatalog,
      ingroup: {
        micro_influencer: 5,
        institutional: 2,
        control: 5,
      },
    });

    expect(issues).toEqual([
      {
        kind: "catalog_ingroup",
        message:
          "Only 2 active institutional ingroup videos uploaded; ingroup count max is 4.",
      },
    ]);
  });

  test("flags a short control catalog", () => {
    const issues = playlistConfigIssues(validCounts, {
      ...ampleCatalog,
      ingroup: {
        micro_influencer: 5,
        institutional: 5,
        control: 1,
      },
    });

    expect(issues).toEqual([
      {
        kind: "catalog_ingroup",
        message:
          "Only 1 active control ingroup video uploaded; ingroup count max is 4.",
      },
    ]);
  });

  test("returns spacing without catalog when catalog is omitted", () => {
    const issues = playlistConfigIssues({
      ingroup_count_min: 5,
      ingroup_count_max: 5,
      filler_count_min: 3,
      filler_count_max: 3,
    });

    expect(issues.map((issue) => issue.kind)).toEqual(["spacing"]);
  });
});
