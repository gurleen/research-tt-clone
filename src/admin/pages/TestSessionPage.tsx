import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { createPlatformClient } from "../../client/platform-api.ts";
import { ApiError } from "../../client/errors.ts";
import {
  SOURCE_TYPES,
  type Community,
  type SessionResponse,
  type SourceType,
} from "../../shared/api/types.ts";
import { getAdminConfig } from "../lib/supabase-browser.ts";
import { Alert } from "../../components/ui/alert.tsx";
import { Button } from "../../components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.tsx";
import { Label } from "../../components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.tsx";
import { cn } from "../../lib/utils.ts";

const COMMUNITIES: Community[] = ["armenian", "sikh", "iranian"];

function buildFeedPath(
  session: SessionResponse,
  stagingMode: boolean,
  sourceType: SourceType,
): string {
  const params = new URLSearchParams({
    session_id: session.session_id,
    community: session.community,
  });
  if (stagingMode) {
    params.set("source_type", sourceType);
  }
  return `/?${params.toString()}`;
}

export function TestSessionPage() {
  const [community, setCommunity] = useState<Community>("sikh");
  const [sourceType, setSourceType] = useState<SourceType>("micro_influencer");
  const [demoMode, setDemoMode] = useState(false);
  const [stagingMode, setStagingMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSession, setCreatedSession] = useState<SessionResponse | null>(
    null,
  );
  const [feedPath, setFeedPath] = useState<string | null>(null);

  useEffect(() => {
    getAdminConfig()
      .then((config) => setStagingMode(config.staging_mode))
      .catch(() => setStagingMode(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCreatedSession(null);
    setFeedPath(null);
    setSubmitting(true);

    const client = createPlatformClient();

    try {
      const session = await client.createSession({
        community,
        demo_mode: demoMode,
        ...(stagingMode ? { source_type: sourceType } : {}),
      });
      setCreatedSession(session);

      const path = buildFeedPath(session, stagingMode, sourceType);
      setFeedPath(path);
      window.open(path, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create test session",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Test session</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Create a participant session and open the feed in a new tab. Use
          session stats to inspect captured events afterward.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Launch walkthrough</CardTitle>
          <CardDescription>
            {stagingMode
              ? "Staging mode is on — you can force a source type arm."
              : "Production mode — source type is randomized by the server."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}

            <div className="space-y-2">
              <Label htmlFor="test-community">Community</Label>
              <Select
                value={community}
                onValueChange={(value) => setCommunity(value as Community)}
              >
                <SelectTrigger id="test-community">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMUNITIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {stagingMode && (
              <div className="space-y-2">
                <Label htmlFor="test-source-type">Source type override</Label>
                <Select
                  value={sourceType}
                  onValueChange={(value) =>
                    setSourceType(value as SourceType)
                  }
                >
                  <SelectTrigger id="test-source-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-start justify-between gap-4 rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <div className="space-y-1">
                <Label htmlFor="test-demo-mode">Demo mode</Label>
                <p className="text-sm font-normal text-zinc-600">
                  Keep this session link reusable after the playlist finishes,
                  so you can present the app more than once.
                </p>
              </div>
              <button
                id="test-demo-mode"
                type="button"
                role="switch"
                aria-checked={demoMode}
                onClick={() => setDemoMode((value) => !value)}
                className={cn(
                  "relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
                  demoMode ? "bg-zinc-900" : "bg-zinc-300",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                    demoMode ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create and open feed"}
            </Button>
          </form>

          {createdSession && (
            <div className="mt-4 space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm">
              <p>
                Session{" "}
                <code className="rounded bg-zinc-100 px-1">
                  {createdSession.session_id}
                </code>{" "}
                created with {createdSession.playlist.length} videos
                {createdSession.demo_mode ? " in demo mode" : ""}.
              </p>
              {feedPath && (
                <p className="break-all text-zinc-700">
                  Feed link:{" "}
                  <a
                    href={feedPath}
                    className="font-medium text-zinc-900 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {feedPath}
                  </a>
                </p>
              )}
              <Link
                to={`/admin/sessions/${createdSession.session_id}`}
                className="font-medium text-zinc-900 underline"
              >
                View session stats
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
