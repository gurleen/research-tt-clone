import { useCallback, useEffect, useState } from "react";
import { MusicDisc } from "./MusicDisc";
import { SideActions } from "./SideActions";
import { VideoInfo } from "./VideoInfo";
import { VideoInteractionLayer } from "./VideoInteractionLayer";
import { VideoPlayer } from "./VideoPlayer";
import { InterestPrompt } from "../study/InterestPrompt.tsx";
import type { PlatformApiClient } from "../../client/platform-api.ts";
import type { StudyFeedVideo } from "../../types/feed";

export const INTEREST_PROMPT_DELAY_MS = 3000;

type VideoOverlayProps = {
  video: StudyFeedVideo;
  isActive: boolean;
  liked: boolean;
  touchEnabled: boolean;
  sessionId?: string;
  client?: PlatformApiClient;
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

    if (!isActive || !video.show_interest_prompt) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPromptReady(true);
    }, INTEREST_PROMPT_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [video.id, isActive, video.show_interest_prompt]);

  const handleTogglePlay = useCallback(() => {
    let nowPaused = false;
    setUserPaused((prev) => {
      nowPaused = !prev;
      return nowPaused;
    });
    return nowPaused;
  }, []);

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
        onTimeUpdate={onTimeUpdate}
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
