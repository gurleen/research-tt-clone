import { ApiError } from "../../lib/http.ts";
import type { DebriefResponse } from "../../../shared/api/types.ts";
import { loadSessionForEvent } from "../events/enrich-from-session.ts";
import { loadPlatformSettings } from "../platform-settings/load-settings.ts";

export async function getDebriefContent(
  sessionId: string,
): Promise<DebriefResponse> {
  const session = await loadSessionForEvent(sessionId);

  if (
    session.status !== "survey_complete" &&
    session.status !== "debriefed"
  ) {
    throw new ApiError(
      403,
      "Debrief is available after survey completion",
    );
  }

  const settings = await loadPlatformSettings();

  return {
    session_id: sessionId,
    title: settings.debrief.title,
    body: settings.debrief.body,
    withdrawal: settings.debrief.withdrawal,
    contact: settings.debrief.contact,
    disclosure:
      "Your interest prompt responses did not alter the content shown in this session.",
  };
}
