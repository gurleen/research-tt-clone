import type { EventBody, HandoffResponse } from "../../../shared/api/types.ts";
import { buildDebriefUrl } from "../../config/env.ts";
import {
  buildSurveyUrl,
  loadPlatformSettings,
} from "../platform-settings/load-settings.ts";
import { loadSession } from "../sessions/create-session.ts";
import { enrichVideoEvent } from "./enrich-from-session.ts";
import {
  idempotentInsert,
  updateSessionStatus,
} from "./idempotent-insert.ts";

export async function writeContentLinkDisplay(
  body: Extract<EventBody, { event: "content_link_display" }>,
): Promise<{ duplicate: boolean }> {
  const { session, video } = await enrichVideoEvent(
    body.session_id,
    body.video_id,
  );

  return idempotentInsert("evt_content_link_display", {
    event_id: body.event_id,
    session_id: body.session_id,
    video_id: body.video_id,
    video_type: video.video_type,
    source_type: session.source_type,
    community: session.community,
    timestamp_display: body.timestamp_display,
  });
}

export async function writeContentLinkClick(
  body: Extract<EventBody, { event: "content_link_click" }>,
): Promise<{ duplicate: boolean }> {
  const { session, video } = await enrichVideoEvent(
    body.session_id,
    body.video_id,
  );

  return idempotentInsert("evt_content_link_click", {
    event_id: body.event_id,
    session_id: body.session_id,
    video_id: body.video_id,
    video_type: video.video_type,
    source_type: session.source_type,
    community: session.community,
    timestamp_click: body.timestamp_click,
    latency_ms: body.latency_ms,
  });
}

export async function writeContentStubExit(
  body: Extract<EventBody, { event: "content_stub_exit" }>,
): Promise<{ duplicate: boolean }> {
  const { session, video } = await enrichVideoEvent(
    body.session_id,
    body.video_id,
  );

  if (video.video_type !== "ingroup") {
    throw new Error("Stub exit is only valid for ingroup videos");
  }

  return idempotentInsert("evt_content_stub_exit", {
    event_id: body.event_id,
    session_id: body.session_id,
    video_id: body.video_id,
    source_type: session.source_type,
    community: session.community,
    timestamp_exit: body.timestamp_exit,
    time_on_stub_ms: body.time_on_stub_ms,
  });
}

export async function writeInterestPromptDisplay(
  body: Extract<EventBody, { event: "interest_prompt_display" }>,
): Promise<{ duplicate: boolean }> {
  const { session, video } = await enrichVideoEvent(
    body.session_id,
    body.video_id,
  );

  return idempotentInsert("evt_interest_prompt_display", {
    event_id: body.event_id,
    session_id: body.session_id,
    video_id: body.video_id,
    video_type: video.video_type,
    source_type: session.source_type,
    community: session.community,
    timestamp_display: body.timestamp_display,
  });
}

export async function writeInterestResponse(
  body: Extract<EventBody, { event: "interest_response" }>,
): Promise<{ duplicate: boolean }> {
  const { session, video } = await enrichVideoEvent(
    body.session_id,
    body.video_id,
  );

  return idempotentInsert("evt_interest_response", {
    event_id: body.event_id,
    session_id: body.session_id,
    video_id: body.video_id,
    video_type: video.video_type,
    source_type: session.source_type,
    community: session.community,
    response: body.response,
    timestamp_response: body.timestamp_response,
    latency_ms: body.latency_ms,
  });
}

export async function writeVideoView(
  body: Extract<EventBody, { event: "video_view" }>,
): Promise<{ duplicate: boolean }> {
  const { session, video } = await enrichVideoEvent(
    body.session_id,
    body.video_id,
  );

  return idempotentInsert("evt_video_view", {
    event_id: body.event_id,
    session_id: body.session_id,
    video_id: body.video_id,
    video_type: video.video_type,
    source_type: session.source_type,
    community: session.community,
    visit_index: body.visit_index,
    started_at: body.started_at,
    ended_at: body.ended_at,
    dwell_ms: body.dwell_ms,
    playback_ms: body.playback_ms,
    max_progress: body.max_progress,
    loop_count: body.loop_count,
    ended_reason: body.ended_reason,
  });
}

export async function writeLike(
  body: Extract<EventBody, { event: "like" }>,
): Promise<{ duplicate: boolean }> {
  const { session, video } = await enrichVideoEvent(
    body.session_id,
    body.video_id,
  );

  return idempotentInsert("evt_like", {
    event_id: body.event_id,
    session_id: body.session_id,
    video_id: body.video_id,
    video_type: video.video_type,
    source_type: session.source_type,
    community: session.community,
    liked: body.liked,
    timestamp: body.timestamp,
  });
}

export async function writePlaylistComplete(
  body: Extract<EventBody, { event: "playlist_complete" }>,
  origin: string,
): Promise<HandoffResponse & { duplicate: boolean }> {
  const { duplicate } = await idempotentInsert("evt_playlist_complete", {
    event_id: body.event_id,
    session_id: body.session_id,
    timestamp: body.timestamp,
  });

  if (!duplicate) {
    await updateSessionStatus(body.session_id, "playlist_complete");
  }

  const [settings, session] = await Promise.all([
    loadPlatformSettings(),
    loadSession(body.session_id),
  ]);

  return {
    duplicate,
    route: "survey",
    url: buildSurveyUrl(body.session_id, settings.surveyUrl, {
      externalId: session.external_id,
      status: "playlist_complete",
    }),
  };
}

export async function writeSurveyCompleteEvent(
  body: Extract<EventBody, { event: "survey_complete" }>,
  origin: string,
): Promise<HandoffResponse & { duplicate: boolean }> {
  const { duplicate } = await idempotentInsert("evt_survey_complete", {
    event_id: body.event_id,
    session_id: body.session_id,
    timestamp: body.timestamp,
  });

  if (!duplicate) {
    await updateSessionStatus(body.session_id, "survey_complete");
  }

  return {
    duplicate,
    route: "debrief",
    url: buildDebriefUrl(body.session_id, origin),
  };
}
