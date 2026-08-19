import type { VideoType } from "../../../shared/api/events.ts";
import { randomIntInclusive } from "../../lib/random.ts";

export type PlaylistSlot = {
  video_id: string;
  video_type: VideoType;
  show_interest_prompt: boolean;
};

export type PromptPlacementConfig = {
  prompt_probability: number;
  prompt_min_spacing: number;
};

function slotIndices(
  slots: PlaylistSlot[],
  predicate: (slot: PlaylistSlot) => boolean,
): number[] {
  return slots
    .map((slot, index) => (predicate(slot) ? index : -1))
    .filter((index) => index >= 0);
}

function isStimulus(slot: PlaylistSlot): boolean {
  return slot.video_type === "ingroup" || slot.video_type === "control";
}

function placeOnPool(
  slots: PlaylistSlot[],
  indices: number[],
  config: PromptPlacementConfig,
  options: { guaranteeAtLeastOne: boolean },
): void {
  if (indices.length === 0) {
    return;
  }

  let itemsSincePrompt = config.prompt_min_spacing;

  for (const index of indices) {
    itemsSincePrompt += 1;
    const spacingOk = itemsSincePrompt > config.prompt_min_spacing;
    const roll = Math.random() < Number(config.prompt_probability);

    if (spacingOk && roll) {
      slots[index]!.show_interest_prompt = true;
      itemsSincePrompt = 0;
    }
  }

  if (!options.guaranteeAtLeastOne) {
    return;
  }

  const hasPrompt = indices.some((index) => slots[index]!.show_interest_prompt);
  if (hasPrompt) {
    return;
  }

  const pick = indices[randomIntInclusive(0, indices.length - 1)]!;
  slots[pick]!.show_interest_prompt = true;
}

/**
 * Assign overlays independently to stimulus (ingroup/control) and filler slots.
 * Stimulus is guaranteed at least one prompt when any stimulus videos exist.
 */
export function placePrompts(
  slots: PlaylistSlot[],
  config: PromptPlacementConfig,
): PlaylistSlot[] {
  const result = slots.map((slot) => ({ ...slot }));

  placeOnPool(result, slotIndices(result, isStimulus), config, {
    guaranteeAtLeastOne: true,
  });
  placeOnPool(
    result,
    slotIndices(result, (slot) => slot.video_type === "filler"),
    config,
    { guaranteeAtLeastOne: false },
  );

  return result;
}
