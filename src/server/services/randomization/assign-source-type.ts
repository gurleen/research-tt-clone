import { db } from "../../db/client.ts";
import type { Community, SourceType } from "../../db/tables.ts";
import { rethrowDbError } from "../../lib/db-error.ts";

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

  const counts: Record<SourceType, number> = {
    micro_influencer: 0,
    institutional: 0,
  };

  for (const row of data ?? []) {
    counts[row.source_type]++;
  }

  if (counts.micro_influencer < counts.institutional) {
    return "micro_influencer";
  }
  if (counts.institutional < counts.micro_influencer) {
    return "institutional";
  }

  return Math.random() < 0.5 ? "micro_influencer" : "institutional";
}
