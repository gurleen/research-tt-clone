import { FormEvent, useEffect, useState } from "react";
import type { Tables } from "../../server/db/database.types.ts";
import { stubContentFormSchema } from "../../shared/api/admin-schemas.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { Alert } from "../../components/ui/alert.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Label } from "../../components/ui/label.tsx";
import { Textarea } from "../../components/ui/textarea.tsx";

type StubContentRow = Tables<"stub_content">;

type StubContentEditorProps = {
  row: StubContentRow;
  onSaved: (row: StubContentRow) => void;
};

export function StubContentEditor({ row, onSaved }: StubContentEditorProps) {
  const { client } = useAdminAuth();
  const [body, setBody] = useState(row.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBody(row.body ?? "");
  }, [row.body, row.community]);

  const isConfigured = Boolean(body.trim());

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!client) return;

    setError(null);
    setSuccess(null);

    const parsed = stubContentFormSchema.safeParse({
      community: row.community,
      body,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validation failed");
      return;
    }

    setSubmitting(true);

    const { data, error: updateError } = await client
      .from("stub_content")
      .update({ body: parsed.data.body })
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">
          Issue-information body shown on the learn-more stub for this
          community.
        </p>
        <Badge variant={isConfigured ? "default" : "secondary"}>
          {isConfigured ? "Configured" : "Not yet configured"}
        </Badge>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert>{success}</Alert>}

      <div className="space-y-2">
        <Label htmlFor={`stub-body-${row.community}`}>Body text</Label>
        <Textarea
          id={`stub-body-${row.community}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Enter the constant stub copy for this community…"
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
