/**
 * The one place the app gets its data from.
 * This front-end-only version uses the demo service, which saves everything
 * to the browser's local storage (see localStore.js). There is no server.
 *
 * To connect a real back end later, write a service with the same functions
 * as demoApi (packages, signup, login, leads, ...) and export it here instead.
 */
import { demoApi } from "./demoApi";

export const api = demoApi;

/** A random id for each new sign-up. */
export function newId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const b = window.crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
