import type { ChangeEvent, InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils.ts";
import { buttonVariants } from "./button.tsx";
import { Label } from "./label.tsx";

type FileInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "className"
> & {
  buttonLabel?: string;
  fileName?: string | null;
  emptyLabel?: string;
  className?: string;
};

export function FileInput({
  id,
  buttonLabel = "Choose file",
  fileName,
  emptyLabel = "No file chosen",
  disabled,
  className,
  onChange,
  ...props
}: FileInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Label
        htmlFor={id}
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "cursor-pointer font-medium",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        {buttonLabel}
      </Label>
      <input
        id={id}
        type="file"
        disabled={disabled}
        className="sr-only"
        onChange={handleChange}
        {...props}
      />
      <span
        className={cn(
          "min-w-0 flex-1 text-sm",
          fileName ? "text-zinc-900" : "text-zinc-500",
        )}
      >
        {fileName ?? emptyLabel}
      </span>
    </div>
  );
}
