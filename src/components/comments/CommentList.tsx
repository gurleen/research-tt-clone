import { CommentItem } from "./CommentItem";
import type { FeedComment } from "../../types/feed";

type CommentListProps = {
  comments: FeedComment[];
};

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-white/60 text-sm text-center py-8">No comments yet</p>
    );
  }

  return (
    <div>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
