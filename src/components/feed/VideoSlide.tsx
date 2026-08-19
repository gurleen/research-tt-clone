import { VideoOverlay } from "./VideoOverlay";
import type { PlatformApiClient } from "../../client/platform-api.ts";
import type { StudyFeedVideo } from "../../types/feed";

type VideoSlideProps = {
  video: StudyFeedVideo;
  isActive: boolean;
  liked: boolean;
  touchEnabled: boolean;
  sessionId?: string;
  client?: PlatformApiClient;
  interestPromptRevealFraction?: number;
  onOpenLearnMore?: () => void;
  onToggleLike: () => void;
  onDoubleTapLike: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onOpenComments: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onLoop: () => void;
  onPlayingChange: (playing: boolean) => void;
};

export function VideoSlide(props: VideoSlideProps) {
  return (
    <div className="relative h-full w-full shrink-0 snap-start snap-always">
      <VideoOverlay {...props} />
    </div>
  );
}
