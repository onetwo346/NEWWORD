self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Keep-alive ping to PeerJS server (adjust URL as needed)
  if (event.request.url.includes('keep-alive')) {
    event.respondWith(fetch(event.request));
  }
});

setInterval(() => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: "keepAlive" });
    });
  });
}, 5000); // Ping every 5 seconds
