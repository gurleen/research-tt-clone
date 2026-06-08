import type { PlaylistItem } from "../shared/api/types.ts";
import type { StudyFeedVideo } from "../types/feed.ts";

export function mapPlaylistItem(item: PlaylistItem): StudyFeedVideo {
  return {
    id: item.video_id,
    videoUrl: item.media_url,
    thumbnailUrl: item.attribution.profile_thumbnail_url,
    creator: {
      username: item.attribution.account_handle,
      avatarUrl: item.attribution.profile_thumbnail_url,
    },
    caption: item.attribution.account_name,
    audioTrack: "original sound",
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    comments: [],
    position: item.position,
    video_id: item.video_id,
    video_type: item.video_type,
    show_learn_more: item.show_learn_more,
    show_interest_prompt: item.show_interest_prompt,
  };
}

export function mapPlaylist(items: PlaylistItem[]): StudyFeedVideo[] {
  return items.map(mapPlaylistItem);
}
