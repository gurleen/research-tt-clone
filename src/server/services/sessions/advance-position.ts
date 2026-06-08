import { db } from "../../db/client.ts";
import { ApiError } from "../../lib/http.ts";
import { loadSession } from "./create-session.ts";

export async function advancePosition(
  sessionId: string,
  position: number,
): Promise<number> {
  const session = await loadSession(sessionId);

  if (position < session.current_position) {
    throw new ApiError(
      400,
      `Position cannot move backward (current: ${session.current_position}, requested: ${position})`,
    );
  }

  if (position === session.current_position) {
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
