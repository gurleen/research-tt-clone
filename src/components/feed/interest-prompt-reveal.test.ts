import { describe, expect, test } from "bun:test";
import { shouldRevealInterestPrompt } from "./interest-prompt-reveal.ts";

describe("shouldRevealInterestPrompt", () => {
  test("waits when duration is unknown", () => {
    expect(shouldRevealInterestPrompt(5, Number.NaN, 0.3)).toBe(false);
    expect(shouldRevealInterestPrompt(5, 0, 0.3)).toBe(false);
    expect(shouldRevealInterestPrompt(5, Number.POSITIVE_INFINITY, 0.3)).toBe(
      false,
    );
  });

  test("waits when currentTime is invalid", () => {
    expect(shouldRevealInterestPrompt(Number.NaN, 10, 0.3)).toBe(false);
    expect(shouldRevealInterestPrompt(-1, 10, 0.3)).toBe(false);
  });

  test("reveals immediately at 0%", () => {
    expect(shouldRevealInterestPrompt(0, 10, 0)).toBe(true);
    expect(shouldRevealInterestPrompt(0.01, 10, 0)).toBe(true);
  });

  test("reveals at the 30% threshold", () => {
    expect(shouldRevealInterestPrompt(2.9, 10, 0.3)).toBe(false);
    expect(shouldRevealInterestPrompt(3, 10, 0.3)).toBe(true);
    expect(shouldRevealInterestPrompt(4, 10, 0.3)).toBe(true);
  });

  test("reveals at 100% only at the end", () => {
    expect(shouldRevealInterestPrompt(9.9, 10, 1)).toBe(false);
    expect(shouldRevealInterestPrompt(10, 10, 1)).toBe(true);
  });

  test("clamps out-of-range fractions", () => {
    expect(shouldRevealInterestPrompt(0, 10, -1)).toBe(true);
    expect(shouldRevealInterestPrompt(9.9, 10, 2)).toBe(false);
    expect(shouldRevealInterestPrompt(10, 10, 2)).toBe(true);
  });
});
