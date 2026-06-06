import { useCallback, useState } from "react";

const COMPLETION_THRESHOLD = 0.95;

export function useVideoCompletion() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<
    Record<number, boolean>
  >({});

  const isCurrentComplete = completedIndices[currentIndex] ?? false;
  const canGoForward = isCurrentComplete;

  const markComplete = useCallback((index: number) => {
    setCompletedIndices((prev) => ({ ...prev, [index]: true }));
  }, []);

  const handleTimeUpdate = useCallback(
    (index: number, currentTime: number, duration: number) => {
      if (duration > 0 && currentTime / duration >= COMPLETION_THRESHOLD) {
        markComplete(index);
      }
    },
    [markComplete],
  );

  const handleEnded = useCallback(
    (index: number) => {
      markComplete(index);
    },
    [markComplete],
  );

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex > currentIndex && !canGoForward) return false;
      setCurrentIndex(nextIndex);
      return true;
    },
    [currentIndex, canGoForward],
  );

  return {
    currentIndex,
    canGoForward,
    handleTimeUpdate,
    handleEnded,
    goToIndex,
  };
}
