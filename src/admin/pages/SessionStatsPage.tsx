import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  adminSessionSummarySchema,
  type AdminSessionSummary,
} from "../../shared/api/admin-schemas.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table.tsx";
import { formatCommunity, formatTimestamp } from "../lib/format.ts";

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
            to="/admin/test-session"
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            Back to test session
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            Session stats
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
                <p className="font-medium">{summary.session.source_type}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Status</p>
                <Badge variant="secondary">{summary.session.status}</Badge>
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

          <Card>
            <CardHeader>
              <CardTitle>Event counts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event table</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(summary.event_counts).map(([table, count]) => (
                    <TableRow key={table}>
                      <TableCell className="font-mono text-xs">{table}</TableCell>
                      <TableCell>{count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw events</CardTitle>
              <CardDescription>Latest captured rows per event type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(summary.events).map(([table, rows]) => (
                <div key={table}>
                  <p className="mb-2 font-mono text-xs font-semibold text-zinc-700">
                    {table}
                  </p>
                  <pre className="max-h-48 overflow-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">
                    {JSON.stringify(rows, null, 2)}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
