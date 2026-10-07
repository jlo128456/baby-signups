import { useMemo, useState } from "react";
import { daysBetween, parseDate, today } from "../lib/dates";

import { LeadCard } from "./LeadCard";

export function TeamDesk({ leads, upsells, packages, settings, loading, error, queued, onChanged }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(new Set());

  const byLead = useMemo(() => {
    const m = new Map();
    for (const u of upsells) m.set(u.lead_id, [...(m.get(u.lead_id) || []), u]);
    return m;
  }, [upsells]);

  const stats = useMemo(() => {
    const t = today();
    return {
      toContact: leads.filter((l) => l.status === "new").length,
      toPost: upsells.filter((u) => u.status !== "posted").length,
      subs: leads.filter((l) => l.subscribe).length,
      soon: leads.filter((l) => {
        const d = parseDate(l.delivery_date);
        if (!d) return false;
        const n = daysBetween(t, d);
        return n >= 0 && n <= 14;
      }).length,
    };
  }, [leads, upsells]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let r = leads.filter((l) => !s || l.name.toLowerCase().includes(s) || l.email.toLowerCase().includes(s));
    if (filter === "new") r = r.filter((l) => l.status === "new");
    if (filter === "topost") r = r.filter((l) => (byLead.get(l.id) || []).some((u) => u.status !== "posted"));
    if (filter === "sub") r = r.filter((l) => l.subscribe || l.status === "subscribed");
    if (filter === "closed") r = r.filter((l) => l.status === "closed");
    else if (filter !== "all") r = r.filter((l) => l.status !== "closed");
    return r;
  }, [leads, q, filter, byLead]);

  const toggle = (id, isOpen) =>
    setOpen((prev) => {
      const n = new Set(prev);
      if (isOpen) n.add(id);
      else n.delete(id);
      return n;
    });

  return (
    <>
      <div className="stack">
        <h2>Enquiries</h2>
        <div className="stats">
          <span className="chip">{leads.length} total</span>
          <span className={`chip${stats.toContact ? " warn" : ""}`}>{stats.toContact} to contact</span>
          <span className="chip blush">
            {stats.toPost} product{stats.toPost === 1 ? "" : "s"} to post
          </span>
          <span className="chip">{stats.subs} want a subscription</span>
          <span className="chip">{stats.soon} delivering in the next 14 days</span>
        </div>
        {queued > 0 && (
          <p className="hint">
            {queued} sign-up{queued === 1 ? "" : "s"} on this device not synced yet. They'll appear here once they sync.
          </p>
        )}
      </div>
      <div className="toolbar">
        <input
          id="q"
          type="search"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All enquiries</option>
          <option value="new">Not contacted yet</option>
          <option value="topost">Products to post</option>
          <option value="sub">Subscribers</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {error && <p className="notice">{error}</p>}
      <div className="stack" style={{ gap: 10 }}>
        {loading ? (
          <div className="empty">Loading enquiries…</div>
        ) : !leads.length ? (
          <div className="empty">
            No enquiries yet. When someone fills in the sign-up form, they'll show up here, soonest due date first.
          </div>
        ) : !list.length ? (
          <div className="empty">Nothing matches that search or filter.</div>
        ) : (
          list.map((l) => (
            <LeadCard
              key={l.id}
              lead={l}
              upsells={byLead.get(l.id) || []}
              pkg={packages.find((p) => p.id === l.package_id)}
              settings={settings}
              open={open.has(l.id)}
              onToggle={(o) => toggle(l.id, o)}
              onChanged={onChanged}
            />
          ))
        )}
      </div>
    </>
  );
}
