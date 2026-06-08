import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { env, isR2Configured } from "../../config/env.ts";
import { getR2Client } from "./client.ts";

const DEFAULT_ORIGINS = ["http://localhost:3000"];

export function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return DEFAULT_ORIGINS;
  }

  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : DEFAULT_ORIGINS;
}

/** Apply CORS rules so browser PUTs to presigned R2 URLs succeed. */
export async function configureR2Cors(
  origins: string[] = DEFAULT_ORIGINS,
): Promise<void> {
  if (!isR2Configured()) {
    throw new Error(
      "R2 is not configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_BASE_URL in .env",
    );
  }

  await getR2Client().send(
    new PutBucketCorsCommand({
      Bucket: env.r2.bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "HEAD"],
            AllowedOrigins: origins,
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
}
