import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { adminNavItems } from "../nav.ts";
import { useAdminAuth } from "../auth/AdminAuthProvider.tsx";
import {
  adminShellClassName,
  useAdminAppearance,
  type AdminAppearance,
} from "../lib/appearance.ts";
import { getAdminConfig } from "../lib/supabase-browser.ts";
import { Badge } from "../../components/ui/badge.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Label } from "../../components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.tsx";

type AdminSidebarProps = {
  appearance: AdminAppearance;
  onAppearanceChange: (appearance: AdminAppearance) => void;
};

export function AdminSidebar({
  appearance,
  onAppearanceChange,
}: AdminSidebarProps) {
  const { session, signOut } = useAdminAuth();
  const [stagingMode, setStagingMode] = useState<boolean | null>(null);

  useEffect(() => {
    getAdminConfig()
      .then((config) => setStagingMode(config.staging_mode))
      .catch(() => setStagingMode(null));
  }, []);

  const userEmail = session?.user.email;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Research Admin
        </p>
        <h1 className="text-lg font-semibold text-zinc-900">Experiment Platform</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              [
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-3 border-t border-zinc-200 p-4">
        {userEmail && (
          <p
            className="truncate text-sm text-zinc-700"
            title={userEmail}
          >
            {userEmail}
          </p>
        )}

        {stagingMode !== null && (
          <Badge
            variant="secondary"
            className={
              stagingMode ? "bg-amber-100 text-amber-900" : undefined
            }
          >
            {stagingMode ? "Staging" : "Production"}
          </Badge>
        )}

        <div className="space-y-2">
          <Label htmlFor="admin-appearance">Appearance</Label>
          <Select
            value={appearance}
            onValueChange={(value) =>
              onAppearanceChange(value as AdminAppearance)
            }
          >
            <SelectTrigger id="admin-appearance">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="auto">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="w-full" onClick={() => signOut()}>
          Sign out
        </Button>
        <Link
          to="/"
          className="block text-center text-xs text-zinc-500 hover:text-zinc-800"
        >
          Back to participant app
        </Link>
      </div>
    </aside>
  );
}

export function AdminLayout() {
  const { appearance, setAppearance, isDark } = useAdminAppearance();

  return (
    <div
      className={adminShellClassName(
        isDark,
        "admin-shell flex bg-zinc-50 text-zinc-900",
      )}
    >
      <AdminSidebar
        appearance={appearance}
        onAppearanceChange={setAppearance}
      />
      <main className="min-h-0 flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
