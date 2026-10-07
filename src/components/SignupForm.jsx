import { useState } from "react";
import { api, newId } from "../services/api";
import { bumpNote, fmtDate } from "../lib/dates";
import { useToast } from "../lib/toast";

const blank = {
  name: "",
  email: "",
  phone: "",
  postcode: "",
  baby_due: "",
  delivery_date: "",
  package_id: "",
  subscribe: false,
  notes: "",
  consent: false,
  website: "", // hidden spam trap
};

/** Adds the customer's email to a Shopify cart link so checkout starts pre-filled. */
function withEmail(url, email) {
  if (!url || !email || !/\/cart\//.test(url)) return url;
  return url + (url.includes("?") ? "&" : "?") + "checkout[email]=" + encodeURIComponent(email);
}

export function SignupForm({ packages, isStaff, onSaved }) {
  const toast = useToast();
  const [v, setV] = useState(blank);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));
  const note = bumpNote(v.baby_due, v.delivery_date);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    const miss = [];
    if (!v.name.trim()) miss.push("your name");
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) miss.push("a valid email address");
    if (!v.baby_due) miss.push("the baby's due date");
    if (!v.delivery_date) miss.push("a delivery date");
    if (!v.consent) miss.push("your OK for us to contact you");
    if (miss.length) {
      setErr("Please add " + miss.join(", ") + ".");
      return;
    }

    setBusy(true);
    const lead = {
      id: newId(),
      name: v.name.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      postcode: v.postcode.trim(),
      baby_due: v.baby_due,
      delivery_date: v.delivery_date,
      package_id: v.package_id || null,
      subscribe: v.subscribe,
      notes: v.notes.trim(),
      consent: v.consent,
      source: isStaff ? "team" : "form",
      created_at: new Date().toISOString(),
      website: v.website,
    };
    // Saves to local storage (see services/localStore.js)
    const r = await api.signup(lead);
    setBusy(false);

    if (!r.ok) {
      setErr(r.error || "That didn't save. Check the details and try again.");
      return;
    }
    if (onSaved) onSaved();
    if (isStaff) {
      toast("Enquiry added");
      setV(blank);
    } else {
      setDone({ lead: v });
    }
  }

  if (done) {
    const p = packages.find((x) => x.id === done.lead.package_id);
    const url = p ? withEmail(p.checkout_url, done.lead.email) : "";
    return (
      <div className="done">
        <h2>Thanks, we've got your details</h2>
        <p className="muted">
          We'll be in touch at {done.lead.email} before your delivery date of {fmtDate(done.lead.delivery_date)}.
          {p && ` You chose ${p.name}${done.lead.subscribe ? " as a subscription" : ""}.`}
        </p>
        {url && (
          <div className="stack">
            <a className="btn" href={url} target="_blank" rel="noopener noreferrer">
              {done.lead.subscribe ? "Set up my subscription" : "View package"} on our store ↗
            </a>
            <p className="hint">Payment and subscriptions are handled securely in our online store.</p>
          </div>
        )}
        <div>
          <button
            className="btn ghost small"
            type="button"
            onClick={() => {
              setDone(null);
              setV(blank);
            }}
          >
            Start a new sign-up
          </button>
        </div>
      </div>
    );
  }

  const shown = packages.filter((p) => p.active && p.name);

  return (
    <form onSubmit={onSubmit} noValidate>
      {isStaff && (
        <div className="notice">
          You're signed in as team, so this form adds a new enquiry each time you submit (for example, details taken
          over the phone or at an event).
        </div>
      )}
      <div className="row">
        <div className="field">
          <label htmlFor="f-name">Full name</label>
          <input id="f-name" autoComplete="name" placeholder="e.g. Sarah Nguyen" value={v.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-email">Email address</label>
          <input id="f-email" type="email" autoComplete="email" placeholder="you@example.com" value={v.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="f-phone">
            Phone <span className="muted">(optional)</span>
          </label>
          <input id="f-phone" type="tel" autoComplete="tel" placeholder="04xx xxx xxx" value={v.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-post">
            Postcode <span className="muted">(optional)</span>
          </label>
          <input id="f-post" inputMode="numeric" autoComplete="postal-code" placeholder="4000" value={v.postcode} onChange={(e) => set("postcode", e.target.value)} />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="f-due">Baby's expected due date</label>
          <input id="f-due" type="date" value={v.baby_due} onChange={(e) => set("baby_due", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-deliv">When you'd like your products delivered</label>
          <input id="f-deliv" type="date" value={v.delivery_date} onChange={(e) => set("delivery_date", e.target.value)} />
          <span className="hint">Most families choose 4–6 weeks before the due date.</span>
        </div>
      </div>
      {note && <div className="bump">{note}</div>}

      <div className="field">
        <span className="lab">
          Choose a package <span className="muted">(optional)</span>
        </span>
        <div className="pkgs">
          {shown.length === 0 ? (
            <div className="empty">Packages will appear here once our team has added them.</div>
          ) : (
            <>
              <label className="pkg">
                <input type="radio" name="pkg" checked={!v.package_id} onChange={() => set("package_id", "")} />
                <div>
                  <b>Not sure yet</b>
                  <p className="hint">We'll talk you through the options.</p>
                </div>
                <span />
              </label>
              {shown.map((p) => (
                <label className="pkg" key={p.id}>
                  <input type="radio" name="pkg" checked={v.package_id === p.id} onChange={() => set("package_id", p.id)} />
                  <div style={{ minWidth: 0 }}>
                    <b>{p.name}</b>{" "}
                    {p.cadence && (
                      <span className="chip" style={{ padding: "2px 8px", fontSize: 12 }}>
                        {p.cadence}
                      </span>
                    )}
                    <p className="hint">{p.description}</p>
                  </div>
                  <span className="price">{p.price}</span>
                </label>
              ))}
            </>
          )}
        </div>
      </div>

      <label className="check" htmlFor="f-sub">
        <input type="checkbox" id="f-sub" checked={v.subscribe} onChange={(e) => set("subscribe", e.target.checked)} />
        <span>
          I'd like to <b>subscribe</b> to this package so it arrives on a regular schedule.
        </span>
      </label>
      <div className="field">
        <label htmlFor="f-notes">
          Anything else we should know? <span className="muted">(optional)</span>
        </label>
        <textarea id="f-notes" placeholder="Twins, first baby, gift for someone else…" value={v.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <label className="check" htmlFor="f-consent">
        <input type="checkbox" id="f-consent" checked={v.consent} onChange={(e) => set("consent", e.target.checked)} />
        <span>I'm happy for the team to contact me by email or phone about my order.</span>
      </label>

      {/* Spam trap: hidden from people, but bots fill it in. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="f-website">Website</label>
        <input id="f-website" tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set("website", e.target.value)} />
      </div>

      {err && (
        <p className="notice" role="alert">
          {err}
        </p>
      )}
      <div className="submitbar">
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Send my details"}
        </button>
      </div>
    </form>
  );
}
