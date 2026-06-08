import type { SurveyCompleteBody } from "../../../shared/api/types.ts";
import { buildDebriefUrl } from "../../config/env.ts";
import { loadSessionForEvent } from "./enrich-from-session.ts";
import {
  idempotentInsert,
  updateSessionStatus,
} from "./idempotent-insert.ts";

export async function handleSurveyCompleteCallback(
  sessionId: string,
  body: SurveyCompleteBody,
  origin: string,
): Promise<{ route: "debrief"; url: string; duplicate: boolean }> {
  await loadSessionForEvent(sessionId);

  const { duplicate } = await idempotentInsert("evt_survey_complete", {
    event_id: body.event_id,
    session_id: sessionId,
    timestamp: body.timestamp,
  });

  if (!duplicate) {
    await updateSessionStatus(sessionId, "survey_complete");
  }

  return {
    duplicate,
    route: "debrief",
    url: buildDebriefUrl(sessionId, origin),
  };
}
