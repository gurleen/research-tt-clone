import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LAYOUT } from "../../utils/layout.ts";
import { BottomNav } from "./BottomNav.tsx";
import { MobileShell } from "./MobileShell.tsx";
import { TopNav } from "./TopNav.tsx";

describe("MobileShell", () => {
  test("uses the feed frame class and does not force full viewport width", () => {
    const html = renderToStaticMarkup(
      <MobileShell>
        <span>feed</span>
      </MobileShell>,
    );

    expect(html).toContain("feed-frame-root");
    expect(html).toContain("app-shell");
    expect(html).not.toContain("w-full");
    expect(html).toContain("feed");
  });

  test("top and bottom chrome stretch to the shell, not the viewport", () => {
    const top = renderToStaticMarkup(<TopNav />);
    const bottom = renderToStaticMarkup(<BottomNav />);

    expect(top).toContain("top-nav");
    expect(top).toContain("inset-x-0");
    expect(bottom).toContain("bottom-nav");
    expect(bottom).toContain("inset-x-0");
  });

  test("desktop frame cap matches the CSS phone column", () => {
    expect(LAYOUT.feedFrameMaxWidthPx).toBe(430);
    expect(LAYOUT.feedFrameDesktopMinWidthPx).toBe(768);
  });
});
