import { useCallback, useEffect, useState } from "react";
import type { Tables } from "../../server/db/database.types.ts";
import { PLATFORM_SETTING_KEYS } from "../../shared/api/admin-schemas.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { HandoffSettingsForm } from "../components/HandoffSettingsForm.tsx";
import { Alert } from "../../components/ui/alert.tsx";

type PlatformSettingRow = Tables<"platform_settings">;

export function HandoffSettingsPage() {
  const { client } = useAdminAuth();
  const [rows, setRows] = useState<PlatformSettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await client
      .from("platform_settings")
      .select("*")
      .in("key", [...PLATFORM_SETTING_KEYS])
      .order("key", { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setRows([]);
    } else {
      setRows(data ?? []);
    }

    setLoading(false);
  }, [client]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  function handleSaved(updatedRows: PlatformSettingRow[]) {
    setRows((current) => {
      const byKey = new Map(current.map((row) => [row.key, row]));
      for (const row of updatedRows) {
        byKey.set(row.key, row);
      }
      return PLATFORM_SETTING_KEYS.map(
        (key) => byKey.get(key)!,
      ).filter(Boolean);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Survey & debrief
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Configure the external survey link shown after the playlist and the
          debrief page copy participants see when they return from the survey.
        </p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading handoff settings…</p>
      ) : rows.length === 0 ? (
        <Alert variant="destructive">
          No platform settings found. Run the platform_settings migration.
        </Alert>
      ) : (
        <HandoffSettingsForm rows={rows} onSaved={handleSaved} />
      )}
    </div>
  );
}
