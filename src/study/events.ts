import { createPlatformClient } from "../client/platform-api.ts";
import type { PlatformApiClient } from "../client/platform-api.ts";
import type { EventBody } from "../shared/api/types.ts";

export function newEventId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export async function postEvent(
  client: PlatformApiClient,
  body: EventBody,
) {
  return client.postEvent(body);
}

export function postEventBeacon(body: EventBody): boolean {
  const payload = JSON.stringify(body);
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    return navigator.sendBeacon("/api/events", blob);
  }

  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  });

  return true;
}

export function createStudyClient(): PlatformApiClient {
  return createPlatformClient();
}
