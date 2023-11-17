import { precacheAndRoute } from "workbox-precaching/precacheAndRoute";

self.skipWaiting();
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);
manifest.push({ url: "/fallback", revision: "1" });

self.addEventListener("push", async (event) => {
  const { actions } = event.data.json();
  const count = actions.length;
  if (count === 0) return;

  event.waitUntil(
    self.registration.showNotification("Spice AI", {
      body: `Spice AI is executing ${count} condition transaction${
        count > 1 ? "s" : ""
      } you submitted before`,
    })
  );

  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage(event.data.json()));
  });
});
