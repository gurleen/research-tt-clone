import type {
  CreateSessionBody,
  DebriefResponse,
  EventBody,
  EventResponse,
  PatchPositionResponse,
  SessionResponse,
  StubResponse,
  SurveyCompleteBody,
} from "../shared/api/types.ts";
import { fetchJson } from "./http.ts";

export type PlatformApiClientOptions = {
  baseUrl?: string;
  exportApiKey?: string;
};

export class PlatformApiClient {
  private readonly baseUrl: string;
  private readonly exportApiKey?: string;

  constructor(options: PlatformApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");
    this.exportApiKey = options.exportApiKey;
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  createSession(body: CreateSessionBody): Promise<SessionResponse> {
    return fetchJson<SessionResponse>(this.url("/api/sessions"), {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getSession(sessionId: string): Promise<SessionResponse> {
    return fetchJson<SessionResponse>(this.url(`/api/sessions/${sessionId}`));
  }

  patchPosition(
    sessionId: string,
    position: number,
  ): Promise<PatchPositionResponse> {
    return fetchJson<PatchPositionResponse>(
      this.url(`/api/sessions/${sessionId}/position`),
      {
        method: "PATCH",
        body: JSON.stringify({ position }),
      },
    );
  }

  getStub(sessionId: string, videoId: string): Promise<StubResponse> {
    return fetchJson<StubResponse>(
      this.url(`/api/sessions/${sessionId}/videos/${videoId}/stub`),
    );
  }

  postEvent(body: EventBody): Promise<EventResponse> {
    return fetchJson<EventResponse>(this.url("/api/events"), {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  completeSurvey(
    sessionId: string,
    body: SurveyCompleteBody,
  ): Promise<{ route: "debrief"; url: string; duplicate?: boolean }> {
    return fetchJson(this.url(`/api/sessions/${sessionId}/survey-complete`), {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getDebrief(sessionId: string): Promise<DebriefResponse> {
    const url = new URL(this.url("/api/debrief"));
    url.searchParams.set("session_id", sessionId);
    return fetchJson<DebriefResponse>(url);
  }

  exportSession(
    sessionId: string,
    format: "json" | "csv" = "json",
  ): Promise<unknown | string> {
    const url = new URL(this.url("/api/export"));
    url.searchParams.set("session_id", sessionId);
    url.searchParams.set("format", format);

    if (format === "csv") {
      return fetch(url, {
        headers: this.exportHeaders(),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Export failed: ${response.status}`);
        }
        return response.text();
      });
    }

    return fetchJson(url, { headers: this.exportHeaders() });
  }

  private exportHeaders(): HeadersInit {
    if (!this.exportApiKey) {
      return {};
    }
    return { Authorization: `Bearer ${this.exportApiKey}` };
  }
}

export function createPlatformClient(
  options?: PlatformApiClientOptions,
): PlatformApiClient {
  return new PlatformApiClient(options);
}
