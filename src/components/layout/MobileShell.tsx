import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";

type MobileShellProps = {
  children: ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="relative app-shell bg-black overflow-hidden">
      <TopNav />
      <main className="absolute inset-0">{children}</main>
      <BottomNav />
    </div>
  );
}
