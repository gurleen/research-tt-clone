import { describe, expect, test } from "bun:test";
import type { PlaylistItem } from "../shared/api/types.ts";
import { mapPlaylistItem } from "./map-playlist-item.ts";

function playlistItem(overrides: Partial<PlaylistItem> = {}): PlaylistItem {
  return {
    position: 0,
    video_id: "ingroup_sikh_micro_01",
    video_type: "ingroup",
    media_url: "https://example.com/video.webm",
    duration_ms: 12000,
    attribution: {
      account_name: "Creator",
      account_handle: "@creator",
      profile_thumbnail_url: "https://example.com/thumb.jpg",
    },
    caption: "A real caption",
    like_count: 1200,
    comment_count: 0,
    follower_count: 4400,
    share_count: 10,
    save_count: 3,
    comments: [{ username: "fan", text: "hello", timestamp: "2d ago" }],
    show_learn_more: true,
    show_interest_prompt: false,
    ...overrides,
  };
}

describe("mapPlaylistItem", () => {
  test("maps API playlist item to study feed video", () => {
    const mapped = mapPlaylistItem(playlistItem());

    expect(mapped.id).toBe("ingroup_sikh_micro_01");
    expect(mapped.videoUrl).toBe("https://example.com/video.webm");
    expect(mapped.creator.username).toBe("@creator");
    expect(mapped.caption).toBe("A real caption");
    expect(mapped.likeCount).toBe(1200);
    expect(mapped.shareCount).toBe(10);
    expect(mapped.saveCount).toBe(3);
    expect(mapped.followerCount).toBe(4400);
    expect(mapped.show_learn_more).toBe(true);
    expect(mapped.show_interest_prompt).toBe(false);
    expect(mapped.position).toBe(0);
  });

  test("falls back to account_name when caption is blank", () => {
    const mapped = mapPlaylistItem(playlistItem({ caption: "   " }));
    expect(mapped.caption).toBe("Creator");
  });

  test("uses comments length when comment_count is 0", () => {
    const mapped = mapPlaylistItem(
      playlistItem({
        comment_count: 0,
        comments: [
          { username: "a", text: "one" },
          { username: "b", text: "two" },
        ],
      }),
    );
    expect(mapped.commentCount).toBe(2);
    expect(mapped.comments).toEqual([
      { id: "ingroup_sikh_micro_01-0", username: "a", text: "one" },
      { id: "ingroup_sikh_micro_01-1", username: "b", text: "two" },
    ]);
  });

  test("uses comment_count as display baseline when set", () => {
    const mapped = mapPlaylistItem(
      playlistItem({
        comment_count: 2300,
        comments: [{ username: "fan", text: "hello" }],
      }),
    );
    expect(mapped.commentCount).toBe(2300);
    expect(mapped.comments).toHaveLength(1);
  });
});
