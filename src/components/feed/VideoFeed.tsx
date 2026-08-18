import { useCallback, useEffect, useRef, useState } from "react";
import { CommentsSheet } from "../comments/CommentsSheet";
import { StubSheet } from "../study/StubSheet.tsx";
import { VideoProgressBar } from "./VideoProgressBar";
import { VideoSlide } from "./VideoSlide";
import { useIsTouchDevice } from "../../hooks/useIsTouchDevice";
import { useLikes } from "../../hooks/useLikes";
import { useVideoCompletion } from "../../hooks/useVideoCompletion";
import {
  useStudyPlaylist,
  useStudySession,
} from "../../study/session-context.tsx";
import type { StudyFeedVideo } from "../../types/feed";

export function VideoFeed() {
  const videos = useStudyPlaylist();
  const { session, client, initialIndex, patchPosition, completePlaylist } =
    useStudySession();
  const { isLiked, toggleLike } = useLikes();
  const {
    currentIndex,
    canGoForward,
    handleTimeUpdate,
    handleEnded,
    goToIndex,
  } = useVideoCompletion(initialIndex);

  const isTouchDevice = useIsTouchDevice();
  const containerRef = useRef<HTMLDivElement>(null);
  const [commentsVideo, setCommentsVideo] = useState<StudyFeedVideo | null>(
    null,
  );
  const [stubVideo, setStubVideo] = useState<StudyFeedVideo | null>(null);
  const [progress, setProgress] = useState(0);
  const lastIndexRef = useRef(currentIndex);
  const completingRef = useRef(false);

  const goNext = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const handleDoubleTapLike = useCallback(
    (videoId: string) => {
      if (!isLiked(videoId)) toggleLike(videoId);
    },
    [isLiked, toggleLike],
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
      void patchPosition(currentIndex);
    }
  }, [currentIndex, scrollToIndex, patchPosition]);

  useEffect(() => {
    scrollToIndex(initialIndex);
    lastIndexRef.current = initialIndex;
  }, [initialIndex, scrollToIndex]);

  const onScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const index = Math.round(container.scrollTop / container.clientHeight);
    if (index === currentIndex) return;

    if (index > currentIndex && !canGoForward) {
      scrollToIndex(currentIndex);
      return;
    }

    goToIndex(index);
  }, [currentIndex, canGoForward, goToIndex, scrollToIndex]);

  const onVideoEnded = useCallback(
    (index: number) => {
      handleEnded(index);

      if (
        index === videos.length - 1 &&
        !completingRef.current &&
        session
      ) {
        completingRef.current = true;
        void completePlaylist();
      }
    },
    [completePlaylist, handleEnded, session, videos.length],
  );

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
              liked={isLiked(video.id)}
              touchEnabled={isTouchDevice}
              sessionId={session?.session_id}
              client={client}
              onToggleLike={() => toggleLike(video.id)}
              onDoubleTapLike={() => handleDoubleTapLike(video.id)}
              onSwipeUp={goNext}
              onSwipeDown={goPrev}
              onOpenComments={() => setCommentsVideo(video)}
              onOpenLearnMore={() => setStubVideo(video)}
              onTimeUpdate={(current, duration) => {
                handleTimeUpdate(index, current, duration);
                if (index === currentIndex && duration > 0) {
                  setProgress(current / duration);
                }
              }}
              onEnded={() => onVideoEnded(index)}
            />
          </div>
        ))}
      </div>

      <VideoProgressBar progress={progress} />

      {!canGoForward && currentIndex < videos.length - 1 && (
        <div className="absolute above-bottom-nav-md inset-x-0 z-10 flex justify-center pointer-events-none">
          <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/80">
            Watch the full video to continue
          </span>
        </div>
      )}

      {commentsVideo && (
        <CommentsSheet
          comments={commentsVideo.comments}
          count={commentsVideo.commentCount}
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
