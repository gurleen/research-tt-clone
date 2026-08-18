import { ActionButton } from "./ActionButton";
import { CommentButton } from "./CommentButton";
import { CreatorAvatar } from "./CreatorAvatar";
import { LikeButton } from "./LikeButton";
import type { FeedVideo } from "../../types/feed";

type SideActionsProps = {
  video: FeedVideo;
  liked: boolean;
  onToggleLike: () => void;
  onOpenComments: () => void;
};

function BookmarkIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export function SideActions({
  video,
  liked,
  onToggleLike,
  onOpenComments,
}: SideActionsProps) {
  return (
    <div className="absolute right-3 above-bottom-nav-lg flex flex-col items-center gap-5 z-10">
      <CreatorAvatar
        username={video.creator.username}
        avatarUrl={video.creator.avatarUrl}
        followerCount={video.followerCount}
      />
      <LikeButton
        count={video.likeCount}
        liked={liked}
        onToggle={onToggleLike}
      />
      <CommentButton count={video.commentCount} onOpen={onOpenComments} />
      <ActionButton
        icon={<BookmarkIcon />}
        count={video.saveCount}
        label="Save"
      />
      <ActionButton
        icon={<ShareIcon />}
        count={video.shareCount}
        label="Share"
      />
    </div>
  );
}
