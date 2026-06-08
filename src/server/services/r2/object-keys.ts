import type { PresignUploadBody } from "../../../shared/api/admin-schemas.ts";

export function stimulusObjectKey(
  videoId: string,
  kind: PresignUploadBody["kind"],
  extension: string,
): string {
  return `stimulus/${videoId}/${kind}.${extension}`;
}

export function stimulusPrefix(videoId: string): string {
  return `stimulus/${videoId}/`;
}
