import { describe, expect, test } from "bun:test";
import { mapPlaylistItem } from "./map-playlist-item.ts";

describe("mapPlaylistItem", () => {
  test("maps API playlist item to study feed video", () => {
    const mapped = mapPlaylistItem({
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
      show_learn_more: true,
      show_interest_prompt: false,
    });

    expect(mapped.id).toBe("ingroup_sikh_micro_01");
    expect(mapped.videoUrl).toBe("https://example.com/video.webm");
    expect(mapped.creator.username).toBe("@creator");
    expect(mapped.show_learn_more).toBe(true);
    expect(mapped.show_interest_prompt).toBe(false);
    expect(mapped.position).toBe(0);
  });
});
