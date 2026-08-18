import { db } from "../../db/client.ts";
import { ApiError } from "../../lib/http.ts";
import type { SessionRow } from "../../db/tables.ts";
import type { Community, SourceType } from "../../db/tables.ts";
import { assignSourceType } from "../randomization/assign-source-type.ts";
import { composePlaylistSlots } from "../playlist/compose-playlist.ts";

const LINK_USED_MESSAGE = "This link has already been used.";

export type CreateSessionResult = {
  session: SessionRow;
  created: boolean;
};

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

export async function loadSessionByExternalId(
  externalId: string,
): Promise<SessionRow | null> {
  const { data, error } = await db
    .from("sessions")
    .select("*")
    .eq("external_id", externalId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load session by external_id: ${error.message}`);
  }

  return data;
}

function assertReusable(session: SessionRow): SessionRow {
  if (session.status === "in_progress") {
    return session;
  }
  throw new ApiError(409, LINK_USED_MESSAGE);
}

function isUniqueViolation(error: { code?: string; message: string }): boolean {
  return error.code === "23505" || error.message.includes("duplicate key");
}

export async function createSessionRecord(
  community: Community,
  sourceType: SourceType,
  externalId?: string,
): Promise<SessionRow> {
  const { data, error } = await db
    .from("sessions")
    .insert({
      community,
      source_type: sourceType,
      status: "in_progress",
      current_position: 0,
      ...(externalId ? { external_id: externalId } : {}),
    })
    .select("*")
    .single();

  if (error || !data) {
    if (error && isUniqueViolation(error)) {
      throw Object.assign(new Error(error.message), { code: "23505" });
    }
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
  externalId?: string,
): Promise<CreateSessionResult> {
  if (externalId) {
    const existing = await loadSessionByExternalId(externalId);
    if (existing) {
      return { session: assertReusable(existing), created: false };
    }
  }

  const sourceType = await assignSourceType(community, sourceTypeOverride);
  const slots = await composePlaylistSlots(community, sourceType);

  try {
    const session = await createSessionRecord(
      community,
      sourceType,
      externalId,
    );
    await insertSessionVideos(
      slots.map((slot, position) => ({
        session_id: session.session_id,
        position,
        video_id: slot.video_id,
        show_interest_prompt: slot.show_interest_prompt,
      })),
    );
    await writeSessionStartEvent(session);
    return { session, created: true };
  } catch (error) {
    if (
      externalId &&
      error instanceof Error &&
      isUniqueViolation(error)
    ) {
      const existing = await loadSessionByExternalId(externalId);
      if (existing) {
        return { session: assertReusable(existing), created: false };
      }
    }
    throw error;
  }
}
