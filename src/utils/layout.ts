export const LAYOUT = {
  topNavHeight: "h-12",
  bottomNavHeight: "h-14",
  /** Matches `--feed-frame-max-width` in index.css (desktop phone column). */
  feedFrameMaxWidthPx: 430,
  /** Viewport width at which the feed column is capped to phone/9:16 size. */
  feedFrameDesktopMinWidthPx: 768,
} as const;

export const Z = {
  video: 0,
  overlay: 10,
  topNav: 20,
  bottomNav: 20,
  sheet: 30,
} as const;
