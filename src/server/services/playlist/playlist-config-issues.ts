import type { SourceType } from "../../db/tables.ts";
import {
  MIN_FILLERS_BETWEEN_INGROUP,
  minFillerCountForIngroupSpacing,
} from "./shuffle-ingroup-filler.ts";

export type PlaylistCountSettings = {
  ingroup_count_min: number;
  ingroup_count_max: number;
  filler_count_min: number;
  filler_count_max: number;
};

export type PlaylistCatalogCounts = {
  filler: number;
  ingroup: Record<SourceType, number>;
};

export type PlaylistVideoCountRow = {
  video_type: "ingroup" | "filler";
  community: string | null;
  source_type: SourceType | null;
};

export type PlaylistConfigIssueKind =
  | "spacing"
  | "catalog_filler"
  | "catalog_ingroup";

export type PlaylistConfigIssue = {
  kind: PlaylistConfigIssueKind;
  message: string;
};

const SOURCE_TYPES: SourceType[] = ["micro_influencer", "institutional"];

export function spacingImpossibleMessage(
  ingroupCountMax: number,
  fillerCountMax: number,
): string | null {
  const minFillers = minFillerCountForIngroupSpacing(ingroupCountMax);
  if (fillerCountMax >= minFillers) {
    return null;
  }

  return `Need at least ${minFillers} filler videos for ${ingroupCountMax} ingroup videos (minimum ${MIN_FILLERS_BETWEEN_INGROUP} fillers between each ingroup).`;
}

export function catalogCountsFromVideos(
  videos: PlaylistVideoCountRow[],
  community: string,
): PlaylistCatalogCounts {
  const ingroup: Record<SourceType, number> = {
    micro_influencer: 0,
    institutional: 0,
  };
  let filler = 0;

  for (const video of videos) {
    if (video.video_type === "filler") {
      filler += 1;
      continue;
    }

    if (video.community !== community || video.source_type == null) {
      continue;
    }

    ingroup[video.source_type] += 1;
  }

  return { filler, ingroup };
}

function pluralVideos(count: number): string {
  return count === 1 ? "video" : "videos";
}

export function playlistConfigIssues(
  settings: PlaylistCountSettings,
  catalog?: PlaylistCatalogCounts | null,
): PlaylistConfigIssue[] {
  const issues: PlaylistConfigIssue[] = [];

  const spacing = spacingImpossibleMessage(
    settings.ingroup_count_max,
    settings.filler_count_max,
  );
  if (spacing) {
    issues.push({ kind: "spacing", message: spacing });
  }

  if (!catalog) {
    return issues;
  }

  if (catalog.filler < settings.filler_count_min) {
    issues.push({
      kind: "catalog_filler",
      message: `Only ${catalog.filler} active filler ${pluralVideos(catalog.filler)} uploaded; filler count min is ${settings.filler_count_min}.`,
    });
  } else if (catalog.filler < settings.filler_count_max) {
    issues.push({
      kind: "catalog_filler",
      message: `Only ${catalog.filler} active filler ${pluralVideos(catalog.filler)} uploaded; filler count max is ${settings.filler_count_max}.`,
    });
  }

  for (const sourceType of SOURCE_TYPES) {
    const available = catalog.ingroup[sourceType];
    if (available >= settings.ingroup_count_max) {
      continue;
    }

    const label = sourceType.replaceAll("_", " ");
    issues.push({
      kind: "catalog_ingroup",
      message: `Only ${available} active ${label} ingroup ${pluralVideos(available)} uploaded; ingroup count max is ${settings.ingroup_count_max}.`,
    });
  }

  return issues;
}
