import type { FeedComment } from "../../types/feed";

type CommentItemProps = {
  comment: FeedComment;
};

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="py-3 border-b border-white/10">
      <p className="text-white font-semibold text-sm">@{comment.username}</p>
      <p className="text-white/90 text-sm mt-0.5">{comment.text}</p>
      {comment.timestamp && (
        <p className="text-white/50 text-xs mt-1">{comment.timestamp}</p>
      )}
    </div>
  );
}
