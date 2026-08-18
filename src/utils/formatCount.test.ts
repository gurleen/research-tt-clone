import { describe, expect, test } from "bun:test";
import { formatCount } from "./formatCount.ts";

describe("formatCount", () => {
  test("returns the raw count below one thousand", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(999)).toBe("999");
  });

  test("uses K for thousands", () => {
    expect(formatCount(1000)).toBe("1K");
    expect(formatCount(4400)).toBe("4.4K");
    expect(formatCount(12_400)).toBe("12.4K");
  });

  test("uses M for millions", () => {
    expect(formatCount(1_000_000)).toBe("1M");
    expect(formatCount(2_500_000)).toBe("2.5M");
  });
});
