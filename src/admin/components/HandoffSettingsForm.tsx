import { FormEvent, useEffect, useState } from "react";
import type { Tables } from "../../server/db/database.types.ts";
import {
  PLATFORM_SETTING_KEYS,
  platformSettingsFormSchema,
  type PlatformSettingsFormValues,
} from "../../shared/api/admin-schemas.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { formatTimestamp } from "../lib/format.ts";
import { Alert } from "../../components/ui/alert.tsx";
import { Button } from "../../components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Label } from "../../components/ui/label.tsx";
import { Textarea } from "../../components/ui/textarea.tsx";

type PlatformSettingRow = Tables<"platform_settings">;

type HandoffSettingsFormProps = {
  rows: PlatformSettingRow[];
  onSaved: (rows: PlatformSettingRow[]) => void;
};

export function rowsToFormValues(
  rows: PlatformSettingRow[],
): PlatformSettingsFormValues {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  return {
    survey_url: byKey.get("survey_url") ?? "",
    debrief_title: byKey.get("debrief_title") ?? "",
    debrief_body: byKey.get("debrief_body") ?? "",
    debrief_withdrawal: byKey.get("debrief_withdrawal") ?? "",
    debrief_contact: byKey.get("debrief_contact") ?? "",
  };
}

export function HandoffSettingsForm({ rows, onSaved }: HandoffSettingsFormProps) {
  const { client } = useAdminAuth();
  const [form, setForm] = useState(() => rowsToFormValues(rows));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(rowsToFormValues(rows));
  }, [rows]);

  const latestUpdatedAt = rows.reduce<string | null>((latest, row) => {
    if (!latest || row.updated_at > latest) {
      return row.updated_at;
    }
    return latest;
  }, null);

  function updateField<K extends keyof PlatformSettingsFormValues>(
    key: K,
    value: PlatformSettingsFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!client) return;

    setError(null);
    setSuccess(null);

    const parsed = platformSettingsFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validation failed");
      return;
    }

    setSubmitting(true);

    const updates = await Promise.all(
      PLATFORM_SETTING_KEYS.map((key) =>
        client
          .from("platform_settings")
          .update({ value: parsed.data[key] })
          .eq("key", key)
          .select("*")
          .single(),
      ),
    );

    const updateError = updates.find((result) => result.error)?.error;
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    const updatedRows = updates.flatMap((result) =>
      result.data ? [result.data] : [],
    );
    setSuccess("Saved");
    onSaved(updatedRows);
    setSubmitting(false);
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Survey handoff and debrief copy</CardTitle>
        <CardDescription>
          The survey URL is returned after playlist completion. Debrief copy is
          served from GET /api/debrief after survey completion. Changes apply
          immediately without redeploying.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}
          {success && <Alert>{success}</Alert>}

          <div className="space-y-2">
            <Label htmlFor="survey-url">Survey URL template</Label>
            <Input
              id="survey-url"
              value={form.survey_url}
              onChange={(event) =>
                updateField("survey_url", event.target.value)
              }
              placeholder="https://survey.example.com?session_id={session_id}"
            />
            <p className="text-xs text-zinc-500">
              Must include {"{session_id}"}. Optional {"{external_id}"} and{" "}
              {"{status}"} are replaced on playlist complete. If those
              placeholders are omitted, they are appended as query params. Never
              include source_type.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="debrief-title">Debrief title</Label>
            <Input
              id="debrief-title"
              value={form.debrief_title}
              onChange={(event) =>
                updateField("debrief_title", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="debrief-body">Debrief body</Label>
            <Textarea
              id="debrief-body"
              rows={4}
              value={form.debrief_body}
              onChange={(event) =>
                updateField("debrief_body", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="debrief-withdrawal">Withdrawal instructions</Label>
            <Textarea
              id="debrief-withdrawal"
              rows={3}
              value={form.debrief_withdrawal}
              onChange={(event) =>
                updateField("debrief_withdrawal", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="debrief-contact">Contact email</Label>
            <Input
              id="debrief-contact"
              type="email"
              value={form.debrief_contact}
              onChange={(event) =>
                updateField("debrief_contact", event.target.value)
              }
            />
          </div>

          {latestUpdatedAt && (
            <p className="text-xs text-zinc-500">
              Last updated {formatTimestamp(latestUpdatedAt)}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
