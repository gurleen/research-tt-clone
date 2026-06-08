import { requireAdminAuth } from "../../../middleware/require-admin-auth.ts";
import { json } from "../../../lib/http.ts";
import { reactivateVideo } from "../../../services/videos/deactivate-video.ts";

export async function handleReactivateVideo(
  req: Request,
  videoId: string,
): Promise<Response> {
  await requireAdminAuth(req);
  const result = await reactivateVideo(videoId);
  return json(result);
}
