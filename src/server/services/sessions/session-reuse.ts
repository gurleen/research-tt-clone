export type SessionReuseFields = {
  demo_mode: boolean;
  status: string;
};

export function isSessionLinkReusable(session: SessionReuseFields): boolean {
  return session.demo_mode || session.status === "in_progress";
}

export function shouldReplayDemoSession(session: SessionReuseFields): boolean {
  return session.demo_mode && session.status !== "in_progress";
}
