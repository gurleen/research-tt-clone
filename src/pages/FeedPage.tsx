import { VideoFeed } from "../components/feed/VideoFeed";
import { MobileShell } from "../components/layout/MobileShell";

export function FeedPage() {
  return (
    <MobileShell>
      <VideoFeed />
    </MobileShell>
  );
}
