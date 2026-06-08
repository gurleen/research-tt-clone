import { z } from "zod";
import { COMMUNITIES, EVENT_NAMES, SOURCE_TYPES } from "./events.ts";

const uuid = z.uuid();
const isoTimestamp = z.iso.datetime({ offset: true });

export const communitySchema = z.enum(COMMUNITIES);
export const sourceTypeSchema = z.enum(SOURCE_TYPES);

export const attributionSchema = z.object({
  account_name: z.string(),
  account_handle: z.string(),
  profile_thumbnail_url: z.string(),
});

export const playlistItemSchema = z.object({
  position: z.number().int().nonnegative(),
  video_id: z.string(),
  video_type: z.enum(["ingroup", "filler"]),
  media_url: z.string(),
  duration_ms: z.number().int().nullable(),
  attribution: attributionSchema,
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

export const createSessionBodySchema = z.object({
  community: communitySchema,
  source_type: sourceTypeSchema.optional(),
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
  response: z.boolean(),
  timestamp_response: isoTimestamp,
  latency_ms: z.number().int().nonnegative(),
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
