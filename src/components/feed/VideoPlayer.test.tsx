import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { VideoPlayer } from "./VideoPlayer.tsx";

describe("VideoPlayer", () => {
  test("uses the catalog src on the first load", () => {
    const html = renderToStaticMarkup(
      <VideoPlayer
        src="https://cdn.example.com/a.mp4"
        isActive
        userPaused={false}
        onTimeUpdate={() => undefined}
        onLoop={() => undefined}
        onPlayingChange={() => undefined}
      />,
    );

    expect(html).toContain('src="https://cdn.example.com/a.mp4"');
    expect(html).not.toContain("_r=");
  });
});
