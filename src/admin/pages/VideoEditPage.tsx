import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Tables } from "../../server/db/database.types.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { VideoForm } from "../components/VideoForm.tsx";
import { Alert } from "../../components/ui/alert.tsx";

type VideoRow = Tables<"videos">;

export function VideoEditPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { client } = useAdminAuth();
  const isNew = !videoId || videoId === "new";
  const [video, setVideo] = useState<VideoRow | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !client || !videoId) return;

    client
      .from("videos")
      .select("*")
      .eq("video_id", videoId)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError(queryError.message);
        } else if (!data) {
          setError("Video not found");
        } else {
          setVideo(data);
        }
        setLoading(false);
      });
  }, [client, isNew, videoId]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading video…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/videos" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Back to videos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          {isNew ? "Add video" : `Edit ${videoId}`}
        </h1>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {!error && (isNew || video) && (
        <VideoForm
          initialVideo={video}
          onSaved={() => navigate("/admin/videos")}
          onCancel={() => navigate("/admin/videos")}
        />
      )}
    </div>
  );
}
