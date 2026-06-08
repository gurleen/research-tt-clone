import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.ts";
import type { Database } from "../db/database.types.ts";
import { ApiError } from "../lib/http.ts";

export type AdminUser = {
  id: string;
  email?: string;
};

export async function verifyAdminRequest(req: Request): Promise<AdminUser> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or invalid authorization");
  }

  const token = header.slice("Bearer ".length);
  if (!token) {
    throw new ApiError(401, "Missing or invalid authorization");
  }

  if (!env.supabasePublishableKey) {
    throw new ApiError(
      503,
      "Admin auth is not configured (SUPABASE_PUBLISHABLE_KEY missing)",
    );
  }

  const authClient = createClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    throw new ApiError(401, "Invalid or expired session");
  }

  const role = data.user.app_metadata?.role;
  if (role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }

  return {
    id: data.user.id,
    email: data.user.email,
  };
}

export async function requireAdminAuth(req: Request): Promise<AdminUser> {
  return verifyAdminRequest(req);
}