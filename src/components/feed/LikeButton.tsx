import { ActionButton } from "./ActionButton";

type LikeButtonProps = {
  count: number;
  liked: boolean;
  onToggle: () => void;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export function LikeButton({ count, liked, onToggle }: LikeButtonProps) {
  return (
    <ActionButton
      icon={<HeartIcon filled={liked} />}
      count={liked ? count + 1 : count}
      onClick={onToggle}
      active={liked}
      label="Like"
    />
  );
}
