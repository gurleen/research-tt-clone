import {
  TREATMENT_SOURCE_TYPES,
  type TreatmentSourceType,
  type VideoType,
} from "../../../shared/api/events.ts";
import {
  LEADING_FILLER_COUNT,
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
  control: number;
  ingroup: Record<TreatmentSourceType, number>;
};

export type PlaylistVideoCountRow = {
  video_type: VideoType;
  community: string | null;
  source_type: TreatmentSourceType | "control" | null;
};

export type PlaylistConfigIssueKind =
  | "spacing"
  | "catalog_filler"
  | "catalog_control"
  | "catalog_ingroup";

export type PlaylistConfigIssue = {
  kind: PlaylistConfigIssueKind;
  message: string;
};

function emptyIngroupCounts(): Record<TreatmentSourceType, number> {
  return Object.fromEntries(
    TREATMENT_SOURCE_TYPES.map((type) => [type, 0]),
  ) as Record<TreatmentSourceType, number>;
}

function isTreatmentSourceType(
  value: string | null,
): value is TreatmentSourceType {
  return TREATMENT_SOURCE_TYPES.includes(value as TreatmentSourceType);
}

export function spacingImpossibleMessage(
  ingroupCountMax: number,
  fillerCountMax: number,
): string | null {
  const minFillers = minFillerCountForIngroupSpacing(ingroupCountMax);
  if (fillerCountMax >= minFillers) {
    return null;
  }

  return `Need at least ${minFillers} filler videos for ${ingroupCountMax} ingroup videos (${LEADING_FILLER_COUNT} fillers before the first ingroup, then ${MIN_FILLERS_BETWEEN_INGROUP} between each).`;
}

export function catalogCountsFromVideos(
  videos: PlaylistVideoCountRow[],
  community: string,
): PlaylistCatalogCounts {
  const ingroup = emptyIngroupCounts();
  let filler = 0;
  let control = 0;

  for (const video of videos) {
    if (video.video_type === "filler") {
      filler += 1;
      continue;
    }

    if (video.video_type === "control") {
      control += 1;
      continue;
    }

    if (video.community !== community || !isTreatmentSourceType(video.source_type)) {
      continue;
    }

    ingroup[video.source_type] += 1;
  }

  return { filler, control, ingroup };
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

  const layoutFloor = minFillerCountForIngroupSpacing(
    settings.ingroup_count_max,
  );

  if (
    catalog.filler < settings.filler_count_min &&
    settings.filler_count_min >= layoutFloor
  ) {
    issues.push({
      kind: "catalog_filler",
      message: `Only ${catalog.filler} active filler ${pluralVideos(catalog.filler)} uploaded; filler count min is ${settings.filler_count_min}.`,
    });
  } else if (catalog.filler < layoutFloor) {
    issues.push({
      kind: "catalog_filler",
      message: `Only ${catalog.filler} active filler ${pluralVideos(catalog.filler)} uploaded; need at least ${layoutFloor} for ${LEADING_FILLER_COUNT} leading fillers plus ${MIN_FILLERS_BETWEEN_INGROUP} between each ingroup.`,
    });
  } else if (catalog.filler < settings.filler_count_max) {
    issues.push({
      kind: "catalog_filler",
      message: `Only ${catalog.filler} active filler ${pluralVideos(catalog.filler)} uploaded; filler count max is ${settings.filler_count_max}.`,
    });
  }

  if (catalog.control < settings.ingroup_count_max) {
    issues.push({
      kind: "catalog_control",
      message: `Only ${catalog.control} active control ${pluralVideos(catalog.control)} uploaded; ingroup count max is ${settings.ingroup_count_max}.`,
    });
  }

  for (const sourceType of TREATMENT_SOURCE_TYPES) {
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
