import { useCallback, useEffect, useRef, useState } from "react";
import { detectLoopWrap } from "../../hooks/video-dwell.ts";
import {
  shouldRetryVideoLoad,
  videoLoadRetryDelayMs,
  videoSrcForLoadAttempt,
} from "./video-load-retry.ts";

type VideoPlayerProps = {
  src: string;
  isActive: boolean;
  userPaused: boolean;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onLoop: () => void;
  onPlayingChange: (playing: boolean) => void;
};

async function startPlayback(video: HTMLVideoElement): Promise<void> {
  video.muted = false;
  video.volume = 1;

  try {
    await video.play();
  } catch {
    // Will retry on canplay / loadeddata.
  }
}

export function VideoPlayer({
  src,
  isActive,
  userPaused,
  onTimeUpdate,
  onLoop,
  onPlayingChange,
}: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef(0);
  const ignoreWrapRef = useRef(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryScheduledRef = useRef(false);
  const playbackSrc = videoSrcForLoadAttempt(src, loadAttempt);

  const play = useCallback(async () => {
    const video = ref.current;
    if (!video || !isActive || userPaused) return;
    await startPlayback(video);
  }, [isActive, userPaused]);

  useEffect(() => {
    setLoadAttempt(0);
    retryScheduledRef.current = false;
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [src]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.volume = 1;
    video.muted = false;

    if (!isActive) {
      video.pause();
      return;
    }

    ignoreWrapRef.current = true;
    lastTimeRef.current = 0;
    video.currentTime = 0;
    if (!userPaused) void play();

    const retryPlay = () => {
      if (!userPaused) void play();
    };
    video.addEventListener("canplay", retryPlay);
    video.addEventListener("loadeddata", retryPlay);

    return () => {
      video.removeEventListener("canplay", retryPlay);
      video.removeEventListener("loadeddata", retryPlay);
    };
  }, [isActive, src, loadAttempt]);

  const handleLoadError = useCallback(() => {
    if (retryScheduledRef.current) return;
    const code = ref.current?.error?.code ?? null;
    if (!shouldRetryVideoLoad(loadAttempt, code)) return;

    retryScheduledRef.current = true;
    const nextAttempt = loadAttempt + 1;
    retryTimeoutRef.current = setTimeout(() => {
      retryScheduledRef.current = false;
      setLoadAttempt(nextAttempt);
    }, videoLoadRetryDelayMs(nextAttempt));
  }, [loadAttempt]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !isActive) return;

    if (userPaused) {
      video.pause();
    } else if (video.paused) {
      void play();
    }
  }, [userPaused, isActive, play]);

  return (
    <video
      ref={ref}
      src={playbackSrc}
      className="absolute inset-0 w-full h-full object-cover bg-black"
      autoPlay={isActive}
      playsInline
      preload="auto"
      loop
      muted={false}
      onError={handleLoadError}
      onPlay={() => {
        if (isActive) onPlayingChange(true);
      }}
      onPause={() => {
        if (isActive) onPlayingChange(false);
      }}
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        const currentTime = v.currentTime;
        const duration = v.duration;
        if (
          !ignoreWrapRef.current &&
          detectLoopWrap(lastTimeRef.current, currentTime, duration)
        ) {
          onLoop();
        }
        if (ignoreWrapRef.current && currentTime > 0.05) {
          ignoreWrapRef.current = false;
        }
        lastTimeRef.current = currentTime;
        onTimeUpdate(currentTime, duration);
      }}
    />
  );
}
