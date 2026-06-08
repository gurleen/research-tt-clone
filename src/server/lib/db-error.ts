import { ApiError } from "../lib/http.ts";

export function rethrowDbError(error: { message: string; code?: string }): never {
  if (
    error.message.includes("permission denied") ||
    error.code === "42501"
  ) {
    throw new ApiError(
      503,
      "Database permission denied — ensure SUPABASE_SECRET_KEY is the server secret key and tables are granted to service_role",
    );
  }

  throw new Error(error.message);
}
