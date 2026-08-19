import { useEffect, useRef, useState } from "react";
import type { PlatformApiClient } from "../../client/platform-api.ts";
import type { InterestResponse, VideoType } from "../../shared/api/events.ts";
import { newEventId, nowIso } from "../../study/events.ts";

type InterestPromptProps = {
  sessionId: string;
  videoId: string;
  videoType: VideoType;
  client: PlatformApiClient;
  onDismiss: () => void;
};

const TOPIC_ANSWERS: InterestResponse[] = ["yes", "no"];
const FILLER_ANSWERS: InterestResponse[] = ["yes", "no", "maybe"];

function promptCopy(videoType: VideoType): string {
  if (videoType === "filler") {
    return "Would you like to see more of this content?";
  }
  return "Would you like to learn more about this topic?";
}

function promptAnswers(videoType: VideoType): InterestResponse[] {
  return videoType === "filler" ? FILLER_ANSWERS : TOPIC_ANSWERS;
}

function answerLabel(answer: InterestResponse): string {
  if (answer === "yes") return "Yes";
  if (answer === "no") return "No";
  return "Maybe";
}

export function InterestPrompt({
  sessionId,
  videoId,
  videoType,
  client,
  onDismiss,
}: InterestPromptProps) {
  const [submitting, setSubmitting] = useState(false);
  const displayLogged = useRef(false);
  const promptShownAt = useRef(performance.now());
  const answers = promptAnswers(videoType);

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

  async function respond(answer: InterestResponse) {
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
        <p className="text-sm font-medium">{promptCopy(videoType)}</p>
        <div className="mt-4 flex gap-2">
          {answers.map((answer) => (
            <button
              key={answer}
              type="button"
              disabled={submitting}
              onClick={() => respond(answer)}
              className={
                answer === "yes"
                  ? "flex-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-black"
                  : "flex-1 rounded-md border border-white/30 px-3 py-2 text-sm font-semibold"
              }
            >
              {answerLabel(answer)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
