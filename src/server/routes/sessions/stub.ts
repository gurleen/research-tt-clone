import { json } from "../../lib/http.ts";
import { getStub } from "../../services/sessions/get-stub.ts";

export async function handleGetStub(
  sessionId: string,
  videoId: string,
): Promise<Response> {
  const stub = await getStub(sessionId, videoId);
  return json(stub);
}
