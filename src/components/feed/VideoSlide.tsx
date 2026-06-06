import { VideoOverlay } from "./VideoOverlay";
import type { FeedVideo } from "../../types/feed";

type VideoSlideProps = {
  video: FeedVideo;
  isActive: boolean;
  liked: boolean;
  touchEnabled: boolean;
  onToggleLike: () => void;
  onDoubleTapLike: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onOpenComments: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
};

export function VideoSlide(props: VideoSlideProps) {
  return (
    <div className="relative w-full h-full snap-start snap-always shrink-0">
      <VideoOverlay {...props} />
    </div>
  );
}
