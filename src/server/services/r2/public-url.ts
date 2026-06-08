import { env } from "../../config/env.ts";
import { ApiError } from "../../lib/http.ts";

const PRIVATE_R2_HOST = "r2.cloudflarestorage.com";

/** R2_PUBLIC_BASE_URL must be a public bucket URL (r2.dev or custom domain), not the S3 API endpoint. */
export function validatePublicBaseUrl(baseUrl: string): void {
  let hostname: string;
  try {
    hostname = new URL(baseUrl).hostname;
  } catch {
    throw new ApiError(
      503,
      "R2_PUBLIC_BASE_URL is not a valid URL. Use your bucket's public r2.dev URL or custom domain (see .env.example).",
    );
  }

  if (hostname.endsWith(PRIVATE_R2_HOST)) {
    throw new ApiError(
      503,
      "R2_PUBLIC_BASE_URL must not use r2.cloudflarestorage.com — that endpoint requires signed requests. In Cloudflare: R2 → bucket → Settings → Public access → enable r2.dev, then set R2_PUBLIC_BASE_URL to the pub-….r2.dev URL.",
    );
  }
}

export function buildPublicObjectUrl(key: string): string {
  validatePublicBaseUrl(env.r2.publicBaseUrl);
  return `${env.r2.publicBaseUrl}/${key}`;
}
