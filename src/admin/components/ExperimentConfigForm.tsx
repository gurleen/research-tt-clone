import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Tables } from "../../server/db/database.types.ts";
import {
  catalogCountsFromVideos,
  playlistConfigIssues,
  type PlaylistVideoCountRow,
} from "../../server/services/playlist/playlist-config-issues.ts";
import { experimentConfigFormSchema } from "../../shared/api/admin-schemas.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { formatTimestamp } from "../lib/format.ts";
import { Alert } from "../../components/ui/alert.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Label } from "../../components/ui/label.tsx";

type ExperimentConfigRow = Tables<"experiment_config">;

type ExperimentConfigFormProps = {
  row: ExperimentConfigRow;
  videos: PlaylistVideoCountRow[] | null;
  onSaved: (row: ExperimentConfigRow) => void;
};

export function ExperimentConfigForm({
  row,
  videos,
  onSaved,
}: ExperimentConfigFormProps) {
  const { client } = useAdminAuth();
  const [form, setForm] = useState({
    ingroup_count_min: row.ingroup_count_min,
    ingroup_count_max: row.ingroup_count_max,
    filler_count_min: row.filler_count_min,
    filler_count_max: row.filler_count_max,
    prompt_probability: row.prompt_probability,
    prompt_min_spacing: row.prompt_min_spacing,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm({
      ingroup_count_min: row.ingroup_count_min,
      ingroup_count_max: row.ingroup_count_max,
      filler_count_min: row.filler_count_min,
      filler_count_max: row.filler_count_max,
      prompt_probability: row.prompt_probability,
      prompt_min_spacing: row.prompt_min_spacing,
    });
  }, [row]);

  const configIssues = useMemo(() => {
    return playlistConfigIssues(
      {
        ingroup_count_min: form.ingroup_count_min,
        ingroup_count_max: form.ingroup_count_max,
        filler_count_min: form.filler_count_min,
        filler_count_max: form.filler_count_max,
      },
      videos ? catalogCountsFromVideos(videos, row.community) : null,
    );
  }, [form, row.community, videos]);

  function updateNumberField(
    key: keyof typeof form,
    raw: string,
  ) {
    setForm((current) => ({
      ...current,
      [key]: raw === "" ? 0 : Number(raw),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!client) return;

    setError(null);
    setSuccess(null);

    const parsed = experimentConfigFormSchema.safeParse({
      community: row.community,
      ...form,
      prompt_probability: Number(form.prompt_probability),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validation failed");
      return;
    }

    setSubmitting(true);

    const { data, error: updateError } = await client
      .from("experiment_config")
      .update({
        ingroup_count_min: parsed.data.ingroup_count_min,
        ingroup_count_max: parsed.data.ingroup_count_max,
        filler_count_min: parsed.data.filler_count_min,
        filler_count_max: parsed.data.filler_count_max,
        prompt_probability: parsed.data.prompt_probability,
        prompt_min_spacing: parsed.data.prompt_min_spacing,
      })
      .eq("community", row.community)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
    } else if (data) {
      setSuccess("Saved");
      onSaved(data);
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-zinc-600">
        Playlist counts and interest-prompt rules used when creating new
        sessions. Set min = max for a fixed count. Consecutive ingroup videos
        always have at least 2 fillers between them.
      </p>

      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert>{success}</Alert>}
      {configIssues.map((issue) => (
        <Alert key={`${issue.kind}:${issue.message}`} variant="destructive">
          {issue.message}
        </Alert>
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${row.community}-ingroup-min`}>
            Ingroup count min
          </Label>
          <Input
            id={`${row.community}-ingroup-min`}
            type="number"
            min={0}
            value={form.ingroup_count_min}
            onChange={(e) =>
              updateNumberField("ingroup_count_min", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${row.community}-ingroup-max`}>
            Ingroup count max
          </Label>
          <Input
            id={`${row.community}-ingroup-max`}
            type="number"
            min={0}
            value={form.ingroup_count_max}
            onChange={(e) =>
              updateNumberField("ingroup_count_max", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${row.community}-filler-min`}>
            Filler count min
          </Label>
          <Input
            id={`${row.community}-filler-min`}
            type="number"
            min={0}
            value={form.filler_count_min}
            onChange={(e) =>
              updateNumberField("filler_count_min", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${row.community}-filler-max`}>
            Filler count max
          </Label>
          <Input
            id={`${row.community}-filler-max`}
            type="number"
            min={0}
            value={form.filler_count_max}
            onChange={(e) =>
              updateNumberField("filler_count_max", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${row.community}-prompt-prob`}>
            Prompt probability
          </Label>
          <Input
            id={`${row.community}-prompt-prob`}
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={form.prompt_probability}
            onChange={(e) =>
              updateNumberField("prompt_probability", e.target.value)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${row.community}-prompt-spacing`}>
            Prompt min spacing
          </Label>
          <Input
            id={`${row.community}-prompt-spacing`}
            type="number"
            min={0}
            value={form.prompt_min_spacing}
            onChange={(e) =>
              updateNumberField("prompt_min_spacing", e.target.value)
            }
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Last updated {formatTimestamp(row.updated_at)}
      </p>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
