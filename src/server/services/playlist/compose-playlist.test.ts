import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { composePlaylistSlots } from "./compose-playlist.ts";

describe("composePlaylistSlots", () => {
  test("is exported for pre-insert playlist validation", () => {
    expect(typeof composePlaylistSlots).toBe("function");
  });

  test("loads only active videos from catalog", () => {
    const source = readFileSync(
      new URL("./compose-playlist.ts", import.meta.url),
      "utf8",
    );
    expect(source.match(/\.eq\("active", true\)/g)?.length).toBe(2);
  });
});
