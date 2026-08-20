import { describe, expect, test } from "bun:test";
import {
  adminConfigResponseSchema,
  adminSessionListQuerySchema,
  adminSessionListResponseSchema,
  adminSessionSummarySchema,
  deactivateVideoResponseSchema,
  experimentConfigFormSchema,
  platformSettingsFormSchema,
  interestPromptTimingFormSchema,
  presignUploadBodySchema,
  reactivateVideoResponseSchema,
  stubContentFormSchema,
  videoFormSchema,
} from "../shared/api/admin-schemas.ts";
import { resolveAdminAppearance } from "../admin/lib/appearance.ts";
import { formatDurationMs } from "../admin/lib/format.ts";
import { isAdminAppMetadata } from "../shared/auth/admin.ts";

describe("admin auth helper", () => {
  test("isAdminAppMetadata accepts admin role", () => {
    expect(isAdminAppMetadata({ role: "admin" })).toBe(true);
  });

  test("isAdminAppMetadata rejects missing or other roles", () => {
    expect(isAdminAppMetadata({ role: "researcher" })).toBe(false);
    expect(isAdminAppMetadata(undefined)).toBe(false);
  });
});

describe("admin schemas", () => {
  test("adminConfigResponseSchema parses staging_mode", () => {
    const parsed = adminConfigResponseSchema.parse({
      supabase_url: "https://example.supabase.co",
      supabase_publishable_key: "publishable-key",
      staging_mode: true,
    });
    expect(parsed.staging_mode).toBe(true);
  });

  test("adminSessionSummarySchema parses session summary payload", () => {
    const parsed = adminSessionSummarySchema.parse({
      session: {
        session_id: "550e8400-e29b-41d4-a716-446655440000",
        community: "sikh",
        source_type: "micro_influencer",
        status: "in_progress",
        current_position: 0,
        assigned_at: "2026-06-08T12:00:00.000Z",
      },
      playlist_length: 10,
      playlist: [
        {
          position: 0,
          video_id: "ingroup_sikh_micro_01",
          video_type: "ingroup",
          account_name: "Creator",
          account_handle: "@creator",
          show_learn_more: true,
          show_interest_prompt: false,
        },
      ],
      event_counts: {
        evt_session_start: 1,
        evt_content_link_display: 0,
        evt_content_link_click: 0,
        evt_content_stub_exit: 0,
        evt_interest_prompt_display: 0,
        evt_interest_response: 0,
        evt_video_view: 0,
        evt_like: 0,
        evt_comments_open: 0,
        evt_playlist_complete: 0,
        evt_survey_complete: 0,
      },
      events: {
        evt_session_start: [
          {
            event_id: "550e8400-e29b-41d4-a716-446655440001",
            session_id: "550e8400-e29b-41d4-a716-446655440000",
          },
        ],
        evt_content_link_display: [],
        evt_content_link_click: [],
        evt_content_stub_exit: [],
        evt_interest_prompt_display: [],
        evt_interest_response: [],
        evt_video_view: [],
        evt_like: [],
        evt_comments_open: [],
        evt_playlist_complete: [],
        evt_survey_complete: [],
      },
    });
    expect(parsed.playlist_length).toBe(10);
    expect(parsed.playlist[0]?.video_id).toBe("ingroup_sikh_micro_01");
  });

  test("adminSessionListResponseSchema parses session list payload", () => {
    const parsed = adminSessionListResponseSchema.parse({
      sessions: [
        {
          session_id: "550e8400-e29b-41d4-a716-446655440000",
          community: "sikh",
          source_type: "micro_influencer",
          status: "in_progress",
          current_position: 3,
          assigned_at: "2026-06-08T12:00:00.000Z",
        },
      ],
      total: 1,
    });
    expect(parsed.total).toBe(1);
    expect(parsed.sessions[0]?.community).toBe("sikh");
  });

  test("adminSessionListQuerySchema defaults limit and offset", () => {
    const parsed = adminSessionListQuerySchema.parse({});
    expect(parsed.limit).toBe(50);
    expect(parsed.offset).toBe(0);
  });

  test("adminSessionListResponseSchema parses session list payload", () => {
    const parsed = adminSessionListResponseSchema.parse({
      sessions: [
        {
          session_id: "550e8400-e29b-41d4-a716-446655440000",
          community: "sikh",
          source_type: "micro_influencer",
          status: "in_progress",
          current_position: 3,
          assigned_at: "2026-06-08T12:00:00.000Z",
        },
      ],
      total: 1,
    });
    expect(parsed.total).toBe(1);
    expect(parsed.sessions[0]?.community).toBe("sikh");
  });

  test("adminSessionListQuerySchema defaults limit and offset", () => {
    const parsed = adminSessionListQuerySchema.parse({});
    expect(parsed.limit).toBe(50);
    expect(parsed.offset).toBe(0);
  });

  test("presignUploadBodySchema validates upload payload", () => {
    const parsed = presignUploadBodySchema.parse({
      video_id: "ingroup_sikh_micro_01",
      kind: "media",
      content_type: "video/webm",
      extension: "webm",
    });
    expect(parsed.kind).toBe("media");
  });

  test("deactivateVideoResponseSchema parses deactivate payload", () => {
    const parsed = deactivateVideoResponseSchema.parse({
      video_id: "ingroup_sikh_micro_01",
      active: false,
      r2_deleted: true,
      objects_removed: 2,
    });
    expect(parsed.objects_removed).toBe(2);
  });

  test("reactivateVideoResponseSchema parses reactivate payload", () => {
    const parsed = reactivateVideoResponseSchema.parse({
      video_id: "ingroup_sikh_micro_01",
      active: true,
    });
    expect(parsed.active).toBe(true);
  });

  test("parseCorsOrigins defaults to localhost dev origin", async () => {
    const { parseCorsOrigins } = await import(
      "../server/services/r2/configure-cors.ts"
    );
    expect(parseCorsOrigins(undefined)).toEqual(["http://localhost:3000"]);
    expect(parseCorsOrigins("https://app.example.com, http://localhost:3000")).toEqual([
      "https://app.example.com",
      "http://localhost:3000",
    ]);
  });

  test("validatePublicBaseUrl rejects private R2 API hostnames", async () => {
    const { validatePublicBaseUrl } = await import(
      "../server/services/r2/public-url.ts"
    );
    expect(() =>
      validatePublicBaseUrl(
        "https://my-bucket.account.r2.cloudflarestorage.com",
      ),
    ).toThrow(/r2\.cloudflarestorage\.com/);
    expect(() => validatePublicBaseUrl("https://pub-abc123.r2.dev")).not.toThrow();
  });

  test("videoFormSchema requires condition fields for ingroup", () => {
    const parsed = videoFormSchema.safeParse({
      video_id: "ingroup_sikh_micro_01",
      video_type: "ingroup",
      community: null,
      source_type: null,
      media_url: "https://example.com/a.webm",
      profile_thumbnail_url: "https://example.com/t.jpg",
      account_name: "Creator",
      account_handle: "@creator",
    });
    expect(parsed.success).toBe(false);
  });

  test("videoFormSchema accepts filler without condition fields", () => {
    const parsed = videoFormSchema.safeParse({
      video_id: "filler_01",
      video_type: "filler",
      community: null,
      source_type: null,
      media_url: "https://example.com/a.webm",
      profile_thumbnail_url: "https://example.com/t.jpg",
      account_name: "Creator",
      account_handle: "@creator",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.caption).toBe("");
      expect(parsed.data.like_count).toBe(0);
      expect(parsed.data.comments).toEqual([]);
    }
  });

  test("videoFormSchema accepts control without condition fields", () => {
    const parsed = videoFormSchema.safeParse({
      video_id: "control_01",
      video_type: "control",
      community: null,
      source_type: null,
      media_url: "https://example.com/a.webm",
      profile_thumbnail_url: "https://example.com/t.jpg",
      account_name: "Creator",
      account_handle: "@creator",
    });
    expect(parsed.success).toBe(true);
  });

  test("videoFormSchema rejects control with a community", () => {
    const parsed = videoFormSchema.safeParse({
      video_id: "control_01",
      video_type: "control",
      community: "sikh",
      source_type: null,
      media_url: "https://example.com/a.webm",
      profile_thumbnail_url: "https://example.com/t.jpg",
      account_name: "Creator",
      account_handle: "@creator",
    });
    expect(parsed.success).toBe(false);
  });

  test("videoFormSchema accepts caption, counts, and comments", () => {
    const parsed = videoFormSchema.parse({
      video_id: "filler_01",
      video_type: "filler",
      community: null,
      source_type: null,
      media_url: "https://example.com/a.webm",
      profile_thumbnail_url: "https://example.com/t.jpg",
      account_name: "Creator",
      account_handle: "@creator",
      caption: "Hello from the overlay",
      like_count: 1200,
      comment_count: 45,
      follower_count: 8800,
      share_count: 12,
      save_count: 4,
      comments: [
        { username: "fan", text: "nice clip", timestamp: "2d ago" },
        { username: "other", text: "looping this" },
      ],
    });
    expect(parsed.caption).toBe("Hello from the overlay");
    expect(parsed.follower_count).toBe(8800);
    expect(parsed.comments).toHaveLength(2);
    expect(parsed.comments[1]).toEqual({
      username: "other",
      text: "looping this",
    });
  });

  test("videoFormSchema rejects incomplete comments", () => {
    const parsed = videoFormSchema.safeParse({
      video_id: "filler_01",
      video_type: "filler",
      community: null,
      source_type: null,
      media_url: "https://example.com/a.webm",
      profile_thumbnail_url: "https://example.com/t.jpg",
      account_name: "Creator",
      account_handle: "@creator",
      comments: [{ username: "fan", text: "" }],
    });
    expect(parsed.success).toBe(false);
  });

  test("stubContentFormSchema converts empty body to null", () => {
    const parsed = stubContentFormSchema.parse({
      community: "sikh",
      body: "  ",
    });
    expect(parsed.body).toBeNull();
  });

  test("experimentConfigFormSchema rejects min greater than max", () => {
    const parsed = experimentConfigFormSchema.safeParse({
      community: "sikh",
      ingroup_count_min: 5,
      ingroup_count_max: 3,
      filler_count_min: 7,
      filler_count_max: 8,
      prompt_probability: 0.45,
      prompt_min_spacing: 1,
    });
    expect(parsed.success).toBe(false);
  });

  test("experimentConfigFormSchema accepts valid config", () => {
    const parsed = experimentConfigFormSchema.safeParse({
      community: "armenian",
      ingroup_count_min: 3,
      ingroup_count_max: 4,
      filler_count_min: 9,
      filler_count_max: 10,
      prompt_probability: 0.45,
      prompt_min_spacing: 1,
    });
    expect(parsed.success).toBe(true);
  });

  test("experimentConfigFormSchema rejects filler max that cannot space ingroup", () => {
    const parsed = experimentConfigFormSchema.safeParse({
      community: "sikh",
      ingroup_count_min: 5,
      ingroup_count_max: 5,
      filler_count_min: 3,
      filler_count_max: 3,
      prompt_probability: 0.45,
      prompt_min_spacing: 1,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(
        /Need at least 11 filler videos/,
      );
    }
  });

  test("platformSettingsFormSchema requires session_id placeholder", () => {
    const parsed = platformSettingsFormSchema.safeParse({
      survey_url: "https://survey.example.com",
      debrief_title: "Study Debrief",
      debrief_body: "Thank you.",
      debrief_withdrawal: "Contact us to withdraw.",
      debrief_contact: "research@example.com",
    });
    expect(parsed.success).toBe(false);
  });

  test("platformSettingsFormSchema rejects empty debrief fields", () => {
    const parsed = platformSettingsFormSchema.safeParse({
      survey_url: "https://survey.example.com?session_id={session_id}",
      debrief_title: " ",
      debrief_body: "Thank you.",
      debrief_withdrawal: "Contact us to withdraw.",
      debrief_contact: "research@example.com",
    });
    expect(parsed.success).toBe(false);
  });

  test("platformSettingsFormSchema accepts valid settings", () => {
    const parsed = platformSettingsFormSchema.safeParse({
      survey_url: "https://survey.example.com?session_id={session_id}",
      debrief_title: "Study Debrief",
      debrief_body: "Thank you for participating.",
      debrief_withdrawal: "Contact us to withdraw your data.",
      debrief_contact: "research@example.com",
    });
    expect(parsed.success).toBe(true);
  });

  test("interestPromptTimingFormSchema accepts 0-100 percent", () => {
    expect(
      interestPromptTimingFormSchema.parse({
        interest_prompt_reveal_percent: 30,
      }).interest_prompt_reveal_percent,
    ).toBe(30);
    expect(
      interestPromptTimingFormSchema.safeParse({
        interest_prompt_reveal_percent: -1,
      }).success,
    ).toBe(false);
    expect(
      interestPromptTimingFormSchema.safeParse({
        interest_prompt_reveal_percent: 101,
      }).success,
    ).toBe(false);
  });
});

describe("admin appearance", () => {
  test("resolveAdminAppearance respects explicit light and dark", () => {
    expect(resolveAdminAppearance("light", true)).toBe(false);
    expect(resolveAdminAppearance("dark", false)).toBe(true);
  });

  test("resolveAdminAppearance follows system preference in auto mode", () => {
    expect(resolveAdminAppearance("auto", true)).toBe(true);
    expect(resolveAdminAppearance("auto", false)).toBe(false);
  });
});

describe("admin formatters", () => {
  test("formatDurationMs uses milliseconds under one second", () => {
    expect(formatDurationMs(250)).toBe("250ms");
  });

  test("formatDurationMs uses seconds with one decimal under ten seconds", () => {
    expect(formatDurationMs(1200)).toBe("1.2s");
  });
});
