import { describe, expect, test } from "bun:test";
import { UPDATE_PASSWORD_PATH } from "./password.ts";
import { shouldRedirectToUpdatePassword } from "./recovery-gate.ts";

describe("shouldRedirectToUpdatePassword", () => {
  test("redirects recovery sessions away from other paths", () => {
    expect(shouldRedirectToUpdatePassword(true, "/admin")).toBe(true);
    expect(shouldRedirectToUpdatePassword(true, "/admin/login")).toBe(true);
    expect(shouldRedirectToUpdatePassword(true, "/")).toBe(true);
  });

  test("stays on the update-password page during recovery", () => {
    expect(shouldRedirectToUpdatePassword(true, UPDATE_PASSWORD_PATH)).toBe(
      false,
    );
  });

  test("does not redirect when not in recovery", () => {
    expect(shouldRedirectToUpdatePassword(false, "/admin")).toBe(false);
    expect(shouldRedirectToUpdatePassword(false, "/admin/login")).toBe(false);
    expect(shouldRedirectToUpdatePassword(false, UPDATE_PASSWORD_PATH)).toBe(
      false,
    );
  });
});
