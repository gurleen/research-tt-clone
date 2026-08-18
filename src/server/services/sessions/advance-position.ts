import { db } from "../../db/client.ts";
import { loadSession } from "./create-session.ts";
import { shouldAdvanceResumePosition } from "./resume-position.ts";

export async function advancePosition(
  sessionId: string,
  position: number,
): Promise<number> {
  const session = await loadSession(sessionId);

  if (!shouldAdvanceResumePosition(session.current_position, position)) {
    return session.current_position;
  }

  const { data, error } = await db
    .from("sessions")
    .update({ current_position: position })
    .eq("session_id", sessionId)
    .select("current_position")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update position: ${error?.message ?? "unknown"}`);
  }

  return data.current_position;
}
