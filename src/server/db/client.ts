import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.ts";
import type { Database } from "./database.types.ts";

export const db = createClient<Database>(env.supabaseUrl, env.supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
