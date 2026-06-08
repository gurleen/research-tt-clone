import { requireAdminAuth } from "../../../middleware/require-admin-auth.ts";
import { json } from "../../../lib/http.ts";
import { buildSessionSummary } from "../../../services/sessions/session-summary.ts";

export async function handleAdminSessionSummary(
  req: Request,
  sessionId: string,
): Promise<Response> {
  await requireAdminAuth(req);
  const summary = await buildSessionSummary(sessionId);
  return json(summary);
}
