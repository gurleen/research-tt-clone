import { db } from "../../db/client.ts";
import { ApiError } from "../../lib/http.ts";
import { randomIntInclusive, sampleWithoutReplacement } from "../../lib/random.ts";
import type { Community, SessionVideoInsert, SourceType } from "../../db/tables.ts";
import { placePrompts } from "./place-prompts.ts";
import {
  LEADING_FILLER_COUNT,
  MIN_FILLERS_BETWEEN_INGROUP,
  ensureTrailingFiller,
  hasTrailingFiller,
  minFillerCountForIngroupSpacing,
  shuffleIngroupIntoFiller,
} from "./shuffle-ingroup-filler.ts";

export type PlaylistSlot = {
  video_id: string;
  show_interest_prompt: boolean;
};

export async function composePlaylistSlots(
  community: Community,
  sourceType: SourceType,
): Promise<PlaylistSlot[]> {
  const { data: config, error: configError } = await db
    .from("experiment_config")
    .select("*")
    .eq("community", community)
    .maybeSingle();

  if (configError) {
    throw new Error(`Failed to load experiment config: ${configError.message}`);
  }
  if (!config) {
    throw new ApiError(
      503,
      `Experiment config not found for community: ${community}`,
    );
  }

  const stimulusCount = randomIntInclusive(
    config.ingroup_count_min,
    config.ingroup_count_max,
  );
  const minFillerForSpacing = minFillerCountForIngroupSpacing(stimulusCount);
  const fillerCount = Math.max(
    randomIntInclusive(config.filler_count_min, config.filler_count_max),
    minFillerForSpacing,
  );

  if (fillerCount > config.filler_count_max) {
    throw new ApiError(
      503,
      `Experiment config cannot satisfy ingroup spacing: need at least ${minFillerForSpacing} filler videos for ${stimulusCount} ingroup (${LEADING_FILLER_COUNT} before the first, then ${MIN_FILLERS_BETWEEN_INGROUP} between each), but filler_count_max is ${config.filler_count_max}`,
    );
  }

  const isControl = sourceType === "control";
  const stimulusQuery = isControl
    ? db
        .from("videos")
        .select("*")
        .eq("video_type", "control")
        .eq("active", true)
    : db
        .from("videos")
        .select("*")
        .eq("video_type", "ingroup")
        .eq("community", community)
        .eq("source_type", sourceType)
        .eq("active", true);

  const { data: stimulusPool, error: stimulusError } = await stimulusQuery;

  if (stimulusError) {
    throw new Error(
      `Failed to load ${isControl ? "control" : "ingroup"} videos: ${stimulusError.message}`,
    );
  }

  const { data: fillerPool, error: fillerError } = await db
    .from("videos")
    .select("*")
    .eq("video_type", "filler")
    .eq("active", true);

  if (fillerError) {
    throw new Error(`Failed to load filler videos: ${fillerError.message}`);
  }

  if ((stimulusPool?.length ?? 0) < stimulusCount) {
    throw new ApiError(
      503,
      isControl
        ? "Not enough control videos in catalog"
        : `Not enough ingroup videos for ${community}/${sourceType}`,
    );
  }
  if ((fillerPool?.length ?? 0) < fillerCount) {
    throw new ApiError(503, "Not enough filler videos in catalog");
  }

  const selectedStimulus = sampleWithoutReplacement(
    stimulusPool!,
    stimulusCount,
  );
  const selectedFiller = sampleWithoutReplacement(fillerPool!, fillerCount);
  const unusedFillers = fillerPool!.filter(
    (video) =>
      !selectedFiller.some((picked) => picked.video_id === video.video_id),
  );
  const extraFiller =
    unusedFillers.length > 0
      ? sampleWithoutReplacement(unusedFillers, 1)[0]
      : undefined;

  const shuffled = shuffleIngroupIntoFiller(selectedStimulus, selectedFiller);
  if (!hasTrailingFiller(shuffled) && extraFiller == null) {
    throw new ApiError(
      503,
      "Not enough filler videos in catalog to end playlist on a filler",
    );
  }

  const slots = placePrompts(
    ensureTrailingFiller(shuffled, extraFiller),
    config,
  );

  return slots.map((slot) => ({
    video_id: slot.video_id,
    show_interest_prompt: slot.show_interest_prompt,
  }));
}

export async function composePlaylist(
  sessionId: string,
  community: Community,
  sourceType: SourceType,
): Promise<SessionVideoInsert[]> {
  const slots = await composePlaylistSlots(community, sourceType);

  return slots.map((slot, position) => ({
    session_id: sessionId,
    position,
    video_id: slot.video_id,
    show_interest_prompt: slot.show_interest_prompt,
  }));
}
