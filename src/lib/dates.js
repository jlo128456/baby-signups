export function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return y ? new Date(y, m - 1, d) : null;
}

export function fmtDate(s) {
  const d = parseDate(s);
  return d ? d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

export function fmtShort(iso) {
  return iso ? new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : "";
}

export function fmtDateTime(iso) {
  return iso ? new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export function today() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

export function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 864e5);
}

export function todayISO() {
  const t = today();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

/** Weeks of pregnancy today, counting 40 weeks (280 days) back from the due date. */
export function weeksAlong(due) {
  const d = parseDate(due);
  if (!d) return null;
  return Math.floor((280 - daysBetween(today(), d)) / 7);
}

/** One-line note shown under the date fields on the sign-up form. */
export function bumpNote(due, delivery) {
  if (!due) return null;
  const w = weeksAlong(due);
  let t;
  if (w !== null && w >= 0 && w <= 42) t = `You're about ${w} week${w === 1 ? "" : "s"} along.`;
  else if (w !== null && w > 42)
    t = "That due date has passed. If baby has arrived, congratulations! Tell us in the notes.";
  else t = "That's a long way off. We'll still note it down.";
  const dd = parseDate(due),
    dl = parseDate(delivery);
  if (dd && dl) {
    const gap = daysBetween(dl, dd);
    const wk = (n) => Math.round((n / 7) * 10) / 10;
    if (gap > 0) t += ` Your delivery would arrive ${wk(gap)} weeks before baby's due.`;
    else if (gap === 0) t += " Delivery is set for the due date itself. You may want it a little earlier.";
    else t += ` Delivery is set ${wk(-gap)} weeks after the due date.`;
  }
  return t;
}
