import { useEffect } from "react";

type DoubleTapHeartProps = {
  onDone: () => void;
};

export function DoubleTapHeart({ onDone }: DoubleTapHeartProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <svg
        width="96"
        height="96"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-red-500 double-tap-heart"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </div>
  );
}
