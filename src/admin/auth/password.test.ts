import { describe, expect, test } from "bun:test";
import {
  MIN_PASSWORD_LENGTH,
  validateNewPassword,
} from "./password.ts";

describe("validateNewPassword", () => {
  test("rejects passwords shorter than the minimum", () => {
    expect(validateNewPassword("short", "short")).toBe(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  });

  test("rejects mismatched confirmation", () => {
    expect(validateNewPassword("longenough", "different1")).toBe(
      "Passwords do not match.",
    );
  });

  test("accepts matching passwords at the minimum length", () => {
    expect(validateNewPassword("12345678", "12345678")).toBeNull();
  });
});
