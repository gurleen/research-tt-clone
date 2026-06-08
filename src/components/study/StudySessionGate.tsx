import type { ReactNode } from "react";
import { useStudySession } from "../../study/session-context.tsx";

export function StudySessionGate({ children }: { children: ReactNode }) {
  const { state, error } = useStudySession();

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
          <p className="text-lg font-semibold">Session complete</p>
          <p className="text-sm text-white/70">
            You have finished the playlist. Thank you for participating.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
