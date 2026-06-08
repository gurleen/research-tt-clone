import { PLATFORM_SETTING_KEYS } from "../../../shared/api/admin-schemas.ts";
import { db } from "../../db/client.ts";
import { envFallbackSettings } from "../../config/env.ts";

export type PlatformSettings = {
  surveyUrl: string;
  debrief: {
    title: string;
    body: string;
    withdrawal: string;
    contact: string;
  };
};

function mapRowsToSettings(
  rows: Array<{ key: string; value: string }>,
): PlatformSettings {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const fallback = envFallbackSettings;

  return {
    surveyUrl: byKey.get("survey_url") ?? fallback.surveyUrl,
    debrief: {
      title: byKey.get("debrief_title") ?? fallback.debrief.title,
      body: byKey.get("debrief_body") ?? fallback.debrief.body,
      withdrawal:
        byKey.get("debrief_withdrawal") ?? fallback.debrief.withdrawal,
      contact: byKey.get("debrief_contact") ?? fallback.debrief.contact,
    },
  };
}

export async function loadPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await db
    .from("platform_settings")
    .select("key, value")
    .in("key", [...PLATFORM_SETTING_KEYS]);

  if (error) {
    throw new Error(`Failed to load platform settings: ${error.message}`);
  }

  return mapRowsToSettings(data ?? []);
}

export function buildSurveyUrl(sessionId: string, template: string): string {
  return template.replace("{session_id}", sessionId);
}
