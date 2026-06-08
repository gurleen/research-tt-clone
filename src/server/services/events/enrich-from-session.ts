import { db } from "../../db/client.ts";
import { ApiError } from "../../lib/http.ts";
import type { SessionRow, VideoRow } from "../../db/tables.ts";

export type EnrichedVideoContext = {
  session: SessionRow;
  video: VideoRow;
};

export async function loadSessionForEvent(
  sessionId: string,
): Promise<SessionRow> {
  const { data, error } = await db
    .from("sessions")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load session: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, "Session not found");
  }

  return data;
}

export async function enrichVideoEvent(
  sessionId: string,
  videoId: string,
): Promise<EnrichedVideoContext> {
  const session = await loadSessionForEvent(sessionId);

  const { data: membership, error: membershipError } = await db
    .from("session_videos")
    .select("video_id")
    .eq("session_id", sessionId)
    .eq("video_id", videoId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(
      `Failed to verify video in session: ${membershipError.message}`,
    );
  }
  if (!membership) {
    throw new ApiError(400, "Video is not in this session playlist");
  }

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

  return { session, video };
}
