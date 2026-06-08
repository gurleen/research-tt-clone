import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";

export function Alert({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        variant === "default" && "border-zinc-200 bg-zinc-50 text-zinc-900",
        variant === "destructive" &&
          "border-red-200 bg-red-50 text-red-900",
        className,
      )}
      {...props}
    />
  );
}
