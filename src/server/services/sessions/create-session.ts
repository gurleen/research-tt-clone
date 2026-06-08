import { db } from "../../db/client.ts";
import { ApiError } from "../../lib/http.ts";
import type { SessionRow } from "../../db/tables.ts";
import type { Community, SourceType } from "../../db/tables.ts";
import { assignSourceType } from "../randomization/assign-source-type.ts";
import { composePlaylistSlots } from "../playlist/compose-playlist.ts";

export async function loadSession(
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

export async function createSessionRecord(
  community: Community,
  sourceType: SourceType,
): Promise<SessionRow> {
  const { data, error } = await db
    .from("sessions")
    .insert({
      community,
      source_type: sourceType,
      status: "in_progress",
      current_position: 0,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create session: ${error?.message ?? "unknown"}`);
  }

  return data;
}

export async function insertSessionVideos(
  rows: {
    session_id: string;
    position: number;
    video_id: string;
    show_interest_prompt: boolean;
  }[],
): Promise<void> {
  const { error } = await db.from("session_videos").insert(rows);
  if (error) {
    throw new Error(`Failed to insert session videos: ${error.message}`);
  }
}

export async function writeSessionStartEvent(
  session: SessionRow,
): Promise<void> {
  const { error } = await db.from("evt_session_start").insert(
    {
      event_id: crypto.randomUUID(),
      session_id: session.session_id,
      source_type: session.source_type,
      community: session.community,
      timestamp: new Date().toISOString(),
    },
    { onConflict: "event_id", ignoreDuplicates: true },
  );

  if (error) {
    throw new Error(`Failed to write session start event: ${error.message}`);
  }
}

export async function createSession(
  community: Community,
  sourceTypeOverride?: SourceType,
): Promise<SessionRow> {
  const sourceType = await assignSourceType(community, sourceTypeOverride);
  const slots = await composePlaylistSlots(community, sourceType);
  const session = await createSessionRecord(community, sourceType);
  await insertSessionVideos(
    slots.map((slot, position) => ({
      session_id: session.session_id,
      position,
      video_id: slot.video_id,
      show_interest_prompt: slot.show_interest_prompt,
    })),
  );
  await writeSessionStartEvent(session);
  return session;
}
