const CACHE_NAME = "expense-tracker-v1";
const ASSETS_TO_CACHE = [
  "/inr-expense-tracker/",
  "/inr-expense-tracker/index.html",
  "/inr-expense-tracker/manifest.json",
  "/inr-expense-tracker/icons/icon-192.png",
  "/repo-name/icons/icon-512.png",
];

// Install: cache all core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)),
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch: cache-first, fall back to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request)),
  );
});
