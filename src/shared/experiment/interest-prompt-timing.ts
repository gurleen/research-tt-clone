export const DEFAULT_INTEREST_PROMPT_REVEAL_FRACTION = 0.3;

export const INTEREST_PROMPT_REVEAL_SETTING_KEY =
  "interest_prompt_reveal_fraction" as const;

export function clampInterestPromptRevealFraction(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_INTEREST_PROMPT_REVEAL_FRACTION;
  }
  return Math.min(1, Math.max(0, value));
}

export function parseInterestPromptRevealFraction(
  raw: string | null | undefined,
): number {
  if (raw == null || raw.trim() === "") {
    return DEFAULT_INTEREST_PROMPT_REVEAL_FRACTION;
  }
  return clampInterestPromptRevealFraction(Number(raw));
}

export function fractionToPercent(fraction: number): number {
  return Math.round(clampInterestPromptRevealFraction(fraction) * 100);
}

export function percentToFraction(percent: number): number {
  if (!Number.isFinite(percent)) {
    return DEFAULT_INTEREST_PROMPT_REVEAL_FRACTION;
  }
  return clampInterestPromptRevealFraction(percent / 100);
}
