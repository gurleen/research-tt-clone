import { z } from "zod";
import {
  COMMUNITIES,
  EVENT_NAMES,
  INTEREST_RESPONSES,
  SOURCE_TYPES,
  TREATMENT_SOURCE_TYPES,
  VIDEO_TYPES,
  VIDEO_VIEW_ENDED_REASONS,
} from "./events.ts";

const uuid = z.uuid();
const isoTimestamp = z.iso.datetime({ offset: true });

export const communitySchema = z.enum(COMMUNITIES);
export const sourceTypeSchema = z.enum(SOURCE_TYPES);
export const treatmentSourceTypeSchema = z.enum(TREATMENT_SOURCE_TYPES);
export const videoTypeSchema = z.enum(VIDEO_TYPES);
export const interestResponseSchema = z.enum(INTEREST_RESPONSES);

export const attributionSchema = z.object({
  account_name: z.string(),
  account_handle: z.string(),
  profile_thumbnail_url: z.string(),
});

export const catalogCommentSchema = z.object({
  username: z.string().min(1),
  text: z.string().min(1),
  timestamp: z.string().min(1).optional(),
});

export type CatalogComment = z.infer<typeof catalogCommentSchema>;

export function parseCatalogComments(value: unknown): CatalogComment[] {
  const parsed = catalogCommentSchema.array().safeParse(value);
  return parsed.success ? parsed.data : [];
}

export const playlistItemSchema = z.object({
  position: z.number().int().nonnegative(),
  video_id: z.string(),
  video_type: videoTypeSchema,
  media_url: z.string(),
  duration_ms: z.number().int().nullable(),
  attribution: attributionSchema,
  caption: z.string(),
  like_count: z.number().int().nonnegative(),
  comment_count: z.number().int().nonnegative(),
  follower_count: z.number().int().nonnegative(),
  share_count: z.number().int().nonnegative(),
  save_count: z.number().int().nonnegative(),
  comments: z.array(catalogCommentSchema),
  show_learn_more: z.boolean(),
  show_interest_prompt: z.boolean(),
});

export const sessionResponseSchema = z.object({
  session_id: uuid,
  community: communitySchema,
  current_position: z.number().int().nonnegative(),
  status: z.enum([
    "in_progress",
    "playlist_complete",
    "survey_complete",
    "debriefed",
  ]),
  playlist: z.array(playlistItemSchema),
});

export const externalIdSchema = z
  .string()
  .regex(/^R_[A-Za-z0-9]+$/, "external_id must be a Qualtrics ResponseID (R_ + alphanumerics)")
  .max(64);

export const createSessionBodySchema = z.object({
  community: communitySchema,
  source_type: sourceTypeSchema.optional(),
  external_id: externalIdSchema.optional(),
});

export const patchPositionBodySchema = z.object({
  position: z.number().int().nonnegative(),
});

export const patchPositionResponseSchema = z.object({
  current_position: z.number().int().nonnegative(),
});

export const stubResponseSchema = z.object({
  attribution: attributionSchema,
  body: z.string().nullable(),
  body_status: z.enum(["configured", "not_yet_configured"]),
});

export const debriefResponseSchema = z.object({
  session_id: uuid,
  title: z.string(),
  body: z.string(),
  withdrawal: z.string(),
  contact: z.string(),
  disclosure: z.string(),
});

export const handoffResponseSchema = z.object({
  route: z.enum(["survey", "debrief"]),
  url: z.string(),
});

export const eventResponseSchema = z.union([
  z.object({ ok: z.literal(true), duplicate: z.boolean() }),
  handoffResponseSchema,
]);

const eventBaseSchema = z
  .object({
    event_id: uuid,
    session_id: uuid,
  })
  .strict();

export const contentLinkDisplayEventSchema = eventBaseSchema.extend({
  event: z.literal("content_link_display"),
  video_id: z.string(),
  timestamp_display: isoTimestamp,
});

export const contentLinkClickEventSchema = eventBaseSchema.extend({
  event: z.literal("content_link_click"),
  video_id: z.string(),
  timestamp_click: isoTimestamp,
  latency_ms: z.number().int().nonnegative(),
});

