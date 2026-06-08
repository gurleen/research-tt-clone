import { db } from "../../db/client.ts";
import { ApiError } from "../../lib/http.ts";
import type { StubResponse } from "../../../shared/api/types.ts";
import { loadSession } from "./create-session.ts";

export async function getStub(
  sessionId: string,
  videoId: string,
): Promise<StubResponse> {
  const session = await loadSession(sessionId);

  const { data: video, error: videoError } = await db
    .from("videos")
    .select("*")
    .eq("video_id", videoId)
    .maybeSingle();

  if (videoError) {
    throw new Error(`Failed to load video: ${videoError.message}`);
  }
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.video_type !== "ingroup") {
    throw new ApiError(400, "Stub is only available for ingroup videos");
  }

  const { data: stub, error: stubError } = await db
    .from("stub_content")
    .select("body")
    .eq("community", session.community)
    .maybeSingle();

  if (stubError) {
    throw new Error(`Failed to load stub content: ${stubError.message}`);
  }

  const body = stub?.body ?? null;

  return {
    attribution: {
      account_name: video.account_name,
      account_handle: video.account_handle,
      profile_thumbnail_url: video.profile_thumbnail_url,
    },
    body,
    body_status: body ? "configured" : "not_yet_configured",
  };
}
