import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { FeedVideo } from "../../types/feed.ts";
import { SideActions } from "./SideActions.tsx";

function video(overrides: Partial<FeedVideo> = {}): FeedVideo {
  return {
    id: "v1",
    videoUrl: "https://example.com/video.webm",
    creator: { username: "creator" },
    caption: "hello",
    audioTrack: "original sound",
    likeCount: 10,
    commentCount: 2,
    shareCount: 1,
    saveCount: 0,
    comments: [],
    ...overrides,
  };
}

describe("SideActions", () => {
  test("shows catalog follower counts for ingroup and filler chrome", () => {
    const ingroup = renderToStaticMarkup(
      <SideActions
        video={video({ followerCount: 8800, videoUrl: "ingroup" })}
        liked={false}
        onToggleLike={() => undefined}
        onOpenComments={() => undefined}
      />,
    );
    const filler = renderToStaticMarkup(
      <SideActions
        video={video({ followerCount: 312, videoUrl: "filler" })}
        liked={false}
        onToggleLike={() => undefined}
        onOpenComments={() => undefined}
      />,
    );

    expect(ingroup).toContain("8.8K");
    expect(filler).toContain("312");
  });
});
