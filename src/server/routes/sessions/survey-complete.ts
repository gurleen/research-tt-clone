import { parseJsonBody } from "../../middleware/parse-json.ts";
import { getRequestOrigin, json } from "../../lib/http.ts";
import { surveyCompleteBodySchema } from "../../../shared/api/schemas.ts";
import { handleSurveyCompleteCallback } from "../../services/events/handle-survey-complete.ts";

export async function handleSurveyCompleteRoute(
  sessionId: string,
  req: Request,
): Promise<Response> {
  const body = await parseJsonBody(req, surveyCompleteBodySchema);
  const origin = getRequestOrigin(req);
  const result = await handleSurveyCompleteCallback(sessionId, body, origin);
  return json({
    route: result.route,
    url: result.url,
    duplicate: result.duplicate,
  });
}
