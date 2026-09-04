import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  adminSessionSummarySchema,
  type AdminSessionSummary,
} from "../../shared/api/admin-schemas.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { SessionEventTables } from "../components/SessionEventTables.tsx";
import { SessionPlaylistCard } from "../components/SessionPlaylistCard.tsx";
import { Alert } from "../../components/ui/alert.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { Button } from "../../components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.tsx";
import {
  formatCommunity,
  formatSourceType,
  formatTimestamp,
} from "../lib/format.ts";

export function SessionStatsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session } = useAdminAuth();
  const [summary, setSummary] = useState<AdminSessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    if (!sessionId || !session?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/sessions/${sessionId}/summary`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load session summary");
      }
      setSummary(adminSessionSummarySchema.parse(body));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summary");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, sessionId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (!sessionId) {
    return <Alert variant="destructive">Missing session id.</Alert>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/sessions"
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            Back to sessions
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            Session
          </h1>
          <p className="mt-1 break-all font-mono text-sm text-zinc-600">
            {sessionId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadSummary()}>
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <a
              href={`/?session_id=${sessionId}${summary ? `&community=${summary.session.community}` : ""}`}
              target="_blank"
              rel="noreferrer"
            >
              Open feed
            </a>
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading session summary…</p>
      ) : summary ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>
                Assigned {formatTimestamp(summary.session.assigned_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-zinc-500">Community</p>
                <p className="font-medium">
                  {formatCommunity(summary.session.community)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Source type</p>
                <p className="font-medium">
                  {formatSourceType(summary.session.source_type)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Status</p>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge variant="secondary">{summary.session.status}</Badge>
                  {summary.session.demo_mode ? (
                    <Badge variant="outline">demo</Badge>
                  ) : null}
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Progress</p>
                <p className="font-medium">
                  {summary.session.current_position + 1} /{" "}
                  {summary.playlist_length}
                </p>
              </div>
            </CardContent>
          </Card>

          <SessionPlaylistCard
            playlist={summary.playlist}
            currentPosition={summary.session.current_position}
          />

          <SessionEventTables
            eventCounts={summary.event_counts}
            events={summary.events}
          />
        </>
      ) : null}
    </div>
  );
}
