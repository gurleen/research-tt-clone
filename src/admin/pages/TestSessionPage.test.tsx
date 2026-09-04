import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { TestSessionPage } from "./TestSessionPage.tsx";

describe("TestSessionPage", () => {
  test("shows a demo mode switch on session create", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <TestSessionPage />
      </MemoryRouter>,
    );
    expect(html).toContain("Demo mode");
    expect(html).toContain('role="switch"');
    expect(html).toContain("reusable after the playlist finishes");
  });
});
