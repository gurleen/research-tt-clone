import type { CatalogComment, PlaylistItem } from "../shared/api/types.ts";
import type { FeedComment, StudyFeedVideo } from "../types/feed.ts";

export function mapPlaylistItem(item: PlaylistItem): StudyFeedVideo {
  const comments = mapComments(item.video_id, item.comments);
  const caption = item.caption.trim() || item.attribution.account_name;

  return {
    id: item.video_id,
    videoUrl: item.media_url,
    thumbnailUrl: item.attribution.profile_thumbnail_url,
    creator: {
      username: item.attribution.account_handle,
      avatarUrl: item.attribution.profile_thumbnail_url,
    },
    caption,
    audioTrack: "original sound",
    likeCount: item.like_count,
    commentCount:
      item.comment_count > 0 ? item.comment_count : comments.length,
    shareCount: item.share_count,
    saveCount: item.save_count,
    followerCount: item.follower_count,
    comments,
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

function mapComments(
  videoId: string,
  comments: CatalogComment[],
): FeedComment[] {
  return comments.map((comment, index) => ({
    id: `${videoId}-${index}`,
    username: comment.username,
    text: comment.text,
    ...(comment.timestamp ? { timestamp: comment.timestamp } : {}),
  }));
}
