import { useCallback, useEffect, useRef } from "react";

type VideoPlayerProps = {
  src: string;
  isActive: boolean;
  userPaused: boolean;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
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
  onEnded,
}: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);

  const play = useCallback(async () => {
    const video = ref.current;
    if (!video || !isActive || userPaused) return;
    await startPlayback(video);
  }, [isActive, userPaused]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.volume = 1;
    video.muted = false;

    if (!isActive) {
      video.pause();
      return;
    }

    video.currentTime = 0;
    if (!userPaused) void play();

    const retry = () => {
      if (!userPaused) void play();
    };
    video.addEventListener("canplay", retry);
    video.addEventListener("loadeddata", retry);

    return () => {
      video.removeEventListener("canplay", retry);
      video.removeEventListener("loadeddata", retry);
    };
  }, [isActive, src]);

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
      src={src}
      className="absolute inset-0 w-full h-full object-cover bg-black"
      autoPlay={isActive}
      playsInline
      preload="auto"
      loop
      muted={false}
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        onTimeUpdate(v.currentTime, v.duration);
      }}
      onEnded={onEnded}
    />
  );
}
