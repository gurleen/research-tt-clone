import { useCallback, useEffect, useRef, useState } from "react";
import { CommentsSheet } from "../comments/CommentsSheet";
import { StubSheet } from "../study/StubSheet.tsx";
import { VideoProgressBar } from "./VideoProgressBar";
import { VideoSlide } from "./VideoSlide";
import { useIsTouchDevice } from "../../hooks/useIsTouchDevice";
import { useLikes } from "../../hooks/useLikes";
import { useVideoCompletion } from "../../hooks/useVideoCompletion";
import { useVideoDwell } from "../../hooks/useVideoDwell.ts";
import { shouldShowContinue } from "../../hooks/video-dwell.ts";
import {
  useStudyPlaylist,
  useStudySession,
} from "../../study/session-context.tsx";
import { newEventId, nowIso, postEventBeacon } from "../../study/events.ts";
import type { StudyFeedVideo } from "../../types/feed";

export function VideoFeed() {
  const videos = useStudyPlaylist();
  const { session, client, initialIndex, patchPosition, completePlaylist } =
    useStudySession();
  const { isLiked, toggleLike } = useLikes();
  const { currentIndex, goToIndex } = useVideoCompletion(initialIndex);

  const isTouchDevice = useIsTouchDevice();
  const containerRef = useRef<HTMLDivElement>(null);
  const [commentsVideo, setCommentsVideo] = useState<StudyFeedVideo | null>(
    null,
  );
  const [stubVideo, setStubVideo] = useState<StudyFeedVideo | null>(null);
  const [progress, setProgress] = useState(0);
  const lastIndexRef = useRef(currentIndex);
  const completingRef = useRef(false);
  const lastSlide = Math.max(videos.length - 1, 0);
  const activeVideo = videos[currentIndex];
  const { onTimeUpdate, onLoop, onPlayingChange, flush } = useVideoDwell({
    sessionId: session?.session_id,
    videoId: activeVideo?.video_id,
  });

  const goNext = useCallback(() => {
    if (currentIndex < lastSlide) goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex, lastSlide]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const handleToggleLike = useCallback(
    (videoId: string) => {
      const liked = toggleLike(videoId);
      if (!session) return;
      postEventBeacon({
        event_id: newEventId(),
        session_id: session.session_id,
        event: "like",
        video_id: videoId,
        liked,
        timestamp: nowIso(),
      });
    },
    [session, toggleLike],
  );

  const handleDoubleTapLike = useCallback(
    (videoId: string) => {
      if (isLiked(videoId)) return;
      handleToggleLike(videoId);
    },
    [handleToggleLike, isLiked],
  );

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: index * container.clientHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (lastIndexRef.current !== currentIndex) {
      scrollToIndex(currentIndex);
      lastIndexRef.current = currentIndex;
      setProgress(0);
      const highWater = session?.current_position ?? 0;
      if (currentIndex > highWater) {
        void patchPosition(currentIndex);
      }
    }
  }, [currentIndex, scrollToIndex, patchPosition, session?.current_position]);

  useEffect(() => {
    scrollToIndex(initialIndex);
    lastIndexRef.current = initialIndex;
  }, [initialIndex, scrollToIndex]);

  const onScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index === currentIndex) return;
    if (index < 0 || index > lastSlide) return;

    goToIndex(index);
  }, [currentIndex, goToIndex, lastSlide]);

  const handleContinue = useCallback(() => {
    if (completingRef.current || !session) return;
    completingRef.current = true;
    flush("playlist_complete");
    void completePlaylist();
  }, [completePlaylist, flush, session]);

  return (
    <>
      <div
        ref={containerRef}
        onScroll={isTouchDevice ? undefined : onScroll}
        className={`h-full scrollbar-hide ${
          isTouchDevice
            ? "overflow-hidden"
            : "overflow-y-scroll snap-y snap-mandatory"
        }`}
        style={isTouchDevice ? undefined : { scrollSnapType: "y mandatory" }}
      >
        {videos.map((video, index) => (
          <div key={video.id} className="h-full w-full">
            <VideoSlide
              video={video}
              isActive={index === currentIndex}
              liked={isLiked(video.video_id)}
              touchEnabled={isTouchDevice}
              sessionId={session?.session_id}
              client={client}
              interestPromptRevealFraction={
                session?.interest_prompt_reveal_fraction
              }
              onToggleLike={() => handleToggleLike(video.video_id)}
              onDoubleTapLike={() => handleDoubleTapLike(video.video_id)}
              onSwipeUp={goNext}
              onSwipeDown={goPrev}
              onOpenComments={() => setCommentsVideo(video)}
              onOpenLearnMore={() => setStubVideo(video)}
              onTimeUpdate={(current, duration) => {
                if (index === currentIndex && duration > 0) {
                  setProgress(current / duration);
                  onTimeUpdate(current, duration);
                }
              }}
              onLoop={onLoop}
              onPlayingChange={onPlayingChange}
            />
          </div>
        ))}
      </div>

      <VideoProgressBar progress={progress} />

      {shouldShowContinue(currentIndex, videos.length) && (
        <div className="absolute above-bottom-nav inset-x-0 z-20 flex justify-center pb-3 pointer-events-none">
          <button
            type="button"
            onClick={handleContinue}
            className="pointer-events-auto rounded-full bg-white px-6 py-2 text-sm font-semibold text-black"
          >
            Continue
          </button>
        </div>
      )}

      {commentsVideo && (
        <CommentsSheet
          comments={commentsVideo.comments}
          count={commentsVideo.commentCount}
          sessionId={session?.session_id}
          videoId={commentsVideo.video_id}
          onClose={() => setCommentsVideo(null)}
        />
      )}

      {stubVideo && session && client && (
        <StubSheet
          sessionId={session.session_id}
          videoId={stubVideo.video_id}
          client={client}
          onClose={() => setStubVideo(null)}
        />
      )}
    </>
  );
}
