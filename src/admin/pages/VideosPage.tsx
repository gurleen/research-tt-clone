import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import type { Tables } from "../../server/db/database.types.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { VideosTable } from "../components/VideosTable.tsx";
import { Alert } from "../../components/ui/alert.tsx";
import { Button } from "../../components/ui/button.tsx";

type VideoRow = Tables<"videos">;

export function VideosPage() {
  const { client } = useAdminAuth();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await client
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setVideos([]);
    } else {
      setVideos(data ?? []);
    }

    setLoading(false);
  }, [client]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  async function handleDelete(videoId: string) {
    if (!client) return;
    if (!window.confirm(`Delete video "${videoId}"?`)) return;

    setDeletingId(videoId);
    setError(null);

    const { error: deleteError } = await client
      .from("videos")
      .delete()
      .eq("video_id", videoId);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setVideos((current) => current.filter((video) => video.video_id !== videoId));
    }

    setDeletingId(null);
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

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading videos…</p>
      ) : (
        <VideosTable
          videos={videos}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}
