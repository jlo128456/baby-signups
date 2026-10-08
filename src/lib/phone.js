/**
 * Australian phone numbers.
 * Accepts the ways people actually type them:
 *   0412 345 678 · 0412345678 · +61 412 345 678 · 61412345678 · (07) 3123 4567
 * and tidies them to one format for the team:
 *   mobiles   0412 345 678
 *   landlines (07) 3123 4567
 */

/** Digits only, with +61 / 61 turned into a leading 0. */
function digits(input) {
  let d = String(input || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+61")) d = "0" + d.slice(3);
  else if (d.startsWith("61") && d.length === 11) d = "0" + d.slice(2);
  d = d.replace(/\D/g, "");
  // "+61 (0)4..." typed with the extra zero
  if (d.startsWith("00")) d = d.slice(1);
  return d;
}

/** True for a 10-digit Australian mobile (04…) or landline (02, 03, 07, 08). */
export function isValidAuPhone(input) {
  return /^0[23478]\d{8}$/.test(digits(input));
}

/** Tidy format for saving and showing to the team. Returns the input unchanged if it isn't valid. */
export function formatAuPhone(input) {
  const d = digits(input);
  if (!/^0[23478]\d{8}$/.test(d)) return String(input || "").trim();
  if (d.startsWith("04")) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)} ${d.slice(6)}`;
}
