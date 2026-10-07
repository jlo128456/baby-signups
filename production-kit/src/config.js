/**
 * Reads the demo/production switch.
 *
 * Order of priority:
 *   1. public/config.js  (window.APP_CONFIG) — can be edited after building
 *   2. REACT_APP_MODE    (set when building, e.g. in the GitHub Actions workflow)
 *   3. "demo"            (safe default: never touches real customer data)
 */
const runtime = (typeof window !== "undefined" && window.APP_CONFIG) || {};

const chosen = String(runtime.mode || process.env.REACT_APP_MODE || "demo").trim().toLowerCase();

export const MODE = chosen === "production" ? "production" : "demo";
export const IS_DEMO = MODE === "demo";
export const API_URL = runtime.apiUrl || process.env.REACT_APP_API_URL || "api/";
