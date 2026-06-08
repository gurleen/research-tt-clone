import { db } from "../../db/client.ts";
import type { EventTableName } from "../../db/tables.ts";

export type IdempotentInsertResult = {
  duplicate: boolean;
};

export async function idempotentInsert(
  table: EventTableName | "evt_session_start",
  row: Record<string, unknown>,
): Promise<IdempotentInsertResult> {
  const { data: existing, error: lookupError } = await db
    .from(table)
    .select("event_id")
    .eq("event_id", row.event_id as string)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to check existing event: ${lookupError.message}`);
  }
  if (existing) {
    return { duplicate: true };
  }

  const { error } = await db.from(table).insert(row as never);
  if (error) {
    if (error.code === "23505") {
      return { duplicate: true };
    }
    throw new Error(`Failed to insert event: ${error.message}`);
  }

  return { duplicate: false };
}

export async function updateSessionStatus(
  sessionId: string,
  status: string,
): Promise<void> {
  const { error } = await db
    .from("sessions")
    .update({ status })
    .eq("session_id", sessionId);

  if (error) {
    throw new Error(`Failed to update session status: ${error.message}`);
  }
}
