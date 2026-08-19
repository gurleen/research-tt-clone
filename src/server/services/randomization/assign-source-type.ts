import { SOURCE_TYPES, type SourceType } from "../../../shared/api/events.ts";
import { db } from "../../db/client.ts";
import type { Community } from "../../db/tables.ts";
import { rethrowDbError } from "../../lib/db-error.ts";

export function emptySourceTypeCounts(): Record<SourceType, number> {
  return Object.fromEntries(SOURCE_TYPES.map((type) => [type, 0])) as Record<
    SourceType,
    number
  >;
}

export function pickLeastAssignedSourceType(
  counts: Record<SourceType, number>,
): SourceType {
  const min = Math.min(...SOURCE_TYPES.map((type) => counts[type]));
  const tied = SOURCE_TYPES.filter((type) => counts[type] === min);
  return tied[Math.floor(Math.random() * tied.length)]!;
}

export async function assignSourceType(
  community: Community,
  override?: SourceType,
): Promise<SourceType> {
  if (override) {
    return override;
  }

  const { data, error } = await db
    .from("sessions")
    .select("source_type")
    .eq("community", community);

  if (error) {
    rethrowDbError(error);
  }

  const counts = emptySourceTypeCounts();
  for (const row of data ?? []) {
    counts[row.source_type]++;
  }

  return pickLeastAssignedSourceType(counts);
}
