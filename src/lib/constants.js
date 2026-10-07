/**
 * Team members and enquiry statuses used across the app.
 *
 * Record shapes (column names match the database, see supabase/migrations/001_init.sql):
 *   lead:    { id, name, email, phone, postcode, baby_due, delivery_date, package_id, subscribe,
 *              notes, consent, source, created_at, updated_at, status, contacted, team_emailed_at }
 *   upsell:  { id, lead_id, product, post_by, status: "to_post" | "posted", posted_on, created_at }
 *   package: { id, name, price, cadence, description, shopify_url, shopify_variant, checkout_url, active, sort }
 *   settings:{ team: { amanda, laura, richard }, shop_domain }
 */
export const TEAM = [
  ["amanda", "Amanda"],
  ["laura", "Laura"],
  ["richard", "Richard"],
];

export const STATUS = {
  new: "New",
  contacted: "Contacted",
  subscribed: "Subscribed",
  closed: "Closed",
};
