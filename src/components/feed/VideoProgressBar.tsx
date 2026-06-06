type VideoProgressBarProps = {
  progress: number;
};

export function VideoProgressBar({ progress }: VideoProgressBarProps) {
  const width = `${Math.min(100, Math.max(0, progress * 100))}%`;

  return (
    <div
      className="absolute bottom-14 inset-x-0 h-px z-20 pointer-events-none"
      aria-hidden
    >
      <div className="h-full bg-white" style={{ width }} />
    </div>
  );
}
