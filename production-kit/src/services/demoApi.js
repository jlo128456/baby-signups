/**
 * DEMO: behaves like the PHP API, but saves everything to the browser's
 * local storage (see localStore.js). Nothing is emailed or sent anywhere.
 * It follows the same rules as the real server, including the team password.
 */
import { localStore, seed } from "./localStore";

/** Puts the test data back to how it started (used by the "Reset demo" button). */
export function resetDemo() {
  localStore.clear();
  seed();
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const now = () => new Date().toISOString();
const ok = (data) => ({ ok: true, status: 200, data });
const err = (status, error) => ({ ok: false, status, error });

const session = () => localStore.get("session");
const needStaff = () => (session() ? null : err(401, "Please sign in as team."));

// A short pause so the demo feels like a real server.
async function handle(fn) {
  await new Promise((r) => setTimeout(r, 150));
  return fn();
}

function checkoutUrl(p, shop) {
  const url = (p.shopify_url || "").trim();
  if (url) return /^https?:\/\//.test(url) ? url : "https://" + url;
  return p.shopify_variant && shop ? `https://${shop}/cart/${p.shopify_variant}:1` : "";
}

export const demoApi = {
  // ---------- customers ----------
  packages: () =>
    handle(() => {
      const all = localStore.get("packages").sort((a, b) => a.sort - b.sort);
      return ok({ packages: session() ? all : all.filter((p) => p.active) });
    }),

  signup: (lead) =>
    handle(() => {
      if (lead.website) return ok({ ok: true }); // spam trap
      const leads = localStore.get("leads");
      if (leads.some((l) => l.id === lead.id)) return ok({ ok: true, duplicate: true });
      const teamSet = Object.values(localStore.get("settings").team || {}).some(Boolean);
      const { website, ...clean } = lead;
      leads.push({
        ...clean,
        source: lead.source === "team" && session() ? "team" : "form",
        updated_at: now(),
        status: "new",
        contacted: {},
        team_emailed_at: teamSet ? now() : null,
      });
      localStore.set("leads", leads);
      return ok({ ok: true });
    }),

  // ---------- team sign-in (stays signed in after a refresh) ----------
  me: () => handle(() => ok({ staff: session() })),

  login: (email, password) =>
    handle(() => {
      const s = localStore
        .get("staff")
        .find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase() && x.password === password);
      if (!s) return err(401, "That email and password don't match a team account.");
      const signedIn = { id: s.id, name: s.name, email: s.email };
      localStore.set("session", signedIn);
      return ok({ staff: signedIn });
    }),

  logout: () =>
    handle(() => {
      localStore.set("session", null);
      return ok({ ok: true });
    }),

  // ---------- team desk ----------
  leads: () =>
    handle(() => {
      const denied = needStaff();
      if (denied) return denied;
      const leads = localStore.get("leads").sort((a, b) => a.baby_due.localeCompare(b.baby_due));
      return ok({ leads, upsells: localStore.get("upsells") });
    }),

  updateLead: (id, fields) =>
    handle(() => {
      const denied = needStaff();
      if (denied) return denied;
      let found = false;
      localStore.update("leads", (leads) =>
        leads.map((l) => {
          if (l.id !== id) return l;
          found = true;
          const next = { ...l, updated_at: now() };
          if (fields.status) next.status = fields.status;
          if (fields.contacted) next.contacted = Object.fromEntries(Object.entries(fields.contacted).filter(([, v]) => v));
          return next;
        })
      );
      return found ? ok({ ok: true }) : err(404, "That enquiry no longer exists.");
    }),

  addUpsell: (lead_id, product, post_by) =>
    handle(() => {
      const denied = needStaff();
      if (denied) return denied;
      const id = localStore.nextUpsellId();
      localStore.update("upsells", (u) => [...u, { id, lead_id, product, post_by, status: "to_post", posted_on: null, created_at: now() }]);
      return ok({ ok: true, id });
    }),

  setPosted: (id, posted) =>
    handle(() => {
      const denied = needStaff();
      if (denied) return denied;
      localStore.update("upsells", (list) =>
        list.map((u) => (u.id === id ? { ...u, status: posted ? "posted" : "to_post", posted_on: posted ? today() : null } : u))
      );
      return ok({ ok: true });
    }),

  deleteUpsell: (id) =>
    handle(() => {
      const denied = needStaff();
      if (denied) return denied;
      localStore.update("upsells", (list) => list.filter((u) => u.id !== id));
      return ok({ ok: true });
    }),

  // ---------- settings ----------
  settings: () =>
    handle(() => {
      const denied = needStaff();
      return denied || ok(localStore.get("settings"));
    }),

  saveSettings: ({ team, shop_domain, packages }) =>
    handle(() => {
      const denied = needStaff();
      if (denied) return denied;
      const shop = String(shop_domain || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      localStore.set("settings", { team, shop_domain: shop });

      const saved = localStore.get("packages");
      const keep = new Set(packages.map((p) => p.id));
      const updated = packages.map((p, i) => ({ ...p, checkout_url: checkoutUrl(p, shop), active: true, sort: i }));
      // Removed packages are hidden, not deleted, so old enquiries keep the package name.
      const hidden = saved.filter((p) => !keep.has(p.id)).map((p) => ({ ...p, active: false }));
      localStore.set("packages", [...updated, ...hidden]);
      return ok({ ok: true });
    }),
};
