const CACHE_NAME = "interverse-studio-v4";
const APP_SHELL = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./assets/interverse-mark.svg", "./assets/interverse-mark-180.png", "./assets/interverse-mark-512.png", "./editor/", "./editor/index.html", "./editor/editor.css", "./editor/editor.js", "./play/", "./play/index.html", "./play/main.js", "./play/runtime.js", "./play/project.interverse.json", "./play/scene.json"];

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
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
