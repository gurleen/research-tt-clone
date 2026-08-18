import { parseJsonBody } from "../../middleware/parse-json.ts";
import { getRequestOrigin, json } from "../../lib/http.ts";
import { eventBodySchema } from "../../../shared/api/schemas.ts";
import type { EventBody } from "../../../shared/api/types.ts";
import {
  writeContentLinkClick,
  writeContentLinkDisplay,
  writeContentStubExit,
  writeInterestPromptDisplay,
  writeInterestResponse,
  writePlaylistComplete,
  writeSurveyCompleteEvent,
  writeVideoView,
} from "../../services/events/writers.ts";

export async function handleIngestEvent(req: Request): Promise<Response> {
  const body = await parseJsonBody(req, eventBodySchema);
  const origin = getRequestOrigin(req);
  const result = await dispatchEvent(body, origin);

  if ("route" in result) {
    return json({ route: result.route, url: result.url });
  }

  return json({ ok: true as const, duplicate: result.duplicate });
}

async function dispatchEvent(body: EventBody, origin: string) {
  switch (body.event) {
    case "content_link_display":
      return writeContentLinkDisplay(body);
    case "content_link_click":
      return writeContentLinkClick(body);
    case "content_stub_exit":
      return writeContentStubExit(body);
    case "interest_prompt_display":
      return writeInterestPromptDisplay(body);
    case "interest_response":
      return writeInterestResponse(body);
    case "video_view":
      return writeVideoView(body);
    case "playlist_complete":
      return writePlaylistComplete(body, origin);
    case "survey_complete":
      return writeSurveyCompleteEvent(body, origin);
  }
}
