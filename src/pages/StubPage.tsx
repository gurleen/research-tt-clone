import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  createStudyClient,
  newEventId,
  nowIso,
} from "../study/events.ts";
import { ApiError } from "../client/errors.ts";
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-700">
        Loading…
      </div>
    );
  }

  if (error || !stub) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-6 text-center">
        <p className="text-zinc-700">{error ?? "Stub not available."}</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
        >
          Back to feed
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-lg px-6 py-8">
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          Back to feed
        </button>

        <div className="mb-6 flex items-center gap-3">
          <img
            src={stub.attribution.profile_thumbnail_url}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold">{stub.attribution.account_name}</p>
            <p className="text-sm text-zinc-600">
              {stub.attribution.account_handle}
            </p>
          </div>
        </div>

        {stub.body_status === "not_yet_configured" || !stub.body ? (
          <p className="text-zinc-600">Content not yet configured.</p>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{stub.body}</p>
        )}
      </div>
    </div>
  );
}
