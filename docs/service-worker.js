const CACHE_NAME = "interverse-studio-v10";
const APP_SHELL = ["./", "./index.html", "./styles.css", "./asset-library.js", "./asset-library.js?v=20260730-2", "./app.js", "./manifest.webmanifest", "./assets/interverse-mark.svg", "./assets/interverse-mark-180.png", "./assets/interverse-mark-512.png", "./editor/", "./editor/index.html", "./editor/editor.css?v=20260730-3", "./editor/editor.js?v=20260730-3", "./play/", "./play/index.html", "./play/main.js", "./play/audio-feedback.js", "./play/runtime.js", "./play/project.interverse.json", "./play/scene.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const isAppCode = ["document", "script", "style"].includes(event.request.destination);
  if (isAppCode) {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
