import type { VideoType } from "../../../shared/api/events.ts";
import type { AdminSessionPlaylistItem } from "../../../shared/api/admin-schemas.ts";
import { db } from "../../db/client.ts";
import { ApiError } from "../../lib/http.ts";
import type { SessionRow } from "../../db/tables.ts";
import {
  countSessionEvents,
  loadSessionEvents,
} from "./session-events.ts";

type PlaylistVideo = {
  video_id: string;
  video_type: VideoType;
  account_name: string;
  account_handle: string;
};

export type SessionSummary = {
  session: {
    session_id: string;
    community: SessionRow["community"];
    source_type: SessionRow["source_type"];
    status: string;
    current_position: number;
    assigned_at: string;
    demo_mode: boolean;
  };
  playlist_length: number;
  playlist: AdminSessionPlaylistItem[];
  event_counts: ReturnType<typeof countSessionEvents>;
  events: Awaited<ReturnType<typeof loadSessionEvents>>;
};

async function loadSessionPlaylist(
  sessionId: string,
): Promise<AdminSessionPlaylistItem[]> {
  const { data: rows, error } = await db
    .from("session_videos")
    .select(
      `
      position,
      video_id,
      show_interest_prompt,
      videos (
        video_id,
        video_type,
        account_name,
        account_handle
      )
    `,
    )
    .eq("session_id", sessionId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Failed to load playlist: ${error.message}`);
  }

  return (rows ?? []).map((row) => {
    const videoRaw = row.videos;
    const video = (
      Array.isArray(videoRaw) ? videoRaw[0] : videoRaw
    ) as PlaylistVideo | null;

    return {
      position: row.position,
      video_id: video?.video_id ?? row.video_id,
      video_type: video?.video_type ?? "filler",
      account_name: video?.account_name ?? "—",
      account_handle: video?.account_handle ?? "—",
      show_learn_more: video?.video_type === "ingroup",
      show_interest_prompt: row.show_interest_prompt,
    };
  });
}

export async function buildSessionSummary(
  sessionId: string,
): Promise<SessionSummary> {
  const { data: session, error: sessionError } = await db
    .from("sessions")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (sessionError) {
    throw new Error(`Failed to load session: ${sessionError.message}`);
  }
  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  const [playlist, events] = await Promise.all([
    loadSessionPlaylist(sessionId),
    loadSessionEvents(sessionId),
  ]);

  return {
    session: {
      session_id: session.session_id,
      community: session.community,
      source_type: session.source_type,
      status: session.status,
      current_position: session.current_position,
      assigned_at: session.assigned_at,
      demo_mode: session.demo_mode,
    },
    playlist_length: playlist.length,
    playlist,
    event_counts: countSessionEvents(events),
    events,
  };
}
