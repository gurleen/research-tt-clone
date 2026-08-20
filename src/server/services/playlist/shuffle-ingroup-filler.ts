import {
  randomIntInclusive,
  shuffleInPlace,
} from "../../lib/random.ts";
import type { VideoRow } from "../../db/tables.ts";
import type { PlaylistSlot } from "./place-prompts.ts";

export const MIN_FILLERS_BETWEEN_INGROUP = 2;
export const MAX_FILLERS_BETWEEN_INGROUP = 2;
export const LEADING_FILLER_COUNT = 3;

export function minFillerCountForIngroupSpacing(ingroupCount: number): number {
  if (ingroupCount <= 0) {
    return 0;
  }
  return (
    LEADING_FILLER_COUNT +
    (ingroupCount - 1) * MIN_FILLERS_BETWEEN_INGROUP
  );
}

function toFillerSlot(video: VideoRow): PlaylistSlot {
  return {
    video_id: video.video_id,
    video_type: "filler",
    show_interest_prompt: false,
  };
}

function toStimulusSlot(video: VideoRow): PlaylistSlot {
  return {
    video_id: video.video_id,
    video_type: video.video_type,
    show_interest_prompt: false,
  };
}

/** Count filler slots strictly between two playlist indices (exclusive). */
export function fillerCountBetween(
  slots: PlaylistSlot[],
  fromIndex: number,
  toIndex: number,
): number {
  return slots
    .slice(fromIndex + 1, toIndex)
    .filter((slot) => slot.video_type === "filler").length;
}

/** True when every pair of consecutive non-filler slots has 2 fillers between them. */
export function hasValidIngroupSpacing(slots: PlaylistSlot[]): boolean {
  const stimulusIndices = slots
    .map((slot, index) => (slot.video_type !== "filler" ? index : -1))
    .filter((index) => index >= 0);

  for (let i = 1; i < stimulusIndices.length; i++) {
    const gap = fillerCountBetween(
      slots,
      stimulusIndices[i - 1]!,
      stimulusIndices[i]!,
    );
    if (
      gap < MIN_FILLERS_BETWEEN_INGROUP ||
      gap > MAX_FILLERS_BETWEEN_INGROUP
    ) {
      return false;
    }
  }

  return true;
}

/** True when the first stimulus is preceded by at least 3 fillers, or there is none. */
export function hasLeadingFillerBaseline(slots: PlaylistSlot[]): boolean {
  const firstStimulus = slots.findIndex((slot) => slot.video_type !== "filler");
  if (firstStimulus < 0) {
    return true;
  }
  return firstStimulus >= LEADING_FILLER_COUNT;
}

/**
 * Interleave ingroup videos into filler with 3 fillers before the first
 * stimulus and 2 filler videos between each consecutive ingroup slot.
 * Extra filler goes to the start and/or end.
 */
export function shuffleIngroupIntoFiller(
  ingroup: VideoRow[],
  filler: VideoRow[],
): PlaylistSlot[] {
  const shuffledIngroup = shuffleInPlace([...ingroup]);
  const shuffledFiller = shuffleInPlace([...filler]);

  const ingroupCount = shuffledIngroup.length;
  const fillerCount = shuffledFiller.length;

  if (ingroupCount === 0) {
    return shuffledFiller.map(toFillerSlot);
  }

  const minRequired = minFillerCountForIngroupSpacing(ingroupCount);
  if (fillerCount < minRequired) {
    throw new Error(
      `Not enough filler videos for spacing: need at least ${minRequired}, have ${fillerCount}`,
    );
  }

  const gapCount = ingroupCount - 1;
  const gaps = Array<number>(gapCount).fill(MIN_FILLERS_BETWEEN_INGROUP);
  let spare = fillerCount - minRequired;

  while (spare > 0) {
    const bumpable = gaps
      .map((gap, index) => (gap < MAX_FILLERS_BETWEEN_INGROUP ? index : -1))
      .filter((index) => index >= 0);

    if (bumpable.length === 0) {
      break;
    }

    const pick = bumpable[Math.floor(Math.random() * bumpable.length)]!;
    gaps[pick]!++;
    spare--;
  }

  const extraStart = spare > 0 ? randomIntInclusive(0, spare) : 0;
  const startPadding = LEADING_FILLER_COUNT + extraStart;
  const endPadding = spare - extraStart;

  const result: PlaylistSlot[] = [];
  let fillerIndex = 0;

  const takeFiller = (count: number): PlaylistSlot[] => {
    const chunk = shuffledFiller.slice(fillerIndex, fillerIndex + count);
    fillerIndex += count;
    return chunk.map(toFillerSlot);
  };

  result.push(...takeFiller(startPadding));

  for (let i = 0; i < ingroupCount; i++) {
    result.push(toStimulusSlot(shuffledIngroup[i]!));
    if (i < gapCount) {
      result.push(...takeFiller(gaps[i]!));
    }
  }

  result.push(...takeFiller(endPadding));

  return result;
}
