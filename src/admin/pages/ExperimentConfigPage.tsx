import { useCallback, useEffect, useState } from "react";
import type { Tables } from "../../server/db/database.types.ts";
import type { PlaylistVideoCountRow } from "../../server/services/playlist/playlist-config-issues.ts";
import { EXPERIMENT_SETTING_KEYS } from "../../shared/api/admin-schemas.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { CommunityTabbedPanel } from "../components/CommunityTabbedPanel.tsx";
import { ExperimentConfigForm } from "../components/ExperimentConfigForm.tsx";
import { InterestPromptTimingForm } from "../components/InterestPromptTimingForm.tsx";
import { Alert } from "../../components/ui/alert.tsx";

type ExperimentConfigRow = Tables<"experiment_config">;
type PlatformSettingRow = Tables<"platform_settings">;

export function ExperimentConfigPage() {
  const { client } = useAdminAuth();
  const [rows, setRows] = useState<ExperimentConfigRow[]>([]);
  const [timingRows, setTimingRows] = useState<PlatformSettingRow[]>([]);
  const [videos, setVideos] = useState<PlaylistVideoCountRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    const [configResult, videosResult, timingResult] = await Promise.all([
      client.from("experiment_config").select("*").order("community", {
        ascending: true,
      }),
      client
        .from("videos")
        .select("video_type, community, source_type")
        .eq("active", true),
      client
        .from("platform_settings")
        .select("*")
        .in("key", [...EXPERIMENT_SETTING_KEYS]),
    ]);

    if (configResult.error) {
      setError(configResult.error.message);
      setRows([]);
      setVideos(null);
      setTimingRows([]);
      setLoading(false);
      return;
    }

    if (videosResult.error) {
      setError(videosResult.error.message);
      setRows(configResult.data ?? []);
      setVideos(null);
      setTimingRows(timingResult.data ?? []);
      setLoading(false);
      return;
    }

    if (timingResult.error) {
      setError(timingResult.error.message);
      setRows(configResult.data ?? []);
      setVideos(videosResult.data ?? []);
      setTimingRows([]);
      setLoading(false);
      return;
    }

    setRows(configResult.data ?? []);
    setVideos(videosResult.data ?? []);
    setTimingRows(timingResult.data ?? []);
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

  function handleTimingSaved(updatedRows: PlatformSettingRow[]) {
    setTimingRows((current) => {
      const byKey = new Map(current.map((row) => [row.key, row]));
      for (const row of updatedRows) {
        byKey.set(row.key, row);
      }
      return EXPERIMENT_SETTING_KEYS.map((key) => byKey.get(key)!).filter(
        Boolean,
      );
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Experiment config
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Per-community playlist settings read at session creation. Changes
          apply to new sessions only — existing playlists are unchanged. Prompt
          timing is global and applies to all communities.
        </p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading experiment config…</p>
      ) : (
        <>
          {timingRows.length === 0 ? (
            <Alert variant="destructive">
              Interest prompt timing setting not found. Run the
              interest_prompt_reveal_fraction migration.
            </Alert>
          ) : (
            <InterestPromptTimingForm
              rows={timingRows}
              onSaved={handleTimingSaved}
            />
          )}
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
        </>
      )}
    </div>
  );
}
