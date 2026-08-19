import type { VideoType } from "../../../shared/api/events.ts";
import type { ExperimentConfigRow } from "../../db/tables.ts";

export type PlaylistSlot = {
  video_id: string;
  video_type: VideoType;
  show_interest_prompt: boolean;
};

/**
 * Assign interest prompts to filler slots using configured probability and spacing.
 */
export function placePrompts(
  slots: PlaylistSlot[],
  config: ExperimentConfigRow,
): PlaylistSlot[] {
  const fillerIndices = slots
    .map((slot, index) => (slot.video_type === "filler" ? index : -1))
    .filter((index) => index >= 0);

  if (fillerIndices.length === 0) {
    return slots;
  }

  const result = slots.map((slot) => ({ ...slot }));
  let lastPromptFillerIndex = -config.prompt_min_spacing - 1;
  let fillersSincePrompt = config.prompt_min_spacing;

  for (const fillerIndex of fillerIndices) {
    fillersSincePrompt++;
    const spacingOk = fillersSincePrompt > config.prompt_min_spacing;
    const roll = Math.random() < Number(config.prompt_probability);

    if (spacingOk && roll) {
      result[fillerIndex]!.show_interest_prompt = true;
      lastPromptFillerIndex = fillerIndex;
      fillersSincePrompt = 0;
    }

    if (lastPromptFillerIndex >= 0 && fillerIndex - lastPromptFillerIndex <= 0) {
      continue;
    }
  }

  return result;
}
