import { db } from "../../db/client.ts";
import type { SessionResponse } from "../../../shared/api/types.ts";
import type { SessionRow } from "../../db/tables.ts";

export async function buildSessionResponse(
  session: SessionRow,
): Promise<SessionResponse> {
  const { data: rows, error } = await db
    .from("session_videos")
    .select(
      `
      position,
      show_interest_prompt,
      videos (
        video_id,
        video_type,
        media_url,
        duration_ms,
        account_name,
        account_handle,
        profile_thumbnail_url
      )
    `,
    )
    .eq("session_id", session.session_id)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Failed to load session playlist: ${error.message}`);
  }

  const playlist = (rows ?? []).map((row) => {
    const videoRaw = row.videos;
  const video = (Array.isArray(videoRaw) ? videoRaw[0] : videoRaw) as {
      video_id: string;
      video_type: "ingroup" | "filler";
      media_url: string;
      duration_ms: number | null;
      account_name: string;
      account_handle: string;
      profile_thumbnail_url: string;
    };

    return {
      position: row.position,
      video_id: video.video_id,
      video_type: video.video_type,
      media_url: video.media_url,
      duration_ms: video.duration_ms,
      attribution: {
        account_name: video.account_name,
        account_handle: video.account_handle,
        profile_thumbnail_url: video.profile_thumbnail_url,
      },
      show_learn_more: video.video_type === "ingroup",
      show_interest_prompt: row.show_interest_prompt,
    };
  });

  return {
    session_id: session.session_id,
    community: session.community,
    current_position: session.current_position,
    status: session.status as SessionResponse["status"],
    playlist,
  };
}
