import { describe, expect, test } from "bun:test";
import { SOURCE_TYPES } from "../../../shared/api/events.ts";
import { pickLeastAssignedSourceType } from "./assign-source-type.ts";

describe("pickLeastAssignedSourceType", () => {
  test("always returns the strictly lowest arm", () => {
    for (let i = 0; i < 20; i++) {
      expect(
        pickLeastAssignedSourceType({
          micro_influencer: 5,
          institutional: 5,
          control: 0,
        }),
      ).toBe("control");
    }
  });

  test("returns only a tied lowest arm", () => {
    const results = new Set<string>();
    for (let i = 0; i < 40; i++) {
      results.add(
        pickLeastAssignedSourceType({
          micro_influencer: 1,
          institutional: 4,
          control: 1,
        }),
      );
    }
    expect([...results].sort()).toEqual(["control", "micro_influencer"]);
  });

  test("returns one of SOURCE_TYPES when all counts are equal", () => {
    for (let i = 0; i < 20; i++) {
      expect(SOURCE_TYPES).toContain(
        pickLeastAssignedSourceType({
          micro_influencer: 3,
          institutional: 3,
          control: 3,
        }),
      );
    }
  });
});
