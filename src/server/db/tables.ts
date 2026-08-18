import type { Database, Enums, Tables, TablesInsert } from "./database.types.ts";

export type Community = Enums<"community">;
export type SourceType = Enums<"source_type">;
export type VideoType = Enums<"video_type">;

export type SessionRow = Tables<"sessions">;
export type SessionInsert = TablesInsert<"sessions">;
export type SessionVideoRow = Tables<"session_videos">;
export type SessionVideoInsert = TablesInsert<"session_videos">;
export type VideoRow = Tables<"videos">;
export type ExperimentConfigRow = Tables<"experiment_config">;
export type StubContentRow = Tables<"stub_content">;
export type PlatformSettingRow = Tables<"platform_settings">;

export type SessionStatus =
  | "in_progress"
  | "playlist_complete"
  | "survey_complete"
  | "debriefed";

export type EventTableName =
  | "evt_session_start"
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

export type { Database };
