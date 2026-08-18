import { db } from "../../db/client.ts";
import type { AdminSessionListQuery } from "../../../shared/api/admin-schemas.ts";

export async function listSessions(filters: AdminSessionListQuery) {
  let query = db
    .from("sessions")
    .select(
      "session_id, community, source_type, status, current_position, assigned_at",
      { count: "exact" },
    );

  if (filters.community) {
    query = query.eq("community", filters.community);
  }
  if (filters.source_type) {
    query = query.eq("source_type", filters.source_type);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error, count } = await query
    .order("assigned_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (error) {
    throw new Error(`Failed to list sessions: ${error.message}`);
  }

  return {
    sessions: data ?? [],
    total: count ?? 0,
  };
}
