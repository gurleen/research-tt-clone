import { z } from "zod";
import { catalogCommentSchema } from "./schemas.ts";

export const presignUploadBodySchema = z.object({
  video_id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_-]+$/i, "Use letters, numbers, underscores, hyphens"),
  kind: z.enum(["media", "thumbnail"]),
  content_type: z.string().min(1),
  extension: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+$/i, "Extension must be alphanumeric"),
});

export const presignUploadResponseSchema = z.object({
  upload_url: z.string(),
  public_url: z.string(),
  key: z.string(),
});

export const adminConfigResponseSchema = z.object({
  supabase_url: z.string(),
  supabase_publishable_key: z.string(),
  staging_mode: z.boolean(),
});

export type PresignUploadBody = z.infer<typeof presignUploadBodySchema>;
export type PresignUploadResponse = z.infer<typeof presignUploadResponseSchema>;
export type AdminConfigResponse = z.infer<typeof adminConfigResponseSchema>;

export const videoFormSchema = z
  .object({
    video_id: z.string().min(1),
    video_type: z.enum(["ingroup", "filler"]),
    community: z.enum(["armenian", "sikh", "iranian"]).nullable(),
    source_type: z.enum(["micro_influencer", "institutional"]).nullable(),
    media_url: z.string().url(),
    profile_thumbnail_url: z.string().url(),
    account_name: z.string().min(1),
    account_handle: z.string().min(1),
    duration_ms: z.number().int().positive().nullable().optional(),
    central_issue: z.string().nullable().optional(),
    caption: z.string().default(""),
    like_count: z.number().int().nonnegative().default(0),
    comment_count: z.number().int().nonnegative().default(0),
    follower_count: z.number().int().nonnegative().default(0),
    share_count: z.number().int().nonnegative().default(0),
    save_count: z.number().int().nonnegative().default(0),
    comments: z.array(catalogCommentSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.video_type === "ingroup") {
      if (!value.community) {
        ctx.addIssue({
          code: "custom",
          message: "Community is required for ingroup videos",
          path: ["community"],
        });
      }
      if (!value.source_type) {
        ctx.addIssue({
          code: "custom",
          message: "Source type is required for ingroup videos",
          path: ["source_type"],
        });
      }
    }

    if (value.video_type === "filler") {
      if (value.community !== null) {
        ctx.addIssue({
          code: "custom",
          message: "Filler videos must not have a community",
          path: ["community"],
        });
      }
      if (value.source_type !== null) {
        ctx.addIssue({
          code: "custom",
          message: "Filler videos must not have a source type",
          path: ["source_type"],
        });
      }
    }
  });

export type VideoFormValues = z.infer<typeof videoFormSchema>;

export const communitySchema = z.enum(["armenian", "sikh", "iranian"]);

export const stubContentFormSchema = z.object({
  community: communitySchema,
  body: z
    .string()
    .transform((value) => (value.trim() === "" ? null : value))
    .nullable(),
});

export const experimentConfigFormSchema = z
  .object({
    community: communitySchema,
    ingroup_count_min: z.number().int().min(0),
    ingroup_count_max: z.number().int().min(0),
    filler_count_min: z.number().int().min(0),
    filler_count_max: z.number().int().min(0),
    prompt_probability: z.number().min(0).max(1),
    prompt_min_spacing: z.number().int().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.ingroup_count_min > value.ingroup_count_max) {
      ctx.addIssue({
        code: "custom",
        message: "Ingroup min cannot exceed max",
        path: ["ingroup_count_max"],
      });
    }
    if (value.filler_count_min > value.filler_count_max) {
      ctx.addIssue({
        code: "custom",
        message: "Filler min cannot exceed max",
        path: ["filler_count_max"],
      });
    }
  });

export type StubContentFormValues = z.infer<typeof stubContentFormSchema>;
export type ExperimentConfigFormValues = z.infer<
  typeof experimentConfigFormSchema
