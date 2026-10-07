import { TabBar } from "./TabBar";

/**
 * Page heading.
 * - Customers see the full welcome text.
 * - Signed-in team on the desk or settings get a short heading, so the work fits on a phone screen.
 * - The team tabs sit here on tablets and computers; on phones they move to a bar at the bottom (see TabBar).
 */
export function Header({ staff, tab, onTab, onSignOut }) {
  const compact = staff && tab !== "form";

  return (
    <header className={compact ? "compact" : undefined}>
      <div className="headrow">
        <p className="label">{compact ? "Team" : "Register your interest"}</p>
        {staff && (
          <button className="btn ghost small signout" type="button" onClick={onSignOut}>
            Sign out {staff.name}
          </button>
        )}
      </div>

      {compact ? (
        <h1>{tab === "desk" ? "Team desk" : "Packages & settings"}</h1>
      ) : (
        <>
          <h1>Tell us when your baby is due</h1>
          <p className="muted intro">
            Leave your details and the dates that matter. Amanda, Laura or Richard from our team will be in touch personally.
          </p>
        </>
      )}

      {staff && <TabBar tab={tab} onTab={onTab} placement="top" />}
    </header>
  );
}
