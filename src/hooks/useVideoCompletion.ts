import { useCallback, useState } from "react";

/** Feed index only — forward motion is not gated on watch time. */
export function useVideoCompletion(initialIndex = 0) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToIndex = useCallback((nextIndex: number) => {
    setCurrentIndex(nextIndex);
    return true;
  }, []);

  return {
    currentIndex,
    goToIndex,
  };
}
