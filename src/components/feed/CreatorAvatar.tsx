import { formatCount } from "../../utils/formatCount";

type CreatorAvatarProps = {
  username: string;
  avatarUrl?: string;
  followerCount?: number;
};

export function CreatorAvatar({
  username,
  avatarUrl,
  followerCount,
}: CreatorAvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();
  const formattedFollowers =
    followerCount === undefined ? undefined : formatCount(followerCount);

  return (
    <div className="flex w-12 flex-col items-center">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-neutral-700">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold text-white">{initials}</span>
        )}
      </div>
      {formattedFollowers !== undefined && (
        <span
          className="mt-1 w-full truncate text-center text-[10px] font-semibold leading-none text-white drop-shadow"
          aria-label={`${formattedFollowers} followers`}
        >
          {formattedFollowers}
        </span>
      )}
    </div>
  );
}
