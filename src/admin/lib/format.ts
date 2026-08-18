const COMMUNITY_LABELS: Record<string, string> = {
  armenian: "Armenian",
  iranian: "Iranian",
  sikh: "Sikh",
};

export function formatCommunity(community: string): string {
  return COMMUNITY_LABELS[community] ?? community;
}

export function formatSourceType(sourceType: string): string {
  return sourceType.replaceAll("_", " ");
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 10) {
    return `${seconds.toFixed(1)}s`;
  }
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
}

export function formatSessionId(sessionId: string): string {
  if (sessionId.length <= 8) {
    return sessionId;
  }
  return `${sessionId.slice(0, 8)}…`;
}

export const EVENT_TABLE_LABELS = {
  evt_session_start: "Session start",
  evt_content_link_display: "Learn more shown",
  evt_content_link_click: "Learn more clicked",
  evt_content_stub_exit: "Stub closed",
  evt_interest_prompt_display: "Interest prompt shown",
  evt_interest_response: "Interest answers",
  evt_video_view: "Video views",
  evt_like: "Likes",
  evt_playlist_complete: "Playlist complete",
  evt_survey_complete: "Survey complete",
} as const;
