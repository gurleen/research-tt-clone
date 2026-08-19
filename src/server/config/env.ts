function requiredOne(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }
  throw new Error(
    `Missing required environment variable: one of ${names.join(", ")}`,
  );
}

/** Strip path suffixes like /rest/v1/ so createClient gets the project origin. */
export function normalizeSupabaseUrl(raw: string): string {
  const withProtocol = raw.includes("://") ? raw : `https://${raw}`;
  const { protocol, hostname } = new URL(withProtocol);
  return `${protocol}//${hostname}`;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  supabaseUrl: normalizeSupabaseUrl(requiredOne("SUPABASE_URL")),
  supabaseSecretKey: requiredOne(
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ),
  supabasePublishableKey:
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    "",
  r2: {
    accountId: optional("R2_ACCOUNT_ID", ""),
    accessKeyId: optional("R2_ACCESS_KEY_ID", ""),
    secretAccessKey: optional("R2_SECRET_ACCESS_KEY", ""),
    bucketName: optional("R2_BUCKET_NAME", ""),
    publicBaseUrl: optional("R2_PUBLIC_BASE_URL", "").replace(/\/$/, ""),
  },
  stagingMode: process.env.STAGING_MODE === "true",
  exportApiKey: optional("EXPORT_API_KEY", ""),
} as const;

/** Fallback when platform_settings rows are missing (pre-migration / partial seed). */
export const envFallbackSettings = {
  surveyUrl: optional(
    "SURVEY_URL",
    "https://survey.example.com?session_id={session_id}",
  ),
  debrief: {
    title: optional("DEBRIEF_TITLE", "Study Debrief"),
    body: optional(
      "DEBRIEF_BODY",
      "Thank you for participating. Your responses did not alter the content shown.",
    ),
    withdrawal: optional(
      "DEBRIEF_WITHDRAWAL",
      "To withdraw your data, contact the research team.",
    ),
    contact: optional("DEBRIEF_CONTACT", "research@example.com"),
  },
  interestPromptRevealFraction: 0.3,
} as const;

export function buildDebriefUrl(sessionId: string, origin: string): string {
  const url = new URL("/api/debrief", origin);
  url.searchParams.set("session_id", sessionId);
  return url.toString();
}

export function isR2Configured(): boolean {
  const { accountId, accessKeyId, secretAccessKey, bucketName, publicBaseUrl } =
    env.r2;
  return Boolean(
    accountId &&
      accessKeyId &&
      secretAccessKey &&
      bucketName &&
      publicBaseUrl,
  );
}
