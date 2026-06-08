import { db } from "../../db/client.ts";
import { ApiError } from "../../lib/http.ts";
import { deleteObjectsUnderPrefix } from "../r2/delete-video-objects.ts";
import { stimulusPrefix } from "../r2/object-keys.ts";

export type DeactivateVideoResult = {
  video_id: string;
  active: false;
  r2_deleted: boolean;
  objects_removed: number;
};

export async function deactivateVideo(
  videoId: string,
): Promise<DeactivateVideoResult> {
  const { data: video, error: loadError } = await db
    .from("videos")
    .select("video_id, active")
    .eq("video_id", videoId)
    .maybeSingle();

  if (loadError) {
    throw new Error(`Failed to load video: ${loadError.message}`);
  }
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.active) {
    return {
      video_id: videoId,
      active: false,
      r2_deleted: false,
      objects_removed: 0,
    };
  }

  const { count, error: countError } = await db
    .from("session_videos")
    .select("*", { count: "exact", head: true })
    .eq("video_id", videoId);

  if (countError) {
    throw new Error(`Failed to check session usage: ${countError.message}`);
  }

  const usedInSession = (count ?? 0) > 0;

  const { error: updateError } = await db
    .from("videos")
    .update({ active: false })
    .eq("video_id", videoId);

  if (updateError) {
    throw new Error(`Failed to deactivate video: ${updateError.message}`);
  }

  let objectsRemoved = 0;
  let r2Deleted = false;

  if (!usedInSession) {
    objectsRemoved = await deleteObjectsUnderPrefix(stimulusPrefix(videoId));
    r2Deleted = objectsRemoved > 0;
  }

  return {
    video_id: videoId,
    active: false,
    r2_deleted: r2Deleted,
    objects_removed: objectsRemoved,
  };
}

export type ReactivateVideoResult = {
  video_id: string;
  active: true;
};

export async function reactivateVideo(
  videoId: string,
): Promise<ReactivateVideoResult> {
  const { data: video, error: loadError } = await db
    .from("videos")
    .select("video_id, active")
    .eq("video_id", videoId)
    .maybeSingle();

  if (loadError) {
    throw new Error(`Failed to load video: ${loadError.message}`);
  }
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.active) {
    return { video_id: videoId, active: true };
  }

  const { error: updateError } = await db
    .from("videos")
    .update({ active: true })
    .eq("video_id", videoId);

  if (updateError) {
    throw new Error(`Failed to reactivate video: ${updateError.message}`);
  }

  return { video_id: videoId, active: true };
}
