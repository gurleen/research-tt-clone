import { useCallback, useEffect, useState } from "react";
import {
  adminSessionListResponseSchema,
  SESSION_STATUSES,
  type AdminSessionListItem,
} from "../../shared/api/admin-schemas.ts";
import { COMMUNITIES, SOURCE_TYPES } from "../../shared/api/events.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { SessionsTable } from "../components/SessionsTable.tsx";
import { Alert } from "../../components/ui/alert.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Label } from "../../components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.tsx";
import { formatCommunity, formatSourceType } from "../lib/format.ts";

const PAGE_SIZE = 50;
const ALL = "all";

export function SessionsPage() {
  const { session } = useAdminAuth();
  const [sessions, setSessions] = useState<AdminSessionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [community, setCommunity] = useState(ALL);
  const [sourceType, setSourceType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (community !== ALL) params.set("community", community);
    if (sourceType !== ALL) params.set("source_type", sourceType);
    if (status !== ALL) params.set("status", status);

    try {
      const response = await fetch(`/api/admin/sessions?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load sessions");
      }
      const parsed = adminSessionListResponseSchema.parse(body);
      setSessions(parsed.sessions);
      setTotal(parsed.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
      setSessions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [community, offset, session?.access_token, sourceType, status]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setOffset(0);
  }

  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = offset + sessions.length;
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Sessions</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Browse previous participant sessions and inspect captured events.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="filter-community">Community</Label>
          <Select
            value={community}
            onValueChange={(value) => updateFilter(setCommunity, value)}
          >
            <SelectTrigger id="filter-community">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {COMMUNITIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {formatCommunity(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-source-type">Source type</Label>
          <Select
            value={sourceType}
            onValueChange={(value) => updateFilter(setSourceType, value)}
          >
            <SelectTrigger id="filter-source-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {SOURCE_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {formatSourceType(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => updateFilter(setStatus, value)}
          >
            <SelectTrigger id="filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {SESSION_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading sessions…</p>
      ) : (
        <>
          <SessionsTable sessions={sessions} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">
              {total === 0
                ? "0 sessions"
                : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!canPrev}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!canNext}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
