/*
 * Offline support: keeps a copy of the app on the device so it opens with no internet.
 * - The page itself: try the network first (so updates show up), fall back to the saved copy.
 * - Built JS/CSS, icon and fonts: use the saved copy, fetch once if missing.
 * - The API (/api/...) is never cached: sign-ups always go to the server, or wait in the app's own offline queue.
 */
const CACHE = "due-date-signups-v2";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.json", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.includes("/api/")) return;

  // The page and the demo/production switch: always try the network first, so changes show up straight away.
  if (req.mode === "navigate" || url.pathname.endsWith("/config.js")) {
    const key = req.mode === "navigate" ? "./index.html" : req;
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(key, copy));
          return res;
        })
        .catch(() => caches.match(key))
    );
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok || res.type === "opaque") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
