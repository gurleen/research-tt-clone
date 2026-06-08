import { parseJsonBody } from "../../middleware/parse-json.ts";
import { json } from "../../lib/http.ts";
import { patchPositionBodySchema } from "../../../shared/api/schemas.ts";
import { advancePosition } from "../../services/sessions/advance-position.ts";

export async function handlePatchPosition(
  sessionId: string,
  req: Request,
): Promise<Response> {
  const body = await parseJsonBody(req, patchPositionBodySchema);
  const currentPosition = await advancePosition(sessionId, body.position);
  return json({ current_position: currentPosition });
}
