import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router";
import { ApiError } from "../client/errors.ts";
import type { PlatformApiClient } from "../client/platform-api.ts";
import {
  SOURCE_TYPES,
  type Community,
  type CreateSessionBody,
  type SessionResponse,
  type SourceType,
} from "../shared/api/types.ts";
import type { StudyFeedVideo } from "../types/feed.ts";
import {
  STUDY_SESSION_STORAGE_KEY,
  clearStudyClientState,
} from "./client-state.ts";
import { createStudyClient } from "./events.ts";
import { mapPlaylist } from "./map-playlist-item.ts";

export type StudySessionState =
  | "loading"
  | "ready"
  | "error"
  | "complete";

type StudySessionContextValue = {
  state: StudySessionState;
  error: string | null;
  session: SessionResponse | null;
  client: PlatformApiClient;
  videos: StudyFeedVideo[];
  initialIndex: number;
  handoffUrl: string | null;
  markComplete: () => void;
  patchPosition: (position: number) => Promise<void>;
  completePlaylist: () => Promise<void>;
  restartSession: () => Promise<void>;
  allowRestart: boolean;
};

const StudySessionContext = createContext<StudySessionContextValue | null>(
  null,
);

function isCommunity(value: string | null): value is Community {
  return value === "armenian" || value === "sikh" || value === "iranian";
}

function isSourceType(value: string | null): value is SourceType {
  return SOURCE_TYPES.includes(value as SourceType);
}

function catalogErrorMessage(error: unknown, community?: string): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "This link has already been used.";
    }
    if (
      error.status === 503 ||
      error.message.toLowerCase().includes("not enough")
    ) {
      return community
        ? `Study cannot start: not enough videos in catalog for ${community}.`
        : "Study cannot start: not enough videos in catalog.";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Failed to start study session.";
}

export function StudySessionProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const client = useMemo(() => createStudyClient(), []);
  const [state, setState] = useState<StudySessionState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [handoffUrl, setHandoffUrl] = useState<string | null>(null);

  const urlCommunity = searchParams.get("community");
  const urlSessionId = searchParams.get("session_id");
  const urlSourceType = searchParams.get("source_type");
  const urlExternalId =
    searchParams.get("external_id") ?? searchParams.get("ResponseID");

  useEffect(() => {
    let cancelled = false;

    async function applySession(next: SessionResponse) {
      sessionStorage.setItem(STUDY_SESSION_STORAGE_KEY, next.session_id);
      setSession(next);
      setState(
        next.status === "playlist_complete" && !next.demo_mode
          ? "complete"
          : "ready",
      );
    }

    async function bootstrap() {
      setState("loading");
      setError(null);

      try {
        if (urlExternalId) {
          if (!isCommunity(urlCommunity)) {
            setError(
              "Missing community. Open the study link with ?community=armenian, sikh, or iranian.",
            );
            setState("error");
            return;
          }

          const body: CreateSessionBody = {
            community: urlCommunity,
            external_id: urlExternalId,
          };
          if (isSourceType(urlSourceType)) {
            body.source_type = urlSourceType;
          }

          const created = await client.createSession(body);
          if (cancelled) return;
          await applySession(created);
          return;
        }

        const storedSessionId = sessionStorage.getItem(STUDY_SESSION_STORAGE_KEY);
        const sessionId = urlSessionId ?? storedSessionId;

        if (sessionId) {
          const restored = await client.getSession(sessionId);
          if (cancelled) return;
          await applySession(restored);
          return;
        }

        if (!isCommunity(urlCommunity)) {
          setError(
            "Missing community. Open the study link with ?community=armenian, sikh, or iranian.",
          );
          setState("error");
          return;
        }

        const body: CreateSessionBody = {
          community: urlCommunity,
        };
        if (isSourceType(urlSourceType)) {
          body.source_type = urlSourceType;
        }

        const created = await client.createSession(body);
        if (cancelled) return;
        await applySession(created);
      } catch (err) {
        if (cancelled) return;
        setError(catalogErrorMessage(err, urlCommunity ?? undefined));
        setState("error");
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [client, urlCommunity, urlExternalId, urlSessionId, urlSourceType]);

  const videos = useMemo(
    () => (session ? mapPlaylist(session.playlist) : []),
    [session],
  );

  const initialIndex = session?.current_position ?? 0;
  const highWaterRef = useRef(initialIndex);
  if (session && session.current_position > highWaterRef.current) {
    highWaterRef.current = session.current_position;
  }

  const markComplete = useCallback(() => {
    setState("complete");
  }, []);

  const patchPosition = useCallback(
    async (position: number) => {
      if (!session) return;
      // Resume pointer is monotonic; rewind is client-only and must not PATCH lower.
      if (position <= highWaterRef.current) return;
      highWaterRef.current = position;
      const result = await client.patchPosition(session.session_id, position);
      setSession((current) =>
        current
          ? { ...current, current_position: result.current_position }
          : current,
      );
    },
    [client, session],
  );

  const completePlaylist = useCallback(async () => {
    if (!session) return;
    const result = await client.postEvent({
      event_id: crypto.randomUUID(),
      session_id: session.session_id,
      event: "playlist_complete",
      timestamp: new Date().toISOString(),
    });
    if ("url" in result && result.url) {
      setHandoffUrl(result.url);
    }
    setSession((current) =>
      current ? { ...current, status: "playlist_complete" } : current,
    );
    setState("complete");
  }, [client, session]);

  const restartSession = useCallback(async () => {
    const previousId = session?.session_id;
    clearStudyClientState(previousId);
    highWaterRef.current = 0;
    setHandoffUrl(null);

    if (session?.demo_mode) {
      window.location.reload();
      return;
    }

    const community =
      session?.community ??
      (isCommunity(urlCommunity) ? urlCommunity : null);
    if (!community) {
      setError(
        "Missing community. Open the study link with ?community=armenian, sikh, or iranian.",
      );
      setState("error");
      return;
    }

    setState("loading");
    try {
      const body: CreateSessionBody = { community };
      if (isSourceType(urlSourceType)) {
        body.source_type = urlSourceType;
      }
      if (session?.demo_mode) {
        body.demo_mode = true;
      }
      const created = await client.createSession(body);
      const params = new URLSearchParams(window.location.search);
      params.set("session_id", created.session_id);
      params.set("community", created.community);
      window.location.assign(
        `${window.location.pathname}?${params.toString()}`,
      );
    } catch (err) {
      setError(catalogErrorMessage(err, community));
      setState("error");
    }
  }, [client, session, urlCommunity, urlSourceType]);

  const value = useMemo<StudySessionContextValue>(
    () => ({
      state,
      error,
      session,
      client,
      videos,
      initialIndex,
      handoffUrl,
      markComplete,
      patchPosition,
      completePlaylist,
      restartSession,
      allowRestart: !urlExternalId,
    }),
    [
      state,
      error,
      session,
      client,
      videos,
      initialIndex,
      handoffUrl,
      markComplete,
      patchPosition,
      completePlaylist,
      restartSession,
      urlExternalId,
    ],
  );

  return (
    <StudySessionContext.Provider value={value}>
      {children}
    </StudySessionContext.Provider>
  );
}

export function useStudySession(): StudySessionContextValue {
  const context = useContext(StudySessionContext);
  if (!context) {
    throw new Error("useStudySession must be used within StudySessionProvider");
  }
  return context;
}

export function useStudyPlaylist(): StudyFeedVideo[] {
  return useStudySession().videos;
}
