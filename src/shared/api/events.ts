export const EVENT_NAMES = [
  "content_link_display",
  "content_link_click",
  "content_stub_exit",
  "interest_prompt_display",
  "interest_response",
  "video_view",
  "like",
  "comments_open",
  "playlist_complete",
  "survey_complete",
] as const;

export const VIDEO_VIEW_ENDED_REASONS = [
  "swipe",
  "hidden",
  "pagehide",
  "playlist_complete",
] as const;

export type VideoViewEndedReason = (typeof VIDEO_VIEW_ENDED_REASONS)[number];

export type EventName = (typeof EVENT_NAMES)[number];

export const COMMUNITIES = ["armenian", "sikh", "iranian"] as const;
export const SOURCE_TYPES = [
  "micro_influencer",
  "institutional",
  "control",
] as const;
export const VIDEO_TYPES = ["ingroup", "filler"] as const;

export type Community = (typeof COMMUNITIES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type VideoType = (typeof VIDEO_TYPES)[number];

export type EventTableName =
  | "evt_content_link_display"
  | "evt_content_link_click"
  | "evt_content_stub_exit"
  | "evt_interest_prompt_display"
  | "evt_interest_response"
  | "evt_video_view"
  | "evt_like"
  | "evt_comments_open"
  | "evt_playlist_complete"
  | "evt_survey_complete";

export const EVENT_TO_TABLE: Record<EventName, EventTableName> = {
  content_link_display: "evt_content_link_display",
  content_link_click: "evt_content_link_click",
  content_stub_exit: "evt_content_stub_exit",
  interest_prompt_display: "evt_interest_prompt_display",
  interest_response: "evt_interest_response",
  video_view: "evt_video_view",
  like: "evt_like",
  comments_open: "evt_comments_open",
  playlist_complete: "evt_playlist_complete",
  survey_complete: "evt_survey_complete",
};

export const VIDEO_EVENTS: EventName[] = [
  "content_link_display",
  "content_link_click",
  "content_stub_exit",
  "interest_prompt_display",
  "interest_response",
  "video_view",
  "like",
  "comments_open",
];

export const SESSION_ONLY_EVENTS: EventName[] = [
  "playlist_complete",
  "survey_complete",
];