>;

export const PLATFORM_SETTING_KEYS = [
  "survey_url",
  "debrief_title",
  "debrief_body",
  "debrief_withdrawal",
  "debrief_contact",
] as const;

export type PlatformSettingKey = (typeof PLATFORM_SETTING_KEYS)[number];

const nonEmptyTrimmedString = z
  .string()
  .trim()
  .min(1, "This field is required");

export const platformSettingsFormSchema = z.object({
  survey_url: nonEmptyTrimmedString.refine(
    (value) => value.includes("{session_id}"),
    "Survey URL must include the {session_id} placeholder",
  ),
  debrief_title: nonEmptyTrimmedString,
  debrief_body: nonEmptyTrimmedString,
  debrief_withdrawal: nonEmptyTrimmedString,
  debrief_contact: nonEmptyTrimmedString,
});

export type PlatformSettingsFormValues = z.infer<
  typeof platformSettingsFormSchema
>;

const sessionEventTableSchema = z.enum([
  "evt_session_start",
  "evt_content_link_display",
  "evt_content_link_click",
  "evt_content_stub_exit",
  "evt_interest_prompt_display",
  "evt_interest_response",
  "evt_video_view",
  "evt_like",
  "evt_comments_open",
  "evt_playlist_complete",
  "evt_survey_complete",
]);

export const SESSION_STATUSES = [
  "in_progress",
  "playlist_complete",
  "survey_complete",
  "debriefed",
] as const;

export const sessionStatusSchema = z.enum(SESSION_STATUSES);

export const adminSessionListItemSchema = z.object({
  session_id: z.string().uuid(),
  community: communitySchema,
  source_type: z.enum(["micro_influencer", "institutional"]),
  status: z.string(),
  current_position: z.number().int().nonnegative(),
  assigned_at: z.string(),
});

export const adminSessionListQuerySchema = z.object({
  community: communitySchema.optional(),
  source_type: z.enum(["micro_influencer", "institutional"]).optional(),
  status: sessionStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const adminSessionListResponseSchema = z.object({
  sessions: z.array(adminSessionListItemSchema),
  total: z.number().int().nonnegative(),
});

export const adminSessionPlaylistItemSchema = z.object({
  position: z.number().int().nonnegative(),
  video_id: z.string(),
  video_type: z.enum(["ingroup", "filler"]),
  account_name: z.string(),
  account_handle: z.string(),
  show_learn_more: z.boolean(),
  show_interest_prompt: z.boolean(),
});

export const adminSessionSummarySchema = z.object({
  session: adminSessionListItemSchema,
  playlist_length: z.number().int().nonnegative(),
  playlist: z.array(adminSessionPlaylistItemSchema),
  event_counts: z.record(sessionEventTableSchema, z.number().int().nonnegative()),
  events: z.record(sessionEventTableSchema, z.array(z.record(z.string(), z.unknown()))),
});

export type AdminSessionListItem = z.infer<typeof adminSessionListItemSchema>;
export type AdminSessionListQuery = z.infer<typeof adminSessionListQuerySchema>;
export type AdminSessionListResponse = z.infer<
  typeof adminSessionListResponseSchema
>;
export type AdminSessionPlaylistItem = z.infer<
  typeof adminSessionPlaylistItemSchema
>;
export type AdminSessionSummary = z.infer<typeof adminSessionSummarySchema>;

export const deactivateVideoResponseSchema = z.object({
  video_id: z.string(),
  active: z.literal(false),
  r2_deleted: z.boolean(),
  objects_removed: z.number().int().nonnegative(),
});

export const reactivateVideoResponseSchema = z.object({
  video_id: z.string(),
  active: z.literal(true),
});

export type DeactivateVideoResponse = z.infer<typeof deactivateVideoResponseSchema>;
export type ReactivateVideoResponse = z.infer<typeof reactivateVideoResponseSchema>;
