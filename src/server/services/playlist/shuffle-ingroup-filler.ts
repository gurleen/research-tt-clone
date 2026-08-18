import {
  randomIntInclusive,
  shuffleInPlace,
} from "../../lib/random.ts";
import type { VideoRow } from "../../db/tables.ts";
import type { PlaylistSlot } from "./place-prompts.ts";

export const MIN_FILLERS_BETWEEN_INGROUP = 1;
export const MAX_FILLERS_BETWEEN_INGROUP = 2;

export function minFillerCountForIngroupSpacing(ingroupCount: number): number {
  if (ingroupCount <= 1) {
    return 0;
  }
  return (ingroupCount - 1) * MIN_FILLERS_BETWEEN_INGROUP;
}

function toFillerSlot(video: VideoRow): PlaylistSlot {
  return {
    video_id: video.video_id,
    video_type: "filler",
    show_interest_prompt: false,
  };
}

function toIngroupSlot(video: VideoRow): PlaylistSlot {
  return {
    video_id: video.video_id,
    video_type: "ingroup",
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

/** True when every pair of consecutive ingroup slots has 1–2 fillers between them. */
export function hasValidIngroupSpacing(slots: PlaylistSlot[]): boolean {
  const ingroupIndices = slots
    .map((slot, index) => (slot.video_type === "ingroup" ? index : -1))
    .filter((index) => index >= 0);

  for (let i = 1; i < ingroupIndices.length; i++) {
    const gap = fillerCountBetween(
      slots,
      ingroupIndices[i - 1]!,
      ingroupIndices[i]!,
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

/**
 * Interleave ingroup videos into filler with 1–2 filler videos between each
 * consecutive ingroup slot. Extra filler goes to the start and/or end.
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

  if (ingroupCount === 1) {
    const startPadding = randomIntInclusive(0, fillerCount);
    return [
      ...shuffledFiller.slice(0, startPadding).map(toFillerSlot),
      toIngroupSlot(shuffledIngroup[0]!),
      ...shuffledFiller.slice(startPadding).map(toFillerSlot),
    ];
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

  const startPadding = spare > 0 ? randomIntInclusive(0, spare) : 0;
  const endPadding = spare - startPadding;

  const result: PlaylistSlot[] = [];
  let fillerIndex = 0;

  const takeFiller = (count: number): PlaylistSlot[] => {
    const chunk = shuffledFiller.slice(fillerIndex, fillerIndex + count);
    fillerIndex += count;
    return chunk.map(toFillerSlot);
  };

  result.push(...takeFiller(startPadding));

  for (let i = 0; i < ingroupCount; i++) {
    result.push(toIngroupSlot(shuffledIngroup[i]!));
    if (i < gapCount) {
      result.push(...takeFiller(gaps[i]!));
    }
  }

  result.push(...takeFiller(endPadding));

  return result;
}
