import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopNav } from "./TopNav";
import { LAYOUT } from "../../utils/layout";

type MobileShellProps = {
  children: ReactNode;
};

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
      <div
        className={`relative ${LAYOUT.phoneWidth} w-full h-[100dvh] bg-black overflow-hidden shadow-2xl`}
      >
        <TopNav />
        <main className="absolute inset-0">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
