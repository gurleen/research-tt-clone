import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { isR2Configured } from "../../config/env.ts";
import { env } from "../../config/env.ts";
import { getR2Client } from "./client.ts";

export async function deleteObjectsUnderPrefix(
  prefix: string,
): Promise<number> {
  if (!isR2Configured()) {
    return 0;
  }

  const client = getR2Client();
  let removed = 0;
  let continuationToken: string | undefined;

  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: env.r2.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    const keys = (list.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => Boolean(key));

    if (keys.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: env.r2.bucketName,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      );
      removed += keys.length;
    }

    continuationToken = list.IsTruncated
      ? list.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return removed;
}
