import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import type { Tables } from "../../server/db/database.types.ts";
import {
  deactivateVideoResponseSchema,
  reactivateVideoResponseSchema,
} from "../../shared/api/admin-schemas.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { VideosTable } from "../components/VideosTable.tsx";
import { Alert } from "../../components/ui/alert.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Label } from "../../components/ui/label.tsx";

type VideoRow = Tables<"videos">;

export function VideosPage() {
  const { client, session } = useAdminAuth();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const loadVideos = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    let query = client.from("videos").select("*").order("created_at", {
      ascending: false,
    });

    if (!showInactive) {
      query = query.eq("active", true);
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      setError(queryError.message);
      setVideos([]);
    } else {
      setVideos(data ?? []);
    }

    setLoading(false);
  }, [client, showInactive]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  async function handleDeactivate(videoId: string) {
    if (!session?.access_token) return;
    if (
      !window.confirm(
        `Deactivate "${videoId}"? It will no longer appear in new sessions.`,
      )
    ) {
      return;
    }

    setActionId(videoId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/videos/${encodeURIComponent(videoId)}/deactivate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to deactivate video");
      }

      deactivateVideoResponseSchema.parse(json);
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deactivate failed");
    } finally {
      setActionId(null);
    }
  }

  async function handleReactivate(videoId: string) {
    if (!session?.access_token) return;

    setActionId(videoId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/videos/${encodeURIComponent(videoId)}/reactivate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to reactivate video");
      }

      reactivateVideoResponseSchema.parse(json);
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reactivate failed");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Videos</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage ingroup and filler stimulus videos.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/videos/new">Add video</Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="show_inactive"
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <Label htmlFor="show_inactive" className="text-sm font-normal">
          Show inactive videos
        </Label>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading videos…</p>
      ) : (
        <VideosTable
          videos={videos}
          actionId={actionId}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
        />
      )}
    </div>
  );
}
