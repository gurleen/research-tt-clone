import { LAYOUT, Z } from "../../utils/layout";

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

const tabs = ["Explore", "Following", "For You"] as const;

export function TopNav() {
  return (
    <nav
      className={`absolute top-0 inset-x-0 ${LAYOUT.topNavHeight} flex items-center justify-between px-4 text-white z-[${Z.topNav}] bg-black/20 backdrop-blur-sm`}
      style={{ zIndex: Z.topNav }}
    >
      <button type="button" className="opacity-90" aria-label="Menu">
        <MenuIcon />
      </button>

      <div className="flex gap-4 text-sm font-medium">
        {tabs.map((tab) => (
          <span
            key={tab}
            className={
              tab === "For You"
                ? "font-bold border-b-2 border-white pb-0.5"
                : "opacity-60"
            }
          >
            {tab}
          </span>
        ))}
      </div>

      <button type="button" className="opacity-90" aria-label="Search">
        <SearchIcon />
      </button>
    </nav>
  );
}
