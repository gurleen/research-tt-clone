import { describe, expect, test } from "bun:test";
import {
  adminConfigResponseSchema,
  experimentConfigFormSchema,
  platformSettingsFormSchema,
  presignUploadBodySchema,
  stubContentFormSchema,
  videoFormSchema,
} from "../shared/api/admin-schemas.ts";
import { resolveAdminAppearance } from "../admin/lib/appearance.ts";
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

  test("presignUploadBodySchema validates upload payload", () => {
    const parsed = presignUploadBodySchema.parse({
      video_id: "ingroup_sikh_micro_01",
      kind: "media",
      content_type: "video/webm",
      extension: "webm",
    });
    expect(parsed.kind).toBe("media");
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
      filler_count_min: 7,
      filler_count_max: 8,
      prompt_probability: 0.45,
      prompt_min_spacing: 1,
    });
    expect(parsed.success).toBe(true);
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
