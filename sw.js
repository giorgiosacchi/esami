/* Memorizza soltanto il programma e le sue icone, mai i file degli esami. */
const APP_ROOT = new URL("./", self.registration.scope);
const PREFIX = "ricerca-esami:" + APP_ROOT.href + ":";
const CACHE = PREFIX + "4b9a67f4c694";
const APP_URL = new URL("index.html", APP_ROOT).href;
const FILES = ["index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"]
  .map(path => new URL(path, APP_ROOT).href);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(FILES.map(url => new Request(url, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isApp = url.origin === APP_ROOT.origin &&
    (url.pathname === APP_ROOT.pathname || url.pathname === new URL(APP_URL).pathname);
  const cleanURL = url.origin + url.pathname;
  if (!isApp && !FILES.includes(cleanURL)) return;
  const key = isApp ? APP_URL : cleanURL;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (!response.ok) throw new Error("HTTP " + response.status);
      event.waitUntil(cache.put(key, response.clone()));
      return response;
    } catch (_) {
      return (await cache.match(key)) || Response.error();
    }
  })());
});
