import { useCallback, useEffect, useRef, useState } from "react";
import { CommentsSheet } from "../comments/CommentsSheet";
import { VideoProgressBar } from "./VideoProgressBar";
import { VideoSlide } from "./VideoSlide";
import { useFeed } from "../../hooks/useFeed";
import { useIsTouchDevice } from "../../hooks/useIsTouchDevice";
import { useLikes } from "../../hooks/useLikes";
import { useVideoCompletion } from "../../hooks/useVideoCompletion";
import type { FeedVideo } from "../../types/feed";

export function VideoFeed() {
  const videos = useFeed();
  const { isLiked, toggleLike } = useLikes();
  const {
    currentIndex,
    canGoForward,
    handleTimeUpdate,
    handleEnded,
    goToIndex,
  } = useVideoCompletion();

  const isTouchDevice = useIsTouchDevice();
  const containerRef = useRef<HTMLDivElement>(null);
  const [commentsVideo, setCommentsVideo] = useState<FeedVideo | null>(null);
  const [progress, setProgress] = useState(0);
  const lastIndexRef = useRef(currentIndex);

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
    container.scrollTo({ top: index * container.clientHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (lastIndexRef.current !== currentIndex) {
      scrollToIndex(currentIndex);
      lastIndexRef.current = currentIndex;
      setProgress(0);
    }
  }, [currentIndex, scrollToIndex]);

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
              onToggleLike={() => toggleLike(video.id)}
              onDoubleTapLike={() => handleDoubleTapLike(video.id)}
              onSwipeUp={goNext}
              onSwipeDown={goPrev}
              onOpenComments={() => setCommentsVideo(video)}
              onTimeUpdate={(current, duration) => {
                handleTimeUpdate(index, current, duration);
                if (index === currentIndex && duration > 0) {
                  setProgress(current / duration);
                }
              }}
              onEnded={() => handleEnded(index)}
            />
          </div>
        ))}
      </div>

      <VideoProgressBar progress={progress} />

      {!canGoForward && currentIndex < videos.length - 1 && (
        <div className="absolute above-bottom-nav-md inset-x-0 flex justify-center pointer-events-none z-10">
          <span className="text-white/80 text-xs bg-black/50 px-3 py-1 rounded-full">
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
    </>
  );
}
