import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-zinc-900 text-white",
        variant === "secondary" && "bg-zinc-100 text-zinc-800",
        variant === "outline" && "border border-zinc-300 text-zinc-700",
        className,
      )}
      {...props}
    />
  );
}
