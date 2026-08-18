import { describe, expect, test } from "bun:test";
import { ApiError } from "../../lib/http.ts";
import { shouldAdvanceResumePosition } from "./resume-position.ts";

describe("shouldAdvanceResumePosition", () => {
  test("rejects moving backward from the high-water mark", () => {
    try {
      shouldAdvanceResumePosition(3, 2);
      throw new Error("expected backward position to be rejected");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).message).toContain("cannot move backward");
    }
  });

  test("treats an equal position as a no-op", () => {
    expect(shouldAdvanceResumePosition(0, 0)).toBe(false);
    expect(shouldAdvanceResumePosition(3, 3)).toBe(false);
  });

  test("allows advancing past the high-water mark", () => {
    expect(shouldAdvanceResumePosition(0, 1)).toBe(true);
    expect(shouldAdvanceResumePosition(3, 4)).toBe(true);
  });
});
