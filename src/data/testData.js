/**
 * TEST DATA used in demo mode only.
 * Edit freely: add packages, change the sample enquiries, or change the demo login.
 * Dates are worked out from today, so the demo always looks current.
 * None of this is used in production mode.
 */

export const DEMO_LOGIN = { name: "Amanda", email: "amanda@demo.com", password: "demo1234" };

// Number of days from today, as YYYY-MM-DD
const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// A moment n hours ago, as an ISO timestamp
const hoursAgo = (n) => new Date(Date.now() - n * 36e5).toISOString();

const PKG_HOSPITAL = "a1a1a1a1-0000-4000-8000-000000000001";
const PKG_NEWBORN = "a1a1a1a1-0000-4000-8000-000000000002";
const PKG_FOURTH = "a1a1a1a1-0000-4000-8000-000000000003";

export function makeTestData() {
  return {
    staff: [{ id: 1, ...DEMO_LOGIN }],

    settings: {
      team: { amanda: "amanda@demo.com", laura: "laura@demo.com", richard: "richard@demo.com" },
      shop_domain: "demo-shop.myshopify.com",
    },

    packages: [
      {
        id: PKG_HOSPITAL,
        name: "Hospital bag bundle",
        price: "$129",
        cadence: "One-off",
        description: "Everything for the hospital stay: maternity pads, nursing bra, newborn outfits, swaddle.",
        shopify_url: "",
        shopify_variant: "40000000001",
        checkout_url: "https://demo-shop.myshopify.com/cart/40000000001:1",
        active: true,
        sort: 0,
      },
      {
        id: PKG_NEWBORN,
        name: "Newborn essentials box",
        price: "$89 / month",
        cadence: "Monthly",
        description: "Nappies, wipes, swaddles and a feeding starter kit, delivered each month.",
        shopify_url: "https://demo-shop.myshopify.com/products/newborn-box",
        shopify_variant: "",
        checkout_url: "https://demo-shop.myshopify.com/products/newborn-box",
        active: true,
        sort: 1,
      },
      {
        id: PKG_FOURTH,
        name: "Fourth trimester care",
        price: "$149 / quarter",
        cadence: "Quarterly",
        description: "Recovery and self-care for mum through the first three months.",
        shopify_url: "",
        shopify_variant: "40000000003",
        checkout_url: "https://demo-shop.myshopify.com/cart/40000000003:1",
        active: true,
        sort: 2,
      },
    ],

    leads: [
      {
        id: "d0000000-0000-4000-8000-000000000001",
        created_at: hoursAgo(3),
        updated_at: hoursAgo(3),
        name: "Example: Sarah Nguyen",
        email: "sarah@example.com",
        phone: "0400 111 222",
        postcode: "4000",
        baby_due: day(38),
        delivery_date: day(10),
        package_id: PKG_NEWBORN,
        subscribe: true,
        notes: "First baby",
        consent: true,
        source: "form",
        status: "new",
        contacted: {},
        team_emailed_at: hoursAgo(3),
      },
      {
        id: "d0000000-0000-4000-8000-000000000002",
        created_at: hoursAgo(30),
        updated_at: hoursAgo(20),
        name: "Example: Priya Shah",
        email: "priya@example.com",
        phone: "0400 333 444",
        postcode: "4101",
        baby_due: day(70),
        delivery_date: day(35),
        package_id: PKG_HOSPITAL,
        subscribe: false,
        notes: "Twins",
        consent: true,
        source: "team",
        status: "contacted",
        contacted: { laura: hoursAgo(20) },
        team_emailed_at: hoursAgo(30),
      },
      {
        id: "d0000000-0000-4000-8000-000000000003",
        created_at: hoursAgo(80),
        updated_at: hoursAgo(50),
        name: "Example: Mia Robertson",
        email: "mia@example.com",
        phone: "",
        postcode: "4215",
        baby_due: day(21),
        delivery_date: day(5),
        package_id: PKG_FOURTH,
        subscribe: true,
        notes: "",
        consent: true,
        source: "form",
        status: "subscribed",
        contacted: { amanda: hoursAgo(70), richard: hoursAgo(50) },
        team_emailed_at: hoursAgo(80),
      },
      {
        id: "d0000000-0000-4000-8000-000000000004",
        created_at: hoursAgo(200),
        updated_at: hoursAgo(100),
        name: "Example: Hannah Lee",
        email: "hannah@example.com",
        phone: "0400 555 666",
        postcode: "4870",
        baby_due: day(120),
        delivery_date: day(90),
        package_id: null,
        subscribe: false,
        notes: "Gift from grandma",
        consent: true,
        source: "form",
        status: "new",
        contacted: {},
        team_emailed_at: hoursAgo(200),
      },
    ],

    upsells: [
      { id: 1, lead_id: "d0000000-0000-4000-8000-000000000003", product: "Postpartum recovery kit", post_by: day(4), status: "to_post", posted_on: null, created_at: hoursAgo(50) },
      { id: 2, lead_id: "d0000000-0000-4000-8000-000000000002", product: "Twin feeding pillow", post_by: day(30), status: "to_post", posted_on: null, created_at: hoursAgo(20) },
      { id: 3, lead_id: "d0000000-0000-4000-8000-000000000003", product: "Bath set", post_by: day(-2), status: "posted", posted_on: day(-2), created_at: hoursAgo(70) },
    ],

    nextUpsellId: 4,
  };
}
