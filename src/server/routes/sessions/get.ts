import { json } from "../../lib/http.ts";
import { loadSession } from "../../services/sessions/create-session.ts";
import { buildSessionResponse } from "../../services/sessions/build-session-response.ts";

export async function handleGetSession(sessionId: string): Promise<Response> {
  const session = await loadSession(sessionId);
  const response = await buildSessionResponse(session);
  return json(response);
}
