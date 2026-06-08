/**
 * Browser Supabase client for admin CRUD (RLS + is_admin()).
 * Use the Bun API only when secrets are required (R2 presign, future server-side jobs).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../server/db/database.types.ts";
import type { AdminConfigResponse } from "../../shared/api/admin-types.ts";
import { adminConfigResponseSchema } from "../../shared/api/admin-schemas.ts";

let configPromise: Promise<AdminConfigResponse> | null = null;
let browserClient: SupabaseClient<Database> | null = null;

async function fetchAdminConfig(): Promise<AdminConfigResponse> {
  const response = await fetch("/api/admin/config");
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to load admin config");
  }
  return adminConfigResponseSchema.parse(body);
}

export async function getAdminConfig(): Promise<AdminConfigResponse> {
  if (!configPromise) {
    configPromise = fetchAdminConfig();
  }
  return configPromise;
}

export async function getSupabaseBrowserClient(): Promise<
  SupabaseClient<Database>
> {
  if (browserClient) {
    return browserClient;
  }

  const config = await getAdminConfig();
  browserClient = createClient<Database>(
    config.supabase_url,
    config.supabase_publishable_key,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );

  return browserClient;
}

export function resetSupabaseBrowserClient(): void {
  browserClient = null;
  configPromise = null;
}
