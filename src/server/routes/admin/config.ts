import { env } from "../../config/env.ts";
import { json, ApiError } from "../../lib/http.ts";

export function handleAdminConfig(): Response {
  if (!env.supabasePublishableKey) {
    throw new ApiError(
      503,
      "Admin is not configured (SUPABASE_PUBLISHABLE_KEY missing)",
    );
  }

  return json({
    supabase_url: env.supabaseUrl,
    supabase_publishable_key: env.supabasePublishableKey,
    staging_mode: env.stagingMode,
  });
}
