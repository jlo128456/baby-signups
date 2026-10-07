import { useState } from "react";
import { IS_DEMO } from "../config";
import { DEMO_LOGIN } from "../data/testData";
import { api } from "../services/api";

export function Login({ onSignedIn, onCancel }) {
  const [email, setEmail] = useState(IS_DEMO ? DEMO_LOGIN.email : "");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!navigator.onLine) {
      setErr("You need an internet connection to sign in.");
      return;
    }
    setBusy(true);
    const r = await api.login(email.trim(), password);
    setBusy(false);
    if (r.ok) onSignedIn(r.data.staff);
    else setErr(r.error);
  }

  return (
    <form onSubmit={submit} className="login" noValidate>
      <div className="stack">
        <h2>Team sign in</h2>
        <p className="muted">
          The team desk and Packages &amp; settings are password-protected. For Amanda, Laura, Richard and anyone else on the
          team.
        </p>
      </div>
      <div className="field">
        <label htmlFor="l-email">Email</label>
        <input id="l-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="l-pass">Password</label>
        <input id="l-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {err && (
        <p className="notice" role="alert">
          {err}
        </p>
      )}
      <div className="toolbar">
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <button className="btn link" type="button" onClick={onCancel}>
          Back to sign-up form
        </button>
      </div>
    </form>
  );
}
