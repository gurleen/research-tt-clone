import { useCallback, useState } from "react";

export function useLikes() {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const isLiked = useCallback(
    (videoId: string) => likedIds.has(videoId),
    [likedIds],
  );

  const toggleLike = useCallback((videoId: string): boolean => {
    let liked = false;
    setLikedIds((prev) => {
      const next = new Set(prev);
      liked = !next.has(videoId);
      if (liked) {
        next.add(videoId);
      } else {
        next.delete(videoId);
      }
      return next;
    });
    return liked;
  }, []);

  return { isLiked, toggleLike };
}
