import { useEffect, useRef } from "react";
import type { PlatformApiClient } from "../../client/platform-api.ts";
import { newEventId, nowIso, postEventBeacon } from "../../study/events.ts";

type LearnMoreLinkProps = {
  sessionId: string;
  videoId: string;
  client: PlatformApiClient;
  onOpen: () => void;
};

export function LearnMoreLink({
  sessionId,
  videoId,
  client,
  onOpen,
}: LearnMoreLinkProps) {
  const displayLogged = useRef(false);

  useEffect(() => {
    if (displayLogged.current) return;
    displayLogged.current = true;

    void client.postEvent({
      event_id: newEventId(),
      session_id: sessionId,
      event: "content_link_display",
      video_id: videoId,
      timestamp_display: nowIso(),
    });
  }, [client, sessionId, videoId]);

  function handleClick() {
    const clickStarted = performance.now();
    postEventBeacon({
      event_id: newEventId(),
      session_id: sessionId,
      event: "content_link_click",
      video_id: videoId,
      timestamp_click: nowIso(),
      latency_ms: Math.round(performance.now() - clickStarted),
    });

    onOpen();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="pointer-events-auto mt-2 text-sm font-semibold underline drop-shadow"
    >
      Learn more
    </button>
  );
}
