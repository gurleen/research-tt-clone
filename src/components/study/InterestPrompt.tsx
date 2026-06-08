import { useEffect, useRef, useState } from "react";
import type { PlatformApiClient } from "../../client/platform-api.ts";
import { newEventId, nowIso } from "../../study/events.ts";

type InterestPromptProps = {
  sessionId: string;
  videoId: string;
  client: PlatformApiClient;
  onDismiss: () => void;
};

export function InterestPrompt({
  sessionId,
  videoId,
  client,
  onDismiss,
}: InterestPromptProps) {
  const [submitting, setSubmitting] = useState(false);
  const displayLogged = useRef(false);
  const promptShownAt = useRef(performance.now());

  useEffect(() => {
    if (displayLogged.current) return;
    displayLogged.current = true;

    void client.postEvent({
      event_id: newEventId(),
      session_id: sessionId,
      event: "interest_prompt_display",
      video_id: videoId,
      timestamp_display: nowIso(),
    });
  }, [client, sessionId, videoId]);

  async function respond(answer: boolean) {
    if (submitting) return;
    setSubmitting(true);

    await client.postEvent({
      event_id: newEventId(),
      session_id: sessionId,
      event: "interest_response",
      video_id: videoId,
      response: answer,
      timestamp_response: nowIso(),
      latency_ms: Math.round(performance.now() - promptShownAt.current),
    });

    onDismiss();
  }

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/60 p-6 pb-28">
      <div className="w-full max-w-sm rounded-xl bg-zinc-900/95 p-5 text-white shadow-lg">
        <p className="text-sm font-medium">
          Are you interested in learning more about this topic?
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => respond(true)}
            className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            Yes
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => respond(false)}
            className="flex-1 rounded-md border border-white/30 px-4 py-2 text-sm font-semibold"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
