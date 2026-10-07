/**
 * Address suggestions while typing (Australian addresses only).
 *
 * Uses Photon (https://photon.komoot.io), a free OpenStreetMap search service
 * that needs no account or key. It's fine for a demo and light use. For a busy
 * live site, swap in a paid Australian service (e.g. Addressfinder or Google Places)
 * by changing only this file: keep the same searchAddresses() result shape.
 *
 * If the service can't be reached (offline, blocked, busy), searchAddresses()
 * returns [] and people simply type their address in the boxes.
 */

const ENDPOINT = "https://photon.komoot.io/api/";
const AUSTRALIA_BBOX = "112.9,-43.7,153.7,-10.6"; // west,south,east,north

export const STATES = [
  ["QLD", "Queensland"],
  ["NSW", "New South Wales"],
  ["VIC", "Victoria"],
  ["ACT", "Australian Capital Territory"],
  ["TAS", "Tasmania"],
  ["SA", "South Australia"],
  ["WA", "Western Australia"],
  ["NT", "Northern Territory"],
];

/** "Queensland" → "QLD" (also accepts "QLD"). */
export function stateCode(name) {
  if (!name) return "";
  const n = String(name).trim().toLowerCase();
  const hit = STATES.find(([code, full]) => code.toLowerCase() === n || full.toLowerCase() === n);
  return hit ? hit[0] : "";
}

/** One Photon result → { line1, suburb, state, postcode, label }, or null if it isn't a usable AU address. */
export function toAddress(feature) {
  const p = feature?.properties || {};
  if (p.countrycode && p.countrycode.toUpperCase() !== "AU") return null;

  const street = p.street || (p.osm_key === "highway" ? p.name : "");
  const line1 = [p.housenumber, street].filter(Boolean).join(" ") || (p.housenumber ? "" : p.name) || "";
  const suburb = p.locality || p.district || p.city || p.county || "";
  const state = stateCode(p.state);
  const postcode = /^\d{4}$/.test(p.postcode || "") ? p.postcode : "";
  if (!line1 && !suburb) return null;

  const label = [line1, suburb, [state, postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return { line1, suburb, state, postcode, label };
}

const cache = new Map();

/**
 * Suggestions for what the person has typed so far.
 * Pass an AbortSignal so a newer keystroke can cancel an older search.
 */
export async function searchAddresses(text, signal) {
  const q = text.trim();
  if (q.length < 4) return [];
  if (cache.has(q)) return cache.get(q);

  const url = `${ENDPOINT}?q=${encodeURIComponent(q + " Australia")}&limit=8&lang=en&bbox=${AUSTRALIA_BBOX}`;
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const seen = new Set();
    const results = (data.features || [])
      .map(toAddress)
      .filter(Boolean)
      // Street addresses with a house number first, then the rest
      .sort((a, b) => (/^\d/.test(b.line1) ? 1 : 0) - (/^\d/.test(a.line1) ? 1 : 0))
      .filter((a) => (seen.has(a.label) ? false : seen.add(a.label)))
      .slice(0, 5);
    cache.set(q, results);
    return results;
  } catch {
    return []; // offline, blocked or cancelled: manual entry still works
  }
}
