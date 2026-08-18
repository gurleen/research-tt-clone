import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { createStudyClient, newEventId, nowIso } from "../study/events.ts";
import { ApiError } from "../client/errors.ts";
import { StubContent } from "../components/study/StubContent.tsx";
import type { StubResponse } from "../shared/api/types.ts";

export function StubPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  const videoId = searchParams.get("video_id");
  const openedAt = useRef(performance.now());
  const exitLogged = useRef(false);

  const [stub, setStub] = useState<StubResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !videoId) {
      setError("Missing session or video.");
      setLoading(false);
      return;
    }

    const client = createStudyClient();
    client
      .getStub(sessionId, videoId)
      .then(setStub)
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load stub content.",
        );
      })
      .finally(() => setLoading(false));
  }, [sessionId, videoId]);

  async function handleBack() {
    if (!sessionId || !videoId) {
      navigate("/");
      return;
    }

    if (!exitLogged.current) {
      exitLogged.current = true;
      const client = createStudyClient();
      await client.postEvent({
        event_id: newEventId(),
        session_id: sessionId,
        event: "content_stub_exit",
        video_id: videoId,
        timestamp_exit: nowIso(),
        time_on_stub_ms: Math.round(performance.now() - openedAt.current),
      });
    }

    navigate("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-white/70">
        Loading…
      </div>
    );
  }

  if (error || !stub) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-900 p-6 text-center">
        <p className="text-white/70">{error ?? "Stub not available."}</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-md bg-white px-4 py-2 text-sm text-neutral-900"
        >
          Back to feed
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="mx-auto max-w-lg px-6 py-8">
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 text-sm font-medium text-white/70 hover:text-white"
        >
          Back to feed
        </button>

        <StubContent stub={stub} />
      </div>
    </div>
  );
}
