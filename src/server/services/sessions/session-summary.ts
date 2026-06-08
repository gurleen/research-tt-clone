import { db } from "../../db/client.ts";
import { ApiError } from "../../lib/http.ts";
import type { SessionRow } from "../../db/tables.ts";
import {
  countSessionEvents,
  loadSessionEvents,
} from "./session-events.ts";

export type SessionSummary = {
  session: {
    session_id: string;
    community: SessionRow["community"];
    source_type: SessionRow["source_type"];
    status: string;
    current_position: number;
    assigned_at: string;
  };
  playlist_length: number;
  event_counts: ReturnType<typeof countSessionEvents>;
  events: Awaited<ReturnType<typeof loadSessionEvents>>;
};

export async function buildSessionSummary(
  sessionId: string,
): Promise<SessionSummary> {
  const { data: session, error: sessionError } = await db
    .from("sessions")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (sessionError) {
    throw new Error(`Failed to load session: ${sessionError.message}`);
  }
  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  const { count, error: countError } = await db
    .from("session_videos")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (countError) {
    throw new Error(`Failed to count playlist: ${countError.message}`);
  }

  const events = await loadSessionEvents(sessionId);

  return {
    session: {
      session_id: session.session_id,
      community: session.community,
      source_type: session.source_type,
      status: session.status,
      current_position: session.current_position,
      assigned_at: session.assigned_at,
    },
    playlist_length: count ?? 0,
    event_counts: countSessionEvents(events),
    events,
  };
}
