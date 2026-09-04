import { describe, expect, test } from "bun:test";
import { visitIndexStorageKey } from "../hooks/video-dwell.ts";
import {
  STUDY_SESSION_STORAGE_KEY,
  clearStudyClientState,
} from "./client-state.ts";

const memory = new Map<string, string>();

const storage = {
  getItem(key: string) {
    return memory.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    memory.set(key, value);
  },
  removeItem(key: string) {
    memory.delete(key);
  },
};

Object.defineProperty(globalThis, "sessionStorage", {
  value: storage,
  configurable: true,
});

describe("clearStudyClientState", () => {
  test("removes the stored session id and visit counts", () => {
    const sessionId = "550e8400-e29b-41d4-a716-446655440000";
    memory.clear();
    sessionStorage.setItem(STUDY_SESSION_STORAGE_KEY, sessionId);
    sessionStorage.setItem(
      visitIndexStorageKey(sessionId),
      JSON.stringify({ filler_01: 2 }),
    );

    clearStudyClientState(sessionId);

    expect(sessionStorage.getItem(STUDY_SESSION_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(visitIndexStorageKey(sessionId))).toBeNull();
  });
});
