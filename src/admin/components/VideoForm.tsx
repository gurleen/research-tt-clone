import { useEffect, useState, type FormEvent } from "react";
import type { Json, Tables, TablesInsert } from "../../server/db/database.types.ts";
import {
  videoFormSchema,
  type VideoFormValues,
} from "../../shared/api/admin-schemas.ts";
import { catalogCommentSchema } from "../../shared/api/schemas.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { uploadToR2 } from "../lib/upload-to-r2.ts";
import { readVideoDurationMs } from "../lib/read-video-duration.ts";
import { Alert } from "../../components/ui/alert.tsx";
import { Button } from "../../components/ui/button.tsx";
import { FileInput } from "../../components/ui/file-input.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Label } from "../../components/ui/label.tsx";
import { Textarea } from "../../components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.tsx";

type VideoRow = Tables<"videos">;
type VideoComment = VideoFormValues["comments"][number];

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
  caption: "",
  like_count: 0,
  comment_count: 0,
  follower_count: 0,
  share_count: 0,
  save_count: 0,
  comments: [],
};

function commentsFromRow(value: Json): VideoComment[] {
  const parsed = catalogCommentSchema.array().safeParse(value);
  return parsed.success ? parsed.data : [];
}

function normalizeComments(comments: VideoComment[]): VideoComment[] {
  return comments
    .filter((comment) => comment.username.trim() || comment.text.trim())
    .map((comment) => {
      const timestamp = comment.timestamp?.trim();
      return {
        username: comment.username.trim(),
        text: comment.text.trim(),
        ...(timestamp ? { timestamp } : {}),
      };
    });
}

function parseCount(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

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
    caption: row.caption,
    like_count: row.like_count,
    comment_count: row.comment_count,
    follower_count: row.follower_count,
    share_count: row.share_count,
    save_count: row.save_count,
    comments: commentsFromRow(row.comments),
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
  const [durationWarning, setDurationWarning] = useState<string | null>(null);

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
        if (value === "filler" || value === "control") {
          next.community = null;
          next.source_type = null;
        } else if (value === "ingroup") {
          next.community = current.community ?? "sikh";
          next.source_type =
            current.source_type === "micro_influencer" ||
            current.source_type === "institutional"
              ? current.source_type
              : "micro_influencer";
        }
      }

      return next;
    });
  }

  function updateComment<K extends keyof VideoComment>(
    index: number,
    key: K,
    value: VideoComment[K],
  ) {
    setForm((current) => ({
      ...current,
      comments: current.comments.map((comment, i) =>
        i === index ? { ...comment, [key]: value } : comment,
      ),
    }));
  }

  function addComment() {
    setForm((current) => ({
      ...current,
      comments: [...current.comments, { username: "", text: "" }],
    }));
  }

  function removeComment(index: number) {
    setForm((current) => ({
      ...current,
      comments: current.comments.filter((_, i) => i !== index),
    }));
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
    setDurationWarning(null);
    try {
      try {
        const durationMs = await readVideoDurationMs(file);
        updateField("duration_ms", durationMs);
      } catch {
        setDurationWarning(
          "Could not detect video duration automatically. You can still save without it.",
        );
      }
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
    const parsed = videoFormSchema.safeParse({
      ...form,
      comments: normalizeComments(form.comments),
    });
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
      caption: parsed.data.caption,
      like_count: parsed.data.like_count,
      comment_count: parsed.data.comment_count,
      follower_count: parsed.data.follower_count,
      share_count: parsed.data.share_count,
      save_count: parsed.data.save_count,
      comments: parsed.data.comments,
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
      {durationWarning && <Alert>{durationWarning}</Alert>}

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
              <SelectItem value="control">Control</SelectItem>
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

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            value={form.caption}
            onChange={(e) => updateField("caption", e.target.value)}
            placeholder="Overlay caption shown under the handle"
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="like_count">Like count</Label>
          <Input
            id="like_count"
            type="number"
            min={0}
            value={form.like_count}
            onChange={(e) => updateField("like_count", parseCount(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment_count">Comment count</Label>
          <Input
            id="comment_count"
            type="number"
            min={0}
            value={form.comment_count}
            onChange={(e) =>
              updateField("comment_count", parseCount(e.target.value))
            }
          />
          <p className="text-xs text-zinc-500">
            Display baseline. Leave 0 to use the number of comments below.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="follower_count">Follower count</Label>
          <Input
            id="follower_count"
            type="number"
            min={0}
            value={form.follower_count}
            onChange={(e) =>
              updateField("follower_count", parseCount(e.target.value))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="share_count">Share count</Label>
          <Input
            id="share_count"
            type="number"
            min={0}
            value={form.share_count}
            onChange={(e) =>
              updateField("share_count", parseCount(e.target.value))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="save_count">Save count</Label>
          <Input
            id="save_count"
            type="number"
            min={0}
            value={form.save_count}
            onChange={(e) => updateField("save_count", parseCount(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration_ms">Duration</Label>
          <p id="duration_ms" className="text-sm text-zinc-600">
            {form.duration_ms != null
              ? `${(form.duration_ms / 1000).toFixed(1)} s (auto-detected from media)`
              : "Upload a media file to detect duration automatically."}
          </p>
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

      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium text-zinc-900">Comments</h2>
            <p className="text-xs text-zinc-500">
              Read-only stimulus comments shown in the sheet. Timestamp is display
              text such as &quot;2d ago&quot;.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addComment}>
            Add comment
          </Button>
        </div>

        {form.comments.length === 0 ? (
          <p className="text-sm text-zinc-500">No comments yet.</p>
        ) : (
          <div className="space-y-4">
            {form.comments.map((comment, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-md border border-zinc-200 p-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <div className="space-y-2">
                  <Label htmlFor={`comment-username-${index}`}>Username</Label>
                  <Input
                    id={`comment-username-${index}`}
                    value={comment.username}
                    onChange={(e) =>
                      updateComment(index, "username", e.target.value)
                    }
                    placeholder="foodie_forever"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`comment-timestamp-${index}`}>
                    Timestamp (optional)
                  </Label>
                  <Input
                    id={`comment-timestamp-${index}`}
                    value={comment.timestamp ?? ""}
                    onChange={(e) =>
                      updateComment(index, "timestamp", e.target.value)
                    }
                    placeholder="2d ago"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeComment(index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor={`comment-text-${index}`}>Text</Label>
                  <Textarea
                    id={`comment-text-${index}`}
                    value={comment.text}
                    onChange={(e) =>
                      updateComment(index, "text", e.target.value)
                    }
                    placeholder="Comment body"
                    className="min-h-[72px]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
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
