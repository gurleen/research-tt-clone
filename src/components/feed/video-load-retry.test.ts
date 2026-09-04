import { describe, expect, test } from "bun:test";
import {
  MEDIA_ERR_ABORTED,
  MEDIA_ERR_DECODE,
  MEDIA_ERR_NETWORK,
  MEDIA_ERR_SRC_NOT_SUPPORTED,
  VIDEO_LOAD_MAX_RETRIES,
  shouldRetryVideoLoad,
  videoLoadRetryDelayMs,
  videoSrcForLoadAttempt,
  withVideoLoadRetryCacheBust,
} from "./video-load-retry.ts";

describe("shouldRetryVideoLoad", () => {
  test("retries aborted, network, and Chrome src-not-supported failures", () => {
    expect(shouldRetryVideoLoad(0, MEDIA_ERR_ABORTED)).toBe(true);
    expect(shouldRetryVideoLoad(0, MEDIA_ERR_NETWORK)).toBe(true);
    expect(shouldRetryVideoLoad(0, MEDIA_ERR_SRC_NOT_SUPPORTED)).toBe(true);
    expect(shouldRetryVideoLoad(0, null)).toBe(true);
    expect(shouldRetryVideoLoad(0, undefined)).toBe(true);
  });

  test("does not retry decode errors", () => {
    expect(shouldRetryVideoLoad(0, MEDIA_ERR_DECODE)).toBe(false);
  });

  test("stops after the retry budget", () => {
    expect(
      shouldRetryVideoLoad(VIDEO_LOAD_MAX_RETRIES - 1, MEDIA_ERR_NETWORK),
    ).toBe(true);
    expect(
      shouldRetryVideoLoad(VIDEO_LOAD_MAX_RETRIES, MEDIA_ERR_NETWORK),
    ).toBe(false);
  });
});

describe("videoLoadRetryDelayMs", () => {
  test("backs off exponentially from the first retry", () => {
    expect(videoLoadRetryDelayMs(1)).toBe(500);
    expect(videoLoadRetryDelayMs(2)).toBe(1000);
    expect(videoLoadRetryDelayMs(3)).toBe(2000);
  });
});

describe("withVideoLoadRetryCacheBust", () => {
  test("adds a retry query param to absolute URLs", () => {
    expect(withVideoLoadRetryCacheBust("https://cdn.example.com/a.mp4", 1)).toBe(
      "https://cdn.example.com/a.mp4?_r=1",
    );
  });

  test("replaces an existing retry param without dropping others", () => {
    expect(
      withVideoLoadRetryCacheBust("https://cdn.example.com/a.mp4?foo=1&_r=1", 2),
    ).toBe("https://cdn.example.com/a.mp4?foo=1&_r=2");
  });

  test("keeps relative paths relative", () => {
    expect(withVideoLoadRetryCacheBust("/videos/clip.mp4", 1)).toBe(
      "/videos/clip.mp4?_r=1",
    );
  });
});

describe("videoSrcForLoadAttempt", () => {
  test("leaves the original src on the first load", () => {
    expect(videoSrcForLoadAttempt("https://cdn.example.com/a.mp4", 0)).toBe(
      "https://cdn.example.com/a.mp4",
    );
  });

  test("cache-busts after a failed load", () => {
    expect(videoSrcForLoadAttempt("https://cdn.example.com/a.mp4", 2)).toBe(
      "https://cdn.example.com/a.mp4?_r=2",
    );
  });
});
