import { useCallback, useState } from "react";

export function useLikes() {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const isLiked = useCallback(
    (videoId: string) => likedIds.has(videoId),
    [likedIds],
  );

  const toggleLike = useCallback((videoId: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  }, []);

  return { isLiked, toggleLike };
}
