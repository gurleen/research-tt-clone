import type { StudyFeedVideo } from "../../types/feed";
import { LearnMoreLink } from "../study/LearnMoreLink.tsx";
import type { PlatformApiClient } from "../../client/platform-api.ts";

type VideoInfoProps = {
  video: StudyFeedVideo;
  sessionId?: string;
  client?: PlatformApiClient;
};

export function VideoInfo({ video, sessionId, client }: VideoInfoProps) {
  const tags = video.hashtags ?? [];

  return (
    <div className="absolute above-bottom-nav-sm left-3 right-20 text-left text-white pointer-events-none">
      <p className="mb-1 text-base font-bold drop-shadow">
        @{video.creator.username}
      </p>
      <p className="mb-1 line-clamp-2 text-sm drop-shadow">{video.caption}</p>
      {tags.length > 0 && (
        <p className="text-sm drop-shadow">
          {tags.map((tag) => (
            <span key={tag} className="mr-1">
              #{tag}
            </span>
          ))}
        </p>
      )}
      {video.show_learn_more && sessionId && client && (
        <LearnMoreLink
          sessionId={sessionId}
          videoId={video.video_id}
          client={client}
        />
      )}
      <p className="mt-2 flex items-center gap-1 truncate text-xs opacity-90 drop-shadow">
        <span>♫</span>
        <span className="truncate">{video.audioTrack}</span>
      </p>
    </div>
  );
}
