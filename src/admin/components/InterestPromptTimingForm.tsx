import { FormEvent, useEffect, useState } from "react";
import type { Tables } from "../../server/db/database.types.ts";
import {
  interestPromptTimingFormSchema,
  type InterestPromptTimingFormValues,
} from "../../shared/api/admin-schemas.ts";
import {
  fractionToPercent,
  parseInterestPromptRevealFraction,
  percentToFraction,
} from "../../shared/experiment/interest-prompt-timing.ts";
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

type PlatformSettingRow = Tables<"platform_settings">;

type InterestPromptTimingFormProps = {
  rows: PlatformSettingRow[];
  onSaved: (rows: PlatformSettingRow[]) => void;
};

export function rowsToFormValues(
  rows: PlatformSettingRow[],
): InterestPromptTimingFormValues {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const fraction = parseInterestPromptRevealFraction(
    byKey.get("interest_prompt_reveal_fraction"),
  );

  return {
    interest_prompt_reveal_percent: fractionToPercent(fraction),
  };
}

export function InterestPromptTimingForm({
  rows,
  onSaved,
}: InterestPromptTimingFormProps) {
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!client) return;

    setError(null);
    setSuccess(null);

    const parsed = interestPromptTimingFormSchema.safeParse({
      interest_prompt_reveal_percent: Number(
        form.interest_prompt_reveal_percent,
      ),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validation failed");
      return;
    }

    setSubmitting(true);

    const fractionValue = String(
      percentToFraction(parsed.data.interest_prompt_reveal_percent),
    );

    const { data, error: updateError } = await client
      .from("platform_settings")
      .update({ value: fractionValue })
      .eq("key", "interest_prompt_reveal_fraction")
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    setSuccess("Saved");
    if (data) onSaved([data]);
    setSubmitting(false);
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Global prompt timing</CardTitle>
        <CardDescription>
          Wait until the participant has watched this percent of the video
          before showing the interest prompt. Applies to all communities and
          both prompt copies (topic and filler). New and restored sessions pick
          up the value on the next session load.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}
          {success && <Alert>{success}</Alert>}

          <div className="space-y-2">
            <Label htmlFor="interest-prompt-reveal-percent">
              Show prompt after percent of video
            </Label>
            <Input
              id="interest-prompt-reveal-percent"
              type="number"
              min={0}
              max={100}
              step={1}
              value={form.interest_prompt_reveal_percent}
              onChange={(event) =>
                setForm({
                  interest_prompt_reveal_percent:
                    event.target.value === ""
                      ? 0
                      : Number(event.target.value),
                })
              }
            />
            <p className="text-xs text-zinc-500">
              Default is 30. Example: a 20-second video shows the popup after 6
              seconds of playback. Pausing delays the prompt.
            </p>
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
