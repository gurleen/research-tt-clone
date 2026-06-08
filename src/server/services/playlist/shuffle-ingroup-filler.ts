import { shuffleInPlace } from "../../lib/random.ts";
import type { VideoRow } from "../../db/tables.ts";
import type { PlaylistSlot } from "./place-prompts.ts";

/**
 * Interleave ingroup videos into a filler stream at random positions.
 */
export function shuffleIngroupIntoFiller(
  ingroup: VideoRow[],
  filler: VideoRow[],
): PlaylistSlot[] {
  const slots: PlaylistSlot[] = filler.map((video) => ({
    video_id: video.video_id,
    video_type: "filler" as const,
    show_interest_prompt: false,
  }));

  for (const video of ingroup) {
    const insertAt = Math.floor(Math.random() * (slots.length + 1));
    slots.splice(insertAt, 0, {
      video_id: video.video_id,
      video_type: "ingroup",
      show_interest_prompt: false,
    });
  }

  shuffleInPlace(slots);
  return slots;
}
