import { useDrag } from "@use-gesture/react";
import { useCallback, useState } from "react";
import { useTapGestures } from "../../hooks/useTapGestures";
import { DoubleTapHeart } from "./DoubleTapHeart";
import { PlaybackFlash } from "./PlaybackFlash";

const SWIPE_DISTANCE = 50;
const SWIPE_VELOCITY = 0.5;

type VideoInteractionLayerProps = {
  isActive: boolean;
  touchEnabled: boolean;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onTogglePlay: () => boolean;
  onDoubleTapLike: () => void;
};

export function VideoInteractionLayer({
  isActive,
  touchEnabled,
  onSwipeUp,
  onSwipeDown,
  onTogglePlay,
  onDoubleTapLike,
}: VideoInteractionLayerProps) {
  const [heartVisible, setHeartVisible] = useState(false);
  const [flash, setFlash] = useState<"play" | "pause" | null>(null);

  const handleSingleTap = useCallback(() => {
    const nowPaused = onTogglePlay();
    setFlash(nowPaused ? "pause" : "play");
  }, [onTogglePlay]);

  const handleDoubleTap = useCallback(() => {
    onDoubleTapLike();
    setHeartVisible(true);
  }, [onDoubleTapLike]);

  const handleTap = useTapGestures(handleSingleTap, handleDoubleTap);

  const bind = useDrag(
    ({ movement: [, my], velocity: [, vy], last, tap }) => {
      if (!isActive) return;

      if (tap) {
        handleTap();
        return;
      }

      if (!touchEnabled || !last) return;

      if (my < -SWIPE_DISTANCE || vy < -SWIPE_VELOCITY) {
        onSwipeUp();
      } else if (my > SWIPE_DISTANCE || vy > SWIPE_VELOCITY) {
        onSwipeDown();
      }
    },
    {
      axis: "y",
      filterTaps: true,
      pointer: { touch: true },
    },
  );

  if (!isActive) return null;

  return (
    <>
      <div
        {...(touchEnabled ? bind() : {})}
        onClick={touchEnabled ? undefined : handleTap}
        className="absolute inset-0 z-[5]"
        style={touchEnabled ? { touchAction: "none" } : undefined}
        aria-hidden
      />
      {flash && <PlaybackFlash type={flash} onDone={() => setFlash(null)} />}
      {heartVisible && (
        <DoubleTapHeart onDone={() => setHeartVisible(false)} />
      )}
    </>
  );
}
