import { useCallback, useEffect, useState } from "react";
import { MusicDisc } from "./MusicDisc";
import { SideActions } from "./SideActions";
import { VideoInfo } from "./VideoInfo";
import { VideoInteractionLayer } from "./VideoInteractionLayer";
import { VideoPlayer } from "./VideoPlayer";
import type { FeedVideo } from "../../types/feed";

type VideoOverlayProps = {
  video: FeedVideo;
  isActive: boolean;
  liked: boolean;
  touchEnabled: boolean;
  onToggleLike: () => void;
  onDoubleTapLike: () => void;
  onOpenComments: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
};

export function VideoOverlay({
  video,
  isActive,
  liked,
  touchEnabled,
  onToggleLike,
  onDoubleTapLike,
  onOpenComments,
  onSwipeUp,
  onSwipeDown,
  onTimeUpdate,
  onEnded,
}: VideoOverlayProps) {
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    setUserPaused(false);
  }, [video.id, isActive]);

  const handleTogglePlay = useCallback(() => {
    let nowPaused = false;
    setUserPaused((prev) => {
      nowPaused = !prev;
      return nowPaused;
    });
    return nowPaused;
  }, []);

  return (
    <>
      <VideoPlayer
        src={video.videoUrl}
        isActive={isActive}
        userPaused={userPaused}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
      />
      <VideoInteractionLayer
        isActive={isActive}
        touchEnabled={touchEnabled}
        onSwipeUp={onSwipeUp}
        onSwipeDown={onSwipeDown}
        onTogglePlay={handleTogglePlay}
        onDoubleTapLike={onDoubleTapLike}
      />
      <SideActions
        video={video}
        liked={liked}
        onToggleLike={onToggleLike}
        onOpenComments={onOpenComments}
      />
      <VideoInfo video={video} />
      <div className="absolute above-bottom-nav-sm right-3 z-10 pointer-events-none">
        <MusicDisc />
      </div>
    </>
  );
}
