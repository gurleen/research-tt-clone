import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, isR2Configured } from "../../config/env.ts";
import { ApiError } from "../../lib/http.ts";
import type { PresignUploadBody } from "../../../shared/api/admin-schemas.ts";
import { getR2Client } from "./client.ts";

export async function presignUpload(
  body: PresignUploadBody,
): Promise<{ upload_url: string; public_url: string; key: string }> {
  if (!isR2Configured()) {
    throw new ApiError(
      503,
      "R2 is not configured — add R2_* variables to .env",
    );
  }

  const key = `stimulus/${body.video_id}/${body.kind}.${body.extension}`;

  const command = new PutObjectCommand({
    Bucket: env.r2.bucketName,
    Key: key,
    ContentType: body.content_type,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: 60 * 15,
  });

  const publicUrl = `${env.r2.publicBaseUrl}/${key}`;

  return {
    upload_url: uploadUrl,
    public_url: publicUrl,
    key,
  };
}
