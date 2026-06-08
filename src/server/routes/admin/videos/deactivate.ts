import { requireAdminAuth } from "../../../middleware/require-admin-auth.ts";
import { json } from "../../../lib/http.ts";
import { deactivateVideo } from "../../../services/videos/deactivate-video.ts";

export async function handleDeactivateVideo(
  req: Request,
  videoId: string,
): Promise<Response> {
  await requireAdminAuth(req);
  const result = await deactivateVideo(videoId);
  return json(result);
}
