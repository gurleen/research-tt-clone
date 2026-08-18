import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CreatorAvatar } from "./CreatorAvatar.tsx";

describe("CreatorAvatar", () => {
  test("renders a compact follower count under the avatar", () => {
    const html = renderToStaticMarkup(
      <CreatorAvatar username="creator" followerCount={4400} />,
    );

    expect(html).toContain("4.4K");
    expect(html).toContain("4.4K followers");
  });

  test("omits the count when followerCount is missing", () => {
    const html = renderToStaticMarkup(<CreatorAvatar username="creator" />);

    expect(html).not.toContain("followers");
    expect(html).not.toContain("4.4K");
  });

  test("does not wrap the avatar or count in a profile link", () => {
    const html = renderToStaticMarkup(
      <CreatorAvatar
        username="creator"
        avatarUrl="https://example.com/thumb.jpg"
        followerCount={12_400}
      />,
    );

    expect(html).not.toMatch(/<a[\s>]/);
    expect(html).not.toContain("<button");
  });
});