export const contentStubExitEventSchema = eventBaseSchema.extend({
  event: z.literal("content_stub_exit"),
  video_id: z.string(),
  timestamp_exit: isoTimestamp,
  time_on_stub_ms: z.number().int().nonnegative(),
});

export const interestPromptDisplayEventSchema = eventBaseSchema.extend({
  event: z.literal("interest_prompt_display"),
  video_id: z.string(),
  timestamp_display: isoTimestamp,
});

export const interestResponseEventSchema = eventBaseSchema.extend({
  event: z.literal("interest_response"),
  video_id: z.string(),
  response: interestResponseSchema,
  timestamp_response: isoTimestamp,
  latency_ms: z.number().int().nonnegative(),
});

export const videoViewEventSchema = eventBaseSchema.extend({
  event: z.literal("video_view"),
  video_id: z.string(),
  visit_index: z.number().int().min(1),
  started_at: isoTimestamp,
  ended_at: isoTimestamp,
  dwell_ms: z.number().int().nonnegative(),
  playback_ms: z.number().int().nonnegative(),
  max_progress: z.number().nonnegative(),
  loop_count: z.number().int().nonnegative(),
  ended_reason: z.enum(VIDEO_VIEW_ENDED_REASONS),
});

export const likeEventSchema = eventBaseSchema.extend({
  event: z.literal("like"),
  video_id: z.string(),
  liked: z.boolean(),
  timestamp: isoTimestamp,
});

export const commentsOpenEventSchema = eventBaseSchema.extend({
  event: z.literal("comments_open"),
  video_id: z.string(),
  timestamp_open: isoTimestamp,
  time_on_sheet_ms: z.number().int().nonnegative(),
});

export const playlistCompleteEventSchema = eventBaseSchema.extend({
  event: z.literal("playlist_complete"),
  timestamp: isoTimestamp,
});

export const surveyCompleteEventSchema = eventBaseSchema.extend({
  event: z.literal("survey_complete"),
  timestamp: isoTimestamp,
});

export const eventBodySchema = z.discriminatedUnion("event", [
  contentLinkDisplayEventSchema,
  contentLinkClickEventSchema,
  contentStubExitEventSchema,
  interestPromptDisplayEventSchema,
  interestResponseEventSchema,
  videoViewEventSchema,
  likeEventSchema,
  commentsOpenEventSchema,
  playlistCompleteEventSchema,
  surveyCompleteEventSchema,
]).superRefine((value, ctx) => {
  const allowedKeys = new Set(Object.keys(value));
  const knownKeys = new Set([
    "event_id",
    "session_id",
    "event",
    "video_id",
    "timestamp_display",
    "timestamp_click",
    "latency_ms",
    "timestamp_exit",
    "time_on_stub_ms",
    "response",
    "timestamp_response",
    "timestamp",
    "visit_index",
    "started_at",
    "ended_at",
    "dwell_ms",
    "playback_ms",
    "max_progress",
    "loop_count",
    "ended_reason",
    "liked",
    "timestamp_open",
    "time_on_sheet_ms",
  ]);
  for (const key of allowedKeys) {
    if (!knownKeys.has(key)) {
      ctx.addIssue({
        code: "custom",
        message: `Unexpected field: ${key}`,
      });
    }
  }
});

export const exportFormatSchema = z.enum(["csv", "json"]);

export const surveyCompleteBodySchema = z.object({
  event_id: uuid,
  timestamp: isoTimestamp,
});

export type CreateSessionBody = z.infer<typeof createSessionBodySchema>;
export type PatchPositionBody = z.infer<typeof patchPositionBodySchema>;
export type PatchPositionResponse = z.infer<typeof patchPositionResponseSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type PlaylistItem = z.infer<typeof playlistItemSchema>;
export type StubResponse = z.infer<typeof stubResponseSchema>;
export type DebriefResponse = z.infer<typeof debriefResponseSchema>;
export type HandoffResponse = z.infer<typeof handoffResponseSchema>;
export type EventBody = z.infer<typeof eventBodySchema>;
export type EventResponse = z.infer<typeof eventResponseSchema>;
export type SurveyCompleteBody = z.infer<typeof surveyCompleteBodySchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
export type Attribution = z.infer<typeof attributionSchema>;

export { EVENT_NAMES };
