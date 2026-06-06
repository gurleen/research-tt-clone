export type FeedComment = {
  id: string;
  username: string;
  text: string;
  timestamp?: string;
};

export type FeedVideo = {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  creator: {
    username: string;
    avatarUrl?: string;
  };
  caption: string;
  hashtags?: string[];
  audioTrack: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount?: number;
  comments: FeedComment[];
};

export type FeedCondition =
  | "placebo"
  | "state-media"
  | "culture"
  | "economy"
  | "politics";
