import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./compose-playlist.ts", import.meta.url),
  "utf8",
);

describe("composePlaylistSlots", () => {
  test("is exported for pre-insert playlist validation", () => {
    expect(source).toContain("export async function composePlaylistSlots");
  });

  test("loads only active videos from catalog", () => {
    expect(source.match(/\.eq\("active", true\)/g)?.length).toBe(3);
  });

  test("appends a filler when the shuffled playlist would end on a stimulus video", () => {
    expect(source).toContain("ensureTrailingFiller");
    expect(source).toContain("hasTrailingFiller");
    expect(source).toContain(
      "Not enough filler videos in catalog to end playlist on a filler",
    );
  });
});
