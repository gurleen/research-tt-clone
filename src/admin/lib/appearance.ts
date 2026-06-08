import { useEffect, useState } from "react";

export type AdminAppearance = "light" | "dark" | "auto";

const STORAGE_KEY = "admin-appearance";

export function resolveAdminAppearance(
  appearance: AdminAppearance,
  prefersDark: boolean,
): boolean {
  if (appearance === "dark") return true;
  if (appearance === "light") return false;
  return prefersDark;
}

function readStoredAppearance(): AdminAppearance {
  if (typeof window === "undefined") return "auto";

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }

  return "auto";
}

function getPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useAdminAppearance() {
  const [appearance, setAppearanceState] = useState<AdminAppearance>(
    readStoredAppearance,
  );
  const [prefersDark, setPrefersDark] = useState(getPrefersDark);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function setAppearance(next: AdminAppearance) {
    localStorage.setItem(STORAGE_KEY, next);
    setAppearanceState(next);
  }

  const isDark = resolveAdminAppearance(appearance, prefersDark);

  return { appearance, setAppearance, isDark };
}

export function adminShellClassName(isDark: boolean, base = "admin-shell"): string {
  return isDark ? `${base} admin-dark` : base;
}
