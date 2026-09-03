import type { ReactNode } from "react";
import { Card } from "../../components/ui/card.tsx";
import { adminShellClassName, useAdminAppearance } from "../lib/appearance.ts";

export function AdminAuthShell({ children }: { children: ReactNode }) {
  const { isDark } = useAdminAppearance();

  return (
    <div
      className={adminShellClassName(
        isDark,
        "admin-shell-scroll flex min-h-full items-center justify-center p-6",
      )}
    >
      <Card className="w-full max-w-md">{children}</Card>
    </div>
  );
}
