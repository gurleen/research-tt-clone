import { visitIndexStorageKey } from "../hooks/video-dwell.ts";

export const STUDY_SESSION_STORAGE_KEY = "study_session_id";

export function clearStudyClientState(sessionId?: string | null): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STUDY_SESSION_STORAGE_KEY);
  if (sessionId) {
    sessionStorage.removeItem(visitIndexStorageKey(sessionId));
  }
}
