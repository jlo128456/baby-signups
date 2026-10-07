/**
 * Formats a sign-up's postal address the Australian way, ready for a parcel label:
 *
 *   Sarah Nguyen
 *   Unit 4
 *   12 Queen Street
 *   BRISBANE CITY QLD 4000
 */
export function addressLines(l) {
  const last = [l.suburb ? l.suburb.toUpperCase() : "", l.state, l.postcode].filter(Boolean).join(" ");
  return [l.address_line2, l.address_line1, last].filter((x) => x && String(x).trim());
}

/** One line, for lists and search: "12 Queen Street, Brisbane City QLD 4000" */
export function addressShort(l) {
  const last = [l.suburb, l.state, l.postcode].filter(Boolean).join(" ");
  return [l.address_line2, l.address_line1, last].filter(Boolean).join(", ");
}

/** Full label including the person's name. */
export function postalLabel(l) {
  return [l.name, ...addressLines(l)].join("\n");
}
