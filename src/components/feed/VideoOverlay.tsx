import { useCallback, useEffect, useState } from "react";
import { MusicDisc } from "./MusicDisc";
import { SideActions } from "./SideActions";
import { VideoInfo } from "./VideoInfo";
import { VideoInteractionLayer } from "./VideoInteractionLayer";
import { VideoPlayer } from "./VideoPlayer";
import { shouldRevealInterestPrompt } from "./interest-prompt-reveal.ts";
import { InterestPrompt } from "../study/InterestPrompt.tsx";
import type { PlatformApiClient } from "../../client/platform-api.ts";
import type { StudyFeedVideo } from "../../types/feed";
import { DEFAULT_INTEREST_PROMPT_REVEAL_FRACTION } from "../../shared/experiment/interest-prompt-timing.ts";

type VideoOverlayProps = {
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
  onOpenComments: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onLoop: () => void;
  onPlayingChange: (playing: boolean) => void;
};

export function VideoOverlay({
  video,
  isActive,
  liked,
  touchEnabled,
  sessionId,
  client,
  interestPromptRevealFraction = DEFAULT_INTEREST_PROMPT_REVEAL_FRACTION,
  onOpenLearnMore,
  onToggleLike,
  onDoubleTapLike,
  onOpenComments,
  onSwipeUp,
  onSwipeDown,
  onTimeUpdate,
  onLoop,
  onPlayingChange,
}: VideoOverlayProps) {
  const [userPaused, setUserPaused] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [promptReady, setPromptReady] = useState(false);

  useEffect(() => {
    setUserPaused(false);
    setPromptDismissed(false);
    setPromptReady(false);
  }, [video.id, isActive]);

  const handleTogglePlay = useCallback(() => {
    let nowPaused = false;
    setUserPaused((prev) => {
      nowPaused = !prev;
      return nowPaused;
    });
    return nowPaused;
  }, []);

  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      onTimeUpdate(currentTime, duration);

      if (
        promptReady ||
        promptDismissed ||
        !isActive ||
        !video.show_interest_prompt
      ) {
        return;
      }

      if (
        shouldRevealInterestPrompt(
          currentTime,
          duration,
          interestPromptRevealFraction,
        )
      ) {
        setPromptReady(true);
      }
    },
    [
      onTimeUpdate,
      promptReady,
      promptDismissed,
      isActive,
      video.show_interest_prompt,
      interestPromptRevealFraction,
    ],
  );

  const showPrompt =
    isActive &&
    video.show_interest_prompt &&
    promptReady &&
    sessionId &&
    client &&
    !promptDismissed;

  return (
    <>
      <VideoPlayer
        src={video.videoUrl}
        isActive={isActive}
        userPaused={userPaused}
        onTimeUpdate={handleTimeUpdate}
        onLoop={onLoop}
        onPlayingChange={onPlayingChange}
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
      <VideoInfo
        video={video}
        sessionId={sessionId}
        client={client}
        onOpenLearnMore={onOpenLearnMore}
      />
      <div className="absolute above-bottom-nav-sm right-3 z-10 pointer-events-none">
        <MusicDisc />
      </div>
      {showPrompt && (
        <InterestPrompt
          sessionId={sessionId}
          videoId={video.video_id}
          videoType={video.video_type}
          client={client}
          onDismiss={() => setPromptDismissed(true)}
        />
      )}
    </>
  );
}
