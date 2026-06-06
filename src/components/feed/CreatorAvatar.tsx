type CreatorAvatarProps = {
  username: string;
  avatarUrl?: string;
};

export function CreatorAvatar({ username, avatarUrl }: CreatorAvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-neutral-700 flex items-center justify-center">
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white text-xs font-bold">{initials}</span>
      )}
    </div>
  );
}
