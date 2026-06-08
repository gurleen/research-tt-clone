import { Navigate, useLocation } from "react-router";
import type { ReactNode } from "react";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import { adminShellClassName, useAdminAppearance } from "../lib/appearance.ts";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, session, isAdmin } = useAdminAuth();
  const { isDark } = useAdminAppearance();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className={adminShellClassName(
          isDark,
          "admin-shell flex h-full items-center justify-center text-zinc-600",
        )}
      >
        Loading…
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
