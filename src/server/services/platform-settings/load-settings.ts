import { PLATFORM_SETTING_KEYS } from "../../../shared/api/admin-schemas.ts";
import { parseInterestPromptRevealFraction } from "../../../shared/experiment/interest-prompt-timing.ts";
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
  interestPromptRevealFraction: number;
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
    interestPromptRevealFraction: parseInterestPromptRevealFraction(
      byKey.get("interest_prompt_reveal_fraction") ??
        String(fallback.interestPromptRevealFraction),
    ),
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

export type SurveyUrlFields = {
  externalId?: string | null;
  status?: string;
};

export function buildSurveyUrl(
  sessionId: string,
  template: string,
  fields: SurveyUrlFields = {},
): string {
  const externalId = fields.externalId ?? "";
  const status = fields.status ?? "";

  let url = template
    .replaceAll("{session_id}", sessionId)
    .replaceAll("{external_id}", externalId)
    .replaceAll("{status}", status);

  const shouldAppendExternalId =
    Boolean(fields.externalId) && !template.includes("{external_id}");
  const shouldAppendStatus =
    Boolean(fields.status) && !template.includes("{status}");

  if (!shouldAppendExternalId && !shouldAppendStatus) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (shouldAppendExternalId && fields.externalId) {
      parsed.searchParams.set("external_id", fields.externalId);
    }
    if (shouldAppendStatus && fields.status) {
      parsed.searchParams.set("status", fields.status);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
