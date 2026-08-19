import { clampInterestPromptRevealFraction } from "../../shared/experiment/interest-prompt-timing.ts";

export function shouldRevealInterestPrompt(
  currentTime: number,
  duration: number,
  fraction: number,
): boolean {
  if (!Number.isFinite(duration) || duration <= 0) return false;
  if (!Number.isFinite(currentTime) || currentTime < 0) return false;

  const threshold = clampInterestPromptRevealFraction(fraction);
  if (threshold <= 0) return true;
  return currentTime / duration >= threshold;
}
