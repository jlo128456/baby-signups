/**
 * The one place the app gets its data from.
 * Picks the demo (test data) or production (PHP + MySQL) back end
 * based on the switch in public/config.js. Components only ever import `api`.
 */
import { IS_DEMO } from "../config";
import { demoApi } from "./demoApi";
import { productionApi } from "./productionApi";

export const api = IS_DEMO ? demoApi : productionApi;

/** A random id made on the device, so a sign-up re-sent after a dropped connection is never duplicated. */
export function newId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const b = window.crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
