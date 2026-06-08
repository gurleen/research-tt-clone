import { FormEvent, useEffect, useState } from "react";
import type { Tables, TablesInsert } from "../../server/db/database.types.ts";
import {
  videoFormSchema,
  type VideoFormValues,
} from "../../shared/api/admin-schemas.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { uploadToR2 } from "../lib/upload-to-r2.ts";
import { Alert } from "../../components/ui/alert.tsx";
import { Button } from "../../components/ui/button.tsx";
import { FileInput } from "../../components/ui/file-input.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Label } from "../../components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.tsx";

type VideoRow = Tables<"videos">;

const emptyForm: VideoFormValues = {
  video_id: "",
  video_type: "ingroup",
  community: "sikh",
  source_type: "micro_influencer",
  media_url: "",
  profile_thumbnail_url: "",
  account_name: "",
  account_handle: "",
  duration_ms: null,
  central_issue: null,
};

function rowToForm(row: VideoRow): VideoFormValues {
  return {
    video_id: row.video_id,
    video_type: row.video_type,
    community: row.community,
    source_type: row.source_type,
    media_url: row.media_url,
    profile_thumbnail_url: row.profile_thumbnail_url,
    account_name: row.account_name,
    account_handle: row.account_handle,
    duration_ms: row.duration_ms,
    central_issue: row.central_issue,
  };
}

type VideoFormProps = {
  initialVideo?: VideoRow | null;
  onSaved: () => void;
  onCancel: () => void;
};

export function VideoForm({ initialVideo, onSaved, onCancel }: VideoFormProps) {
  const { client, session } = useAdminAuth();
  const isEdit = Boolean(initialVideo);
  const [form, setForm] = useState<VideoFormValues>(
    initialVideo ? rowToForm(initialVideo) : emptyForm,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [mediaFileName, setMediaFileName] = useState<string | null>(null);
  const [thumbnailFileName, setThumbnailFileName] = useState<string | null>(null);

  useEffect(() => {
    if (initialVideo) {
      setForm(rowToForm(initialVideo));
    }
  }, [initialVideo]);

  function updateField<K extends keyof VideoFormValues>(
    key: K,
    value: VideoFormValues[K],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "video_type") {
        if (value === "filler") {
          next.community = null;
          next.source_type = null;
        } else if (value === "ingroup") {
          next.community = current.community ?? "sikh";
          next.source_type = current.source_type ?? "micro_influencer";
        }
      }

      return next;
    });
  }

  async function handleFileUpload(
    file: File,
    kind: "media" | "thumbnail",
  ): Promise<void> {
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }
    if (!form.video_id.trim()) {
      throw new Error("Enter a video ID before uploading files");
    }

    const publicUrl = await uploadToR2(file, {
      videoId: form.video_id.trim(),
      kind,
      accessToken: session.access_token,
    });

    if (kind === "media") {
      updateField("media_url", publicUrl);
    } else {
      updateField("profile_thumbnail_url", publicUrl);
    }
  }

  async function onMediaChange(file: File | undefined) {
    if (!file) return;
    setMediaFileName(file.name);
    setUploadingMedia(true);
    setError(null);
    try {
      await handleFileUpload(file, "media");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Media upload failed");
    } finally {
      setUploadingMedia(false);
    }
  }

  async function onThumbnailChange(file: File | undefined) {
    if (!file) return;
    setThumbnailFileName(file.name);
    setUploadingThumb(true);
    setError(null);
    try {
      await handleFileUpload(file, "thumbnail");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thumbnail upload failed");
    } finally {
      setUploadingThumb(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!client) return;

    setError(null);
    const parsed = videoFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validation failed");
      return;
    }

    setSubmitting(true);

    const payload: TablesInsert<"videos"> = {
      video_id: parsed.data.video_id,
      video_type: parsed.data.video_type,
      community: parsed.data.community,
      source_type: parsed.data.source_type,
      media_url: parsed.data.media_url,
      profile_thumbnail_url: parsed.data.profile_thumbnail_url,
      account_name: parsed.data.account_name,
      account_handle: parsed.data.account_handle,
      duration_ms: parsed.data.duration_ms ?? null,
      central_issue: parsed.data.central_issue ?? null,
    };

    try {
      if (isEdit) {
        const { error: updateError } = await client
          .from("videos")
          .update(payload)
          .eq("video_id", initialVideo!.video_id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await client.from("videos").insert(payload);
        if (insertError) throw insertError;
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="video_id">Video ID</Label>
          <Input
            id="video_id"
            value={form.video_id}
            onChange={(e) => updateField("video_id", e.target.value)}
            placeholder="ingroup_sikh_micro_01"
            disabled={isEdit}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Video type</Label>
          <Select
            value={form.video_type}
            onValueChange={(value) =>
              updateField("video_type", value as VideoFormValues["video_type"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ingroup">Ingroup</SelectItem>
              <SelectItem value="filler">Filler</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.video_type === "ingroup" && (
          <>
            <div className="space-y-2">
              <Label>Community</Label>
              <Select
                value={form.community ?? undefined}
                onValueChange={(value) =>
                  updateField("community", value as NonNullable<VideoFormValues["community"]>)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="armenian">Armenian</SelectItem>
                  <SelectItem value="sikh">Sikh</SelectItem>
                  <SelectItem value="iranian">Iranian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source type</Label>
              <Select
                value={form.source_type ?? undefined}
                onValueChange={(value) =>
                  updateField(
                    "source_type",
                    value as NonNullable<VideoFormValues["source_type"]>,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="micro_influencer">Micro influencer</SelectItem>
                  <SelectItem value="institutional">Institutional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="account_name">Account name</Label>
          <Input
            id="account_name"
            value={form.account_name}
            onChange={(e) => updateField("account_name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account_handle">Account handle</Label>
          <Input
            id="account_handle"
            value={form.account_handle}
            onChange={(e) => updateField("account_handle", e.target.value)}
            placeholder="@creator"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration_ms">Duration (ms)</Label>
          <Input
            id="duration_ms"
            type="number"
            min={1}
            value={form.duration_ms ?? ""}
            onChange={(e) =>
              updateField(
                "duration_ms",
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        </div>

        {form.video_type === "ingroup" && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="central_issue">Central issue</Label>
            <Input
              id="central_issue"
              value={form.central_issue ?? ""}
              onChange={(e) =>
                updateField("central_issue", e.target.value || null)
              }
            />
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="space-y-2">
          <Label>Media file</Label>
          <FileInput
            id="media_file"
            accept="video/*"
            buttonLabel={uploadingMedia ? "Uploading…" : "Choose video"}
            disabled={uploadingMedia}
            fileName={
              uploadingMedia
                ? "Uploading…"
                : mediaFileName ??
                  (form.media_url ? "File uploaded" : null)
            }
            onChange={(e) => onMediaChange(e.target.files?.[0])}
          />
          {form.media_url && (
            <p className="break-all text-xs text-zinc-500">{form.media_url}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Profile thumbnail</Label>
          <FileInput
            id="thumbnail_file"
            accept="image/*"
            buttonLabel={uploadingThumb ? "Uploading…" : "Choose image"}
            disabled={uploadingThumb}
            fileName={
              uploadingThumb
                ? "Uploading…"
                : thumbnailFileName ??
                  (form.profile_thumbnail_url ? "File uploaded" : null)
            }
            onChange={(e) => onThumbnailChange(e.target.files?.[0])}
          />
          {form.profile_thumbnail_url && (
            <p className="break-all text-xs text-zinc-500">
              {form.profile_thumbnail_url}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting || uploadingMedia || uploadingThumb}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create video"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
