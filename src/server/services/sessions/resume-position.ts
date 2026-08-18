import { ApiError } from "../../lib/http.ts";

/** Resume pointer is a high-water mark: equal is a no-op, lower is rejected. */
export function shouldAdvanceResumePosition(
  current: number,
  requested: number,
): boolean {
  if (requested < current) {
    throw new ApiError(
      400,
      `Position cannot move backward (current: ${current}, requested: ${requested})`,
    );
  }
  return requested > current;
}
