import { useCallback, useEffect, useRef, useState } from "react";
import type { PlatformApiClient } from "../../client/platform-api.ts";
import { ApiError } from "../../client/errors.ts";
import type { StubResponse } from "../../shared/api/types.ts";
import { newEventId, nowIso } from "../../study/events.ts";
import { Z } from "../../utils/layout.ts";
import { StubContent } from "./StubContent.tsx";

const ANIMATION_MS = 300;

type StubSheetProps = {
  sessionId: string;
  videoId: string;
  client: PlatformApiClient;
  onClose: () => void;
};

export function StubSheet({
  sessionId,
  videoId,
  client,
  onClose,
}: StubSheetProps) {
  const [visible, setVisible] = useState(false);
  const [stub, setStub] = useState<StubResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const openedAt = useRef(performance.now());
  const exitLogged = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    client
      .getStub(sessionId, videoId)
      .then(setStub)
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load content.",
        );
      })
      .finally(() => setLoading(false));
  }, [client, sessionId, videoId]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const logExit = useCallback(async () => {
    if (exitLogged.current) return;
    exitLogged.current = true;

    await client.postEvent({
      event_id: newEventId(),
      session_id: sessionId,
      event: "content_stub_exit",
      video_id: videoId,
      timestamp_exit: nowIso(),
      time_on_stub_ms: Math.round(performance.now() - openedAt.current),
    });
  }, [client, sessionId, videoId]);

  const handleClose = useCallback(() => {
    void logExit();
    setVisible(false);
    closeTimerRef.current = setTimeout(onClose, ANIMATION_MS);
  }, [logExit, onClose]);

  return (
    <div
      className="absolute inset-0 flex flex-col justify-end"
      style={{ zIndex: Z.sheet }}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
        aria-label="Close learn more"
      />
      <div
        className={`comments-sheet-panel relative flex max-h-[60vh] w-full flex-col rounded-t-2xl bg-neutral-900 transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="font-semibold text-white">Learn more</h2>
          <button
            type="button"
            onClick={handleClose}
            className="px-2 text-2xl leading-none text-white/70"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && <p className="text-white/70">Loading…</p>}
          {!loading && error && <p className="text-white/70">{error}</p>}
          {!loading && !error && stub && <StubContent stub={stub} />}
        </div>
      </div>
    </div>
  );
}
