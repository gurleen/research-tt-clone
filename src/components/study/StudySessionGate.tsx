import { useEffect, type ReactNode } from "react";
import { useStudySession } from "../../study/session-context.tsx";

export function StudySessionGate({ children }: { children: ReactNode }) {
  const { state, error, handoffUrl } = useStudySession();

  useEffect(() => {
    if (state === "complete" && handoffUrl) {
      window.location.assign(handoffUrl);
    }
  }, [state, handoffUrl]);

  if (state === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-black text-white">
        <p className="text-sm text-white/80">Starting study session…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex h-full items-center justify-center bg-black p-6 text-center text-white">
        <div className="max-w-sm space-y-2">
          <p className="text-lg font-semibold">Unable to start study</p>
          <p className="text-sm text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  if (state === "complete") {
    return (
      <div className="flex h-full items-center justify-center bg-black p-6 text-center text-white">
        <div className="max-w-sm space-y-2">
          <p className="text-lg font-semibold">
            {handoffUrl ? "Continuing to survey…" : "Session complete"}
          </p>
          <p className="text-sm text-white/70">
            {handoffUrl
              ? "Please wait while we send you to the next step."
              : "You have finished the playlist. Thank you for participating."}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
