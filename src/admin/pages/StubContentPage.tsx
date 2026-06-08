import { useCallback, useEffect, useState } from "react";
import type { Tables } from "../../server/db/database.types.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { CommunityTabbedPanel } from "../components/CommunityTabbedPanel.tsx";
import { StubContentEditor } from "../components/StubContentEditor.tsx";
import { Alert } from "../../components/ui/alert.tsx";

type StubContentRow = Tables<"stub_content">;

export function StubContentPage() {
  const { client } = useAdminAuth();
  const [rows, setRows] = useState<StubContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    const { data, error: queryError } = await client
      .from("stub_content")
      .select("*")
      .order("community", { ascending: true });

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

  function handleSaved(updated: StubContentRow) {
    setRows((current) =>
      current.map((row) =>
        row.community === updated.community ? updated : row,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Stub content</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          The stub body is constant within each community. Attribution on the
          stub page comes from the ingroup video the participant clicked — only
          the body text is edited here.
        </p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading stub content…</p>
      ) : (
        <CommunityTabbedPanel
          rows={rows}
          title="Community stub copy"
          description="Select a community to edit its learn-more stub body."
          renderPanel={(row) => (
            <StubContentEditor row={row} onSaved={handleSaved} />
          )}
        />
      )}
    </div>
  );
}
