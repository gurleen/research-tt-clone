export type AdminNavItem = {
  label: string;
  path: string;
  description?: string;
};

export const adminNavItems: AdminNavItem[] = [
  {
    label: "Dashboard",
    path: "/admin",
    description: "Overview and quick links",
  },
  {
    label: "Videos",
    path: "/admin/videos",
    description: "Manage stimulus catalog",
  },
  {
    label: "Stub content",
    path: "/admin/stub-content",
    description: "Learn-more stub copy per community",
  },
  {
    label: "Experiment config",
    path: "/admin/experiment-config",
    description: "Playlist counts and prompt rules",
  },
  {
    label: "Survey & debrief",
    path: "/admin/handoff-settings",
    description: "Survey URL and debrief page copy",
  },
];
