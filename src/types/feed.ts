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
  followerCount?: number;
  comments: FeedComment[];
};

export type StudyFeedVideo = FeedVideo & {
  position: number;
  video_id: string;
  video_type: "ingroup" | "filler";
  show_learn_more: boolean;
  show_interest_prompt: boolean;
};

export type FeedCondition =
  | "placebo"
  | "state-media"
  | "culture"
  | "economy"
  | "politics";
