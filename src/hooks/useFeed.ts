import { useMemo } from "react";
import { feedVideos } from "../data/feed";
import type { FeedVideo } from "../types/feed";

// Future: swap to fetch('/api/feed')
export function useFeed(): FeedVideo[] {
  return useMemo(() => feedVideos, []);
}
