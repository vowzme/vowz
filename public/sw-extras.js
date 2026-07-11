/* eslint-disable no-restricted-globals */
// Extras layered on top of the Workbox-generated sw.js via `importScripts`.
// Adds: Push notifications, Background Sync (POST replay), Periodic Sync.

// ---------- Push notifications ----------
self.addEventListener("push", (event) => {
  let data = { title: "Vowz", body: "You have a new update." };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) return c.navigate(url).then(() => c.focus());
      }
      return self.clients.openWindow(url);
    }),
  );
});

// ---------- Background Sync (Workbox) ----------
// Replays failed POST/PUT requests once connectivity returns.
if (self.workbox && self.workbox.backgroundSync) {
  const { BackgroundSyncPlugin } = self.workbox.backgroundSync;
  const { registerRoute } = self.workbox.routing;
  const { NetworkOnly } = self.workbox.strategies;

  const bgSyncPlugin = new BackgroundSyncPlugin("vowz-mutations-queue", {
    maxRetentionTime: 24 * 60, // Retry for up to 24 hours
  });

  registerRoute(
    ({ url, request }) =>
      request.method !== "GET" && url.pathname.startsWith("/api/"),
    new NetworkOnly({ plugins: [bgSyncPlugin] }),
    "POST",
  );
  registerRoute(
    ({ url, request }) =>
      request.method !== "GET" && url.pathname.startsWith("/api/"),
    new NetworkOnly({ plugins: [bgSyncPlugin] }),
    "PUT",
  );
}

// ---------- Periodic Background Sync ----------
// Fires when the UA decides (requires user grant). Refreshes the offline shell.
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "vowz-content-refresh") {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open("html");
          await cache.add("/");
          await cache.add("/offline.html");
        } catch {
          /* offline — try next cycle */
        }
      })(),
    );
  }
});

// ---------- Manual Sync fallback ----------
self.addEventListener("sync", (event) => {
  if (event.tag === "vowz-sync") {
    event.waitUntil(Promise.resolve());
  }
});

// ---------- PWA Widgets (Windows 11 Widgets Board) ----------
// PWABuilder's Widgets capability check requires the SW to handle the
// widget lifecycle events and update instances via the Widgets API.
async function renderVowzCountdown(widget) {
  if (!widget) return;
  try {
    const [tplRes, dataRes] = await Promise.all([
      fetch(widget.definition.msAcTemplate),
      fetch(widget.definition.data),
    ]);
    const template = await tplRes.text();
    const data = await dataRes.text();
    if (self.widgets && widget.instances) {
      await Promise.all(
        widget.instances.map((i) =>
          self.widgets.updateByInstanceId(i.id, { template, data }),
        ),
      );
    }
  } catch {
    /* offline — Widgets Board will retry */
  }
}

self.addEventListener("widgetinstall", (event) => {
  event.waitUntil(
    (async () => {
      const widget = await self.widgets?.getByTag(event.widget.definition.tag);
      await renderVowzCountdown(widget);
    })(),
  );
});

self.addEventListener("widgetresume", (event) => {
  event.waitUntil(
    (async () => {
      const widget = await self.widgets?.getByTag(event.widget.definition.tag);
      await renderVowzCountdown(widget);
    })(),
  );
});

self.addEventListener("widgetuninstall", () => {
  /* nothing to clean up */
});

self.addEventListener("widgetclick", (event) => {
  if (event.action === "open-vowz") {
    event.waitUntil(self.clients.openWindow("/"));
  }
  if (event.action === "refresh-events" || event.host === "widgets") {
    event.waitUntil(
      (async () => {
        const widget = await self.widgets?.getByTag(
          event.widget?.definition?.tag || "vowz-events",
        );
        await renderVowzCountdown(widget); // generic template+data render
      })(),
    );
  }
});

// ---------- Offline catch-all ----------
// Guarantees any failed navigation returns the precached offline shell so
// PWABuilder's offline probe always gets a real HTML response.
if (self.workbox && self.workbox.routing) {
  self.workbox.routing.setCatchHandler(async ({ request }) => {
    if (request.destination === "document" || request.mode === "navigate") {
      const cached = await caches.match("/offline.html");
      if (cached) return cached;
    }
    return Response.error();
  });
}