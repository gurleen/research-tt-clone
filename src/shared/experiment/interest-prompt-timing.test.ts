import { describe, expect, test } from "bun:test";
import {
  clampInterestPromptRevealFraction,
  DEFAULT_INTEREST_PROMPT_REVEAL_FRACTION,
  fractionToPercent,
  parseInterestPromptRevealFraction,
  percentToFraction,
} from "./interest-prompt-timing.ts";

describe("interest prompt timing helpers", () => {
  test("defaults to 30%", () => {
    expect(DEFAULT_INTEREST_PROMPT_REVEAL_FRACTION).toBe(0.3);
    expect(parseInterestPromptRevealFraction(undefined)).toBe(0.3);
    expect(parseInterestPromptRevealFraction("")).toBe(0.3);
    expect(parseInterestPromptRevealFraction("not-a-number")).toBe(0.3);
  });

  test("parses and clamps stored fractions", () => {
    expect(parseInterestPromptRevealFraction("0.3")).toBe(0.3);
    expect(parseInterestPromptRevealFraction("0")).toBe(0);
    expect(parseInterestPromptRevealFraction("1")).toBe(1);
    expect(parseInterestPromptRevealFraction("-0.2")).toBe(0);
    expect(parseInterestPromptRevealFraction("1.5")).toBe(1);
  });

  test("converts percent to fraction and back", () => {
    expect(percentToFraction(30)).toBe(0.3);
    expect(percentToFraction(0)).toBe(0);
    expect(percentToFraction(100)).toBe(1);
    expect(fractionToPercent(0.3)).toBe(30);
    expect(clampInterestPromptRevealFraction(Number.NaN)).toBe(0.3);
  });
});
