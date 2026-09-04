import { env } from "../../config/env.ts";
import { parseJsonBody } from "../../middleware/parse-json.ts";
import { json, ApiError } from "../../lib/http.ts";
import { createSessionBodySchema } from "../../../shared/api/schemas.ts";
import { createSession } from "../../services/sessions/create-session.ts";
import { buildSessionResponse } from "../../services/sessions/build-session-response.ts";

export async function handleCreateSession(req: Request): Promise<Response> {
  const body = await parseJsonBody(req, createSessionBodySchema);

  if (body.source_type && !env.stagingMode) {
    throw new ApiError(
      403,
      "source_type override is only allowed in staging mode",
    );
  }

  if (!env.stagingMode && !body.external_id && !body.demo_mode) {
    throw new ApiError(
      400,
      "Missing study link token. Open the study from your survey.",
    );
  }

  const { session, created } = await createSession(
    body.community,
    body.source_type,
    body.external_id,
    body.demo_mode === true,
  );
  const response = await buildSessionResponse(session);
  return json(response, created ? 201 : 200);
}
