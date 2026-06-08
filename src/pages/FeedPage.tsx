import { VideoFeed } from "../components/feed/VideoFeed";
import { StudySessionGate } from "../components/study/StudySessionGate.tsx";
import { MobileShell } from "../components/layout/MobileShell";
import { StudySessionProvider } from "../study/session-context.tsx";

export function FeedPage() {
  return (
    <StudySessionProvider>
      <MobileShell>
        <StudySessionGate>
          <VideoFeed />
        </StudySessionGate>
      </MobileShell>
    </StudySessionProvider>
  );
}
