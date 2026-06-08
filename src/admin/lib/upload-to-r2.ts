import type { PresignUploadBody, PresignUploadResponse } from "../../shared/api/admin-types.ts";
import { presignUploadResponseSchema } from "../../shared/api/admin-schemas.ts";

function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) {
    return fromName.replace(/[^a-z0-9]/g, "");
  }

  if (file.type === "video/webm") return "webm";
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "bin";
}

export async function uploadToR2(
  file: File,
  options: {
    videoId: string;
    kind: PresignUploadBody["kind"];
    accessToken: string;
  },
): Promise<string> {
  const body: PresignUploadBody = {
    video_id: options.videoId,
    kind: options.kind,
    content_type: file.type || "application/octet-stream",
    extension: extensionFromFile(file),
  };

  const presignResponse = await fetch("/api/admin/uploads/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const presignJson = await presignResponse.json();
  if (!presignResponse.ok) {
    throw new Error(presignJson.error ?? "Failed to get upload URL");
  }

  const presign = presignUploadResponseSchema.parse(
    presignJson,
  ) satisfies PresignUploadResponse;

  const uploadResponse = await fetch(presign.upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": body.content_type,
    },
    body: file,
  }).catch((err) => {
    throw new Error(
      err instanceof TypeError
        ? "Upload blocked by R2 CORS. Run `bun run configure:r2-cors` (see .env.example for R2_CORS_ORIGINS)."
        : err instanceof Error
          ? err.message
          : "Upload failed",
    );
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed (${uploadResponse.status})`);
  }

  return presign.public_url;
}
