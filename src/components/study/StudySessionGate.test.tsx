import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const studyState = {
  state: "complete" as "loading" | "ready" | "error" | "complete",
  error: null as string | null,
  session: {
    demo_mode: false,
  },
  handoffUrl: null as string | null,
  allowRestart: true,
  restartSession: async () => {},
};

mock.module("../../study/session-context.tsx", () => ({
  useStudySession: () => studyState,
}));

const { StudySessionGate } = await import("./StudySessionGate.tsx");

function renderGate(): string {
  return renderToStaticMarkup(
    <StudySessionGate>
      <div>feed</div>
    </StudySessionGate>,
  );
}

describe("StudySessionGate", () => {
  test("complete screen shows a Restart button with the thank-you copy", () => {
    studyState.state = "complete";
    studyState.handoffUrl = null;
    studyState.allowRestart = true;
    const html = renderGate();
    expect(html).toContain("Session complete");
    expect(html).toContain(
      "You have finished the playlist. Thank you for participating.",
    );
    expect(html).toContain("Restart");
    expect(html).not.toContain("feed");
  });

  test("survey handoff does not show Restart", () => {
    studyState.state = "complete";
    studyState.handoffUrl = "https://survey.example.com";
    studyState.allowRestart = true;
    const html = renderGate();
    expect(html).toContain("Continuing to survey…");
    expect(html).not.toContain("Restart");
  });

  test("hides Restart when the complete screen is not allowed to restart", () => {
    studyState.state = "complete";
    studyState.handoffUrl = null;
    studyState.allowRestart = false;
    const html = renderGate();
    expect(html).toContain("Session complete");
    expect(html).not.toContain("Restart");
  });
});
