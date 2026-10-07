import { useEffect, useState } from "react";
import { api } from "../services/api";
import { STATUS, TEAM } from "../lib/constants";
import { fmtDate, fmtDateTime, fmtShort, weeksAlong } from "../lib/dates";
import { useToast } from "../lib/toast";

function summary(l, pkg) {
  return [
    `New enquiry: ${l.name}`,
    "",
    `Email: ${l.email}`,
    `Phone: ${l.phone || "—"}`,
    `Postcode: ${l.postcode || "—"}`,
    `Baby due: ${fmtDate(l.baby_due)}`,
    `Deliver products by: ${fmtDate(l.delivery_date)}`,
    `Package: ${pkg ? pkg.name : "Not chosen"}${l.subscribe ? " (wants a subscription)" : ""}`,
    `Notes: ${l.notes || "—"}`,
  ].join("\n");
}

export function LeadCard({ lead: l, upsells, pkg, settings, open, onToggle, onChanged }) {
  const toast = useToast();
  const [product, setProduct] = useState("");
  const [postBy, setPostBy] = useState(l.delivery_date || "");
  // Show ticks and status changes straight away; the server copy replaces them when it reloads.
  const [contacted, setContacted] = useState(l.contacted || {});
  const [status, setStatus] = useState(l.status);
  useEffect(() => setContacted(l.contacted || {}), [l.contacted]);
  useEffect(() => setStatus(l.status), [l.status]);
  const w = weeksAlong(l.baby_due);
  const pending = upsells.filter((u) => u.status !== "posted").length;
  const addrs = TEAM.map(([k]) => settings.team[k]).filter(Boolean);
  const mail = addrs.length
    ? `mailto:${addrs.join(",")}?subject=${encodeURIComponent("New enquiry: " + l.name)}&body=${encodeURIComponent(summary(l, pkg))}`
    : "";

  async function run(promise, msg) {
    const r = await promise;
    if (!r.ok) toast(r.error || "That didn't save. Try again.");
    else {
      if (msg) toast(msg);
      onChanged();
    }
    return r.ok;
  }

  async function toggleContact(k, on) {
    const before = { contacted, status };
    const next = { ...contacted, [k]: on ? new Date().toISOString() : null };
    const fields = { contacted: next };
    if (on && status === "new") fields.status = "contacted";
    setContacted(next);
    if (fields.status) setStatus(fields.status);
    if (!(await run(api.updateLead(l.id, fields)))) {
      setContacted(before.contacted);
      setStatus(before.status);
    }
  }

  async function changeStatus(next) {
    const before = status;
    setStatus(next);
    if (!(await run(api.updateLead(l.id, { status: next }), "Status updated"))) setStatus(before);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary(l, pkg));
      toast("Copied. Paste it into an email");
    } catch {
      toast("Copy isn't available here. Select the details instead");
    }
  }

  async function addUpsell() {
    if (!product.trim()) {
      toast("Type a product name first");
      return;
    }
    if (await run(api.addUpsell(l.id, product.trim(), postBy || null), "Added to the post-out list")) setProduct("");
  }

  return (
    <details className="lead" open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
      <summary>
        <span className="who">{l.name}</span>
        <span className={`chip${status === "new" ? " warn" : ""}`}>{STATUS[status] || "New"}</span>
        <span className="meta">
          <span>
            Due {fmtDate(l.baby_due)}
            {w !== null && w >= 0 && w <= 42 ? ` · ${w} wks` : ""}
          </span>
          <span>Deliver {fmtDate(l.delivery_date)}</span>
          {pkg ? (
            <span>
              {pkg.name}
              {l.subscribe ? " · subscription" : ""}
            </span>
          ) : l.subscribe ? (
            <span>Wants subscription</span>
          ) : null}
          {pending > 0 && <span>{pending} to post</span>}
        </span>
      </summary>

      {open && (
        <div className="lead-body">
          <dl className="kv">
            <dt>Email</dt>
            <dd>{l.email}</dd>
            <dt>Phone</dt>
            <dd>{l.phone || "—"}</dd>
            <dt>Postcode</dt>
            <dd>{l.postcode || "—"}</dd>
            <dt>Notes</dt>
            <dd>{l.notes || "—"}</dd>
            <dt>Signed up</dt>
            <dd>
              {fmtDateTime(l.created_at)}
              {l.source === "team" ? " · entered by team" : ""}
              {l.saved_offline ? " · saved offline" : ""}
            </dd>
            <dt>Status</dt>
            <dd>
              <select
                id={`st-${l.id}`}
                style={{ width: "auto" }}
                value={status}
                onChange={(e) => changeStatus(e.target.value)}
              >
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </dd>
          </dl>

          <div className="stack">
            <span className="label">Who has contacted them</span>
            <div className="team">
              {TEAM.map(([k, n]) => (
                <label key={k}>
                  <input type="checkbox" checked={!!contacted[k]} onChange={(e) => toggleContact(k, e.target.checked)} />
                  {n}
                  {contacted[k] && <span className="hint"> · {fmtShort(contacted[k])}</span>}
                </label>
              ))}
            </div>
          </div>

          <div className="stack">
            <span className="label">Team email</span>
            <p className="hint">
              {l.team_emailed_at
                ? `Amanda, Laura and Richard were emailed automatically (${fmtDateTime(l.team_emailed_at)}).`
                : addrs.length
                ? "The automatic team email didn't go out for this one. Use the buttons below to send the details."
                : "Add the team's email addresses under Packages & settings to get automatic emails."}
            </p>
            <div className="toolbar">
              <button className="btn small" type="button" onClick={copy}>
                Copy enquiry details
              </button>
              {mail && (
                <a className="btn ghost small" href={mail}>
                  Email the team
                </a>
              )}
            </div>
          </div>

          <div className="stack">
            <span className="label">Products to post out (upsell)</span>
            <div className="ups">
              {upsells.length === 0 ? (
                <p className="hint">Nothing queued. Add a product to send with or after their order.</p>
              ) : (
                upsells.map((u) => (
                  <div key={u.id} className={`up${u.status === "posted" ? " posted" : ""}`}>
                    <span className="nm">
                      {u.product}
                      <span className="hint"> · {u.status === "posted" ? "posted " + fmtDate(u.posted_on) : "post by " + fmtDate(u.post_by)}</span>
                    </span>
                    <button className="btn ghost small" type="button" onClick={() => run(api.setPosted(u.id, u.status !== "posted"))}>
                      {u.status === "posted" ? "Undo" : "Mark posted"}
                    </button>
                    <button className="btn ghost small" type="button" onClick={() => run(api.deleteUpsell(u.id), "Removed")}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="upadd">
              <input id={`up-p-${l.id}`} placeholder="Product, e.g. Postpartum recovery kit" value={product} onChange={(e) => setProduct(e.target.value)} />
              <input id={`up-d-${l.id}`} type="date" value={postBy} onChange={(e) => setPostBy(e.target.value)} aria-label="Post by" />
              <button className="btn small" type="button" onClick={addUpsell}>
                Add
              </button>
            </div>
          </div>

          {pkg?.checkout_url && (
            <div>
              <a className="btn ghost small" href={pkg.checkout_url} target="_blank" rel="noopener noreferrer">
                Open {pkg.name} in Shopify ↗
              </a>
            </div>
          )}
        </div>
      )}
    </details>
  );
}
