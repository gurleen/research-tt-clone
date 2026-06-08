import { parseQueryParam } from "../../middleware/parse-json.ts";
import { json } from "../../lib/http.ts";
import { getDebriefContent } from "../../services/debrief/get-debrief.ts";

export async function handleGetDebrief(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const sessionId = parseQueryParam(url, "session_id");
  const debrief = await getDebriefContent(sessionId!);
  return json(debrief);
}
