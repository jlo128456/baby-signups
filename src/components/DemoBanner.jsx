import { useState } from "react";
import { DEMO_LOGIN } from "../data/testData";
import { resetDemo } from "../services/demoApi";

/**
 * Shown only in demo mode.
 * On phones it starts as one slim line; tap it to see the demo login and buttons.
 */
export function DemoBanner({ signedIn, onTryTeam }) {
  const [open, setOpen] = useState(() => window.matchMedia?.("(min-width: 601px)").matches ?? true);

  return (
    <div className={`demo${open ? " open" : ""}`} role="note">
      <button className="demo-toggle" type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <b>Demo mode</b>
        <span className="demo-short">· test data on this device</span>
        <span className="chev" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="demo-body">
          <p>
            Test data, saved in this browser only. Nothing is emailed or sent to a server.
            <br />
            Team login: <code>{DEMO_LOGIN.email}</code> / <code>{DEMO_LOGIN.password}</code>
          </p>
          <div className="demo-actions">
            {!signedIn && (
              <button className="btn small" type="button" onClick={onTryTeam}>
                Try the team desk
              </button>
            )}
            <button
              className="btn ghost small"
              type="button"
              onClick={() => {
                resetDemo();
                window.location.reload();
              }}
            >
              Reset demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
