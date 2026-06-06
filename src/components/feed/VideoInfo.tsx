import type { FeedVideo } from "../../types/feed";

type VideoInfoProps = {
  video: FeedVideo;
};

export function VideoInfo({ video }: VideoInfoProps) {
  const tags = video.hashtags ?? [];

  return (
    <div className="absolute above-bottom-nav-sm left-3 right-20 text-white text-left pointer-events-none">
      <p className="font-bold text-base mb-1 drop-shadow">@{video.creator.username}</p>
      <p className="text-sm mb-1 drop-shadow line-clamp-2">{video.caption}</p>
      {tags.length > 0 && (
        <p className="text-sm drop-shadow">
          {tags.map((tag) => (
            <span key={tag} className="mr-1">
              #{tag}
            </span>
          ))}
        </p>
      )}
      <p className="text-xs mt-2 flex items-center gap-1 opacity-90 drop-shadow truncate">
        <span>♫</span>
        <span className="truncate">{video.audioTrack}</span>
      </p>
    </div>
  );
}
