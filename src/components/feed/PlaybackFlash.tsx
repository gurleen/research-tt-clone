import { useEffect } from "react";

type PlaybackFlashProps = {
  type: "play" | "pause";
  onDone: () => void;
};

function PlayIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

export function PlaybackFlash({ type, onDone }: PlaybackFlashProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div className="text-white/90 playback-flash rounded-full bg-black/30 p-4">
        {type === "play" ? <PlayIcon /> : <PauseIcon />}
      </div>
    </div>
  );
}
