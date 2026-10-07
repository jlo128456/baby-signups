/**
 * Team tabs.
 * placement="top":    pill tabs under the heading (tablets and computers).
 * placement="bottom": app-style bar fixed to the bottom of the screen (phones).
 * CSS shows the right one for the screen size, so both can be rendered.
 */
const TABS = [
  { key: "form", label: "Sign up", short: "Sign up", icon: "M12 5v14M5 12h14" },
  { key: "desk", label: "Team desk", short: "Desk", icon: "M4 6h16M4 12h16M4 18h10" },
  {
    key: "settings",
    label: "Packages & settings",
    short: "Settings",
    icon: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 13a7.5 7.5 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.5 7.5 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4z",
  },
];

export function TabBar({ tab, onTab, placement, badge = {} }) {
  if (placement === "bottom") {
    return (
      <nav className="tabbar" aria-label="Team sections">
        {TABS.map((t) => (
          <button key={t.key} type="button" aria-current={tab === t.key ? "page" : undefined} onClick={() => onTab(t.key)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={t.icon} />
            </svg>
            <span>{t.short}</span>
            {badge[t.key] > 0 && <b className="badge">{badge[t.key]}</b>}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <div className="tabs" role="tablist">
      {TABS.map((t) => (
        <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => onTab(t.key)}>
          {t.label}
          {badge[t.key] > 0 && <b className="badge">{badge[t.key]}</b>}
        </button>
      ))}
    </div>
  );
}
