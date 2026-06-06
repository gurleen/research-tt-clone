import { useCallback, useEffect, useRef, useState } from "react";
import { CommentList } from "./CommentList";
import { Z } from "../../utils/layout";
import type { FeedComment } from "../../types/feed";
import { formatCount } from "../../utils/formatCount";

const ANIMATION_MS = 300;

type CommentsSheetProps = {
  comments: FeedComment[];
  count: number;
  onClose: () => void;
};

export function CommentsSheet({ comments, count, onClose }: CommentsSheetProps) {
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    closeTimerRef.current = setTimeout(onClose, ANIMATION_MS);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex flex-col justify-end"
      style={{ zIndex: Z.sheet }}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
        aria-label="Close comments"
      />
      <div
        className={`comments-sheet-panel relative bg-neutral-900 rounded-t-2xl max-h-[60vh] flex flex-col w-full transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-white font-semibold">
            {formatCount(count)} comments
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/70 text-2xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-4 flex-1">
          <CommentList comments={comments} />
        </div>
      </div>
    </div>
  );
}
