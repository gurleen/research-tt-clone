import { useCallback, useEffect, useState } from "react";
import type { Tables } from "../../server/db/database.types.ts";
import type { PlaylistVideoCountRow } from "../../server/services/playlist/playlist-config-issues.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { CommunityTabbedPanel } from "../components/CommunityTabbedPanel.tsx";
import { ExperimentConfigForm } from "../components/ExperimentConfigForm.tsx";
import { Alert } from "../../components/ui/alert.tsx";

type ExperimentConfigRow = Tables<"experiment_config">;

export function ExperimentConfigPage() {
  const { client } = useAdminAuth();
  const [rows, setRows] = useState<ExperimentConfigRow[]>([]);
  const [videos, setVideos] = useState<PlaylistVideoCountRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    const [configResult, videosResult] = await Promise.all([
      client.from("experiment_config").select("*").order("community", {
        ascending: true,
      }),
      client
        .from("videos")
        .select("video_type, community, source_type")
        .eq("active", true),
    ]);

    if (configResult.error) {
      setError(configResult.error.message);
      setRows([]);
      setVideos(null);
      setLoading(false);
      return;
    }

    if (videosResult.error) {
      setError(videosResult.error.message);
      setRows(configResult.data ?? []);
      setVideos(null);
      setLoading(false);
      return;
    }

    setRows(configResult.data ?? []);
    setVideos(videosResult.data ?? []);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  function handleSaved(updated: ExperimentConfigRow) {
    setRows((current) =>
      current.map((row) =>
        row.community === updated.community ? updated : row,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Experiment config
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Per-community playlist settings read at session creation. Changes
          apply to new sessions only — existing playlists are unchanged.
        </p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading experiment config…</p>
      ) : (
        <CommunityTabbedPanel
          rows={rows}
          title="Community playlist settings"
          description="Select a community to edit ingroup/filler counts and prompt rules."
          renderPanel={(row) => (
            <ExperimentConfigForm
              row={row}
              videos={videos}
              onSaved={handleSaved}
            />
          )}
        />
      )}
    </div>
  );
}
