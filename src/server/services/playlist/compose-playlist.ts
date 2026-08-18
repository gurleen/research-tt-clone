import { db } from "../../db/client.ts";
import { ApiError } from "../../lib/http.ts";
import { randomIntInclusive, sampleWithoutReplacement } from "../../lib/random.ts";
import type { Community, SessionVideoInsert, SourceType } from "../../db/tables.ts";
import { placePrompts } from "./place-prompts.ts";
import {
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

  const ingroupCount = randomIntInclusive(
    config.ingroup_count_min,
    config.ingroup_count_max,
  );
  const minFillerForSpacing = minFillerCountForIngroupSpacing(ingroupCount);
  const fillerCount = Math.max(
    randomIntInclusive(config.filler_count_min, config.filler_count_max),
    minFillerForSpacing,
  );

  if (fillerCount > config.filler_count_max) {
    throw new ApiError(
      503,
      `Experiment config cannot satisfy ingroup spacing: need at least ${minFillerForSpacing} filler videos for ${ingroupCount} ingroup, but filler_count_max is ${config.filler_count_max}`,
    );
  }

  const { data: ingroupPool, error: ingroupError } = await db
    .from("videos")
    .select("*")
    .eq("video_type", "ingroup")
    .eq("community", community)
    .eq("source_type", sourceType)
    .eq("active", true);

  if (ingroupError) {
    throw new Error(`Failed to load ingroup videos: ${ingroupError.message}`);
  }

  const { data: fillerPool, error: fillerError } = await db
    .from("videos")
    .select("*")
    .eq("video_type", "filler")
    .eq("active", true);

  if (fillerError) {
    throw new Error(`Failed to load filler videos: ${fillerError.message}`);
  }

  if ((ingroupPool?.length ?? 0) < ingroupCount) {
    throw new ApiError(
      503,
      `Not enough ingroup videos for ${community}/${sourceType}`,
    );
  }
  if ((fillerPool?.length ?? 0) < fillerCount) {
    throw new ApiError(503, "Not enough filler videos in catalog");
  }

  const selectedIngroup = sampleWithoutReplacement(ingroupPool!, ingroupCount);
  const selectedFiller = sampleWithoutReplacement(fillerPool!, fillerCount);

  const slots = placePrompts(
    shuffleIngroupIntoFiller(selectedIngroup, selectedFiller),
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
