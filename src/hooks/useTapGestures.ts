import { useCallback, useEffect, useRef } from "react";

const DOUBLE_TAP_MS = 300;

export function useTapGestures(
  onSingleTap: () => void,
  onDoubleTap: () => void,
) {
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    };
  }, []);

  return useCallback(() => {
    const now = Date.now();

    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = undefined;
      }
      onDoubleTap();
      return;
    }

    lastTapRef.current = now;
    singleTapTimerRef.current = setTimeout(() => {
      lastTapRef.current = 0;
      singleTapTimerRef.current = undefined;
      onSingleTap();
    }, DOUBLE_TAP_MS);
  }, [onSingleTap, onDoubleTap]);
}
