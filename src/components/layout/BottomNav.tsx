import { LAYOUT, Z } from "../../utils/layout";

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="7" r="3" />
      <path d="M3 21v-1a5 5 0 015-5h2a5 5 0 015 5v1M14 21v-1a4 4 0 014-4h1" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" />
    </svg>
  );
}

export function BottomNav() {
  return (
    <nav
      className={`absolute bottom-0 inset-x-0 ${LAYOUT.bottomNavHeight} flex items-center justify-around px-2 text-white bg-black border-t border-white/10`}
      style={{ zIndex: Z.bottomNav }}
    >
      <button type="button" aria-label="Home">
        <HomeIcon active />
      </button>
      <button type="button" className="opacity-70" aria-label="Friends">
        <FriendsIcon />
      </button>
      <button
        type="button"
        className="w-12 h-8 flex items-center justify-center bg-white/10 rounded-lg border border-white/20"
        aria-label="Create"
      >
        <span className="text-xl leading-none font-light">+</span>
      </button>
      <button type="button" className="opacity-70" aria-label="Inbox">
        <InboxIcon />
      </button>
      <button type="button" className="opacity-70" aria-label="Profile">
        <ProfileIcon />
      </button>
    </nav>
  );
}
