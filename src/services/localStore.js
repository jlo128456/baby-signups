/**
 * Local storage for DEMO mode.
 *
 * Each kind of record has its own key, so you can see (and clear) them in the
 * browser: DevTools → Application → Local Storage.
 *
 *   dds-demo:leads      sign-ups
 *   dds-demo:upsells    products to post out
 *   dds-demo:packages   packages on the form
 *   dds-demo:settings   team emails and Shopify store
 *   dds-demo:staff      demo team logins
 *   dds-demo:session    who is signed in (kept after a refresh)
 *   dds-demo:meta       version and counters
 *
 * The first time the demo opens, these are filled from src/data/testData.js.
 * After that, everything a person does is saved here and survives a refresh.
 */
import { makeTestData } from "../data/testData";

const PREFIX = "dds-demo:";
const VERSION = 1; // bump to replace everyone's saved demo data with fresh test data
const TABLES = ["leads", "upsells", "packages", "settings", "staff", "session", "meta"];

// Copy kept in memory, so the demo still works if the browser blocks storage (e.g. some private windows).
const memory = {};

function read(name) {
  try {
    const raw = window.localStorage.getItem(PREFIX + name);
    if (raw !== null) return JSON.parse(raw);
  } catch {
    /* storage unavailable or damaged: fall back to memory */
  }
  return memory[name];
}

function write(name, value) {
  memory[name] = value;
  try {
    window.localStorage.setItem(PREFIX + name, JSON.stringify(value));
    return true;
  } catch {
    return false; // full or blocked: the in-memory copy keeps this visit working
  }
}

/** Fills storage with the test data, replacing anything saved. */
export function seed() {
  const data = makeTestData();
  write("leads", data.leads);
  write("upsells", data.upsells);
  write("packages", data.packages);
  write("settings", data.settings);
  write("staff", data.staff);
  write("session", null);
  write("meta", { version: VERSION, nextUpsellId: data.nextUpsellId, seededAt: new Date().toISOString() });
}

/** Seeds on first use, or when the test data version changes. */
function ensureSeeded() {
  const meta = read("meta");
  if (!meta || meta.version !== VERSION || !Array.isArray(read("leads"))) seed();
}

export const localStore = {
  get(name) {
    ensureSeeded();
    const v = read(name);
    return v === undefined ? null : JSON.parse(JSON.stringify(v)); // a copy, so callers can't change storage by accident
  },
  set(name, value) {
    ensureSeeded();
    return write(name, value);
  },
  /** Read, change and save in one step: localStore.update("leads", (leads) => [...leads, newLead]) */
  update(name, fn) {
    const next = fn(this.get(name));
    write(name, next);
    return next;
  },
  /** Next id for a new upsell. */
  nextUpsellId() {
    const meta = this.get("meta");
    const id = meta.nextUpsellId || 1;
    write("meta", { ...meta, nextUpsellId: id + 1 });
    return id;
  },
  /** True if the browser is really saving (not just keeping this visit in memory). */
  isPersistent() {
    try {
      const k = PREFIX + "check";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  },
  /** Removes every demo key from storage. */
  clear() {
    TABLES.forEach((t) => {
      delete memory[t];
      try {
        window.localStorage.removeItem(PREFIX + t);
      } catch {
        /* ignore */
      }
    });
  },
};
