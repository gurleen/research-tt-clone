import type { ReactNode } from "react";
import { formatCount } from "../../utils/formatCount";

type ActionButtonProps = {
  icon: ReactNode;
  count?: number;
  onClick?: () => void;
  active?: boolean;
  label: string;
};

export function ActionButton({
  icon,
  count,
  onClick,
  active,
  label,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex flex-col items-center gap-1 ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <span className={active ? "text-red-500" : "text-white"}>{icon}</span>
      {count !== undefined && (
        <span className="text-white text-xs font-semibold drop-shadow">
          {formatCount(count)}
        </span>
      )}
    </button>
  );
}
