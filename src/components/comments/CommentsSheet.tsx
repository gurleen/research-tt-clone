import { useCallback, useEffect, useRef, useState } from "react";
import { CommentList } from "./CommentList";
import { Z } from "../../utils/layout";
import type { FeedComment } from "../../types/feed";
import { formatCount } from "../../utils/formatCount";
import { newEventId, nowIso, postEventBeacon } from "../../study/events.ts";

const ANIMATION_MS = 300;

type CommentsSheetProps = {
  comments: FeedComment[];
  count: number;
  onClose: () => void;
  sessionId?: string;
  videoId?: string;
};

export function CommentsSheet({
  comments,
  count,
  onClose,
  sessionId,
  videoId,
}: CommentsSheetProps) {
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const openedAtMs = useRef(performance.now());
  const timestampOpen = useRef(nowIso());
  const logged = useRef(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const logOpen = useCallback(() => {
    if (logged.current) return;
    if (!sessionId || !videoId) return;
    logged.current = true;
    postEventBeacon({
      event_id: newEventId(),
      session_id: sessionId,
      event: "comments_open",
      video_id: videoId,
      timestamp_open: timestampOpen.current,
      time_on_sheet_ms: Math.max(
        0,
        Math.round(performance.now() - openedAtMs.current),
      ),
    });
  }, [sessionId, videoId]);

  useEffect(() => {
    const onPageHide = () => logOpen();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      logOpen();
    };
  }, [logOpen]);

  const handleClose = useCallback(() => {
    logOpen();
    setVisible(false);
    closeTimerRef.current = setTimeout(onClose, ANIMATION_MS);
  }, [logOpen, onClose]);

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
