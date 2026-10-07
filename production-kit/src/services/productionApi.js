/**
 * PRODUCTION: talks to the PHP API on your cPanel hosting (the files in /server).
 * Every call resolves to { ok, data, error, status, network } and never throws.
 */
import { API_URL } from "../config";

async function call(path, { method = "GET", body } = {}) {
  try {
    const res = await fetch(API_URL + path, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* not JSON, e.g. a hosting error page */
    }
    if (!res.ok) return { ok: false, status: res.status, error: data?.error || "Something went wrong. Try again.", data };
    return { ok: true, status: res.status, data };
  } catch {
    return { ok: false, network: true, error: "No connection. Check your internet and try again." };
  }
}

const post = (path, body = {}) => call(path, { method: "POST", body });

export const productionApi = {
  // customers
  packages: () => call("packages.php"),
  signup: (lead) => post("signup.php", lead),

  // team sign-in
  me: () => call("auth.php"),
  login: (email, password) => post("auth.php?action=login", { email, password }),
  logout: () => post("auth.php?action=logout"),

  // team desk
  leads: () => call("leads.php"),
  updateLead: (id, fields) => post("leads.php?action=update", { id, ...fields }),
  addUpsell: (lead_id, product, post_by) => post("upsells.php?action=add", { lead_id, product, post_by }),
  setPosted: (id, posted) => post("upsells.php?action=posted", { id, posted }),
  deleteUpsell: (id) => post("upsells.php?action=delete", { id }),

  // settings
  settings: () => call("settings.php"),
  saveSettings: (data) => post("settings.php", data),
};
