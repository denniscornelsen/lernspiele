/*
 * Knobelkiste – Offline-Speicher.
 * Merkt sich alle Dateien nach dem ersten Besuch, damit die Spiele auch bei
 * schwachem WLAN laufen. Zeigt sofort die gespeicherte Version und holt im
 * Hintergrund die neueste (beim nächsten Öffnen sichtbar).
 * Bei neuen Dateien: VERSION erhöhen und Datei in DATEIEN eintragen.
 */
const VERSION = "knobelkiste-v3";
const DATEIEN = [
  "./",
  "index.html",
  "katalog.json",
  "gemeinsam/stil.css",
  "gemeinsam/app.js",
  "gemeinsam/icon.svg",
  "gemeinsam/schrift/andika-400.woff2",
  "gemeinsam/schrift/andika-700.woff2",
  "spiele/wortarten-fabrik/index.html",
  "spiele/wortarten-fabrik/spiel.css",
  "spiele/wortarten-fabrik/spiel.js",
  "spiele/wortarten-fabrik/arbeitsblatt.html",
  "spiele/wortarten-fabrik/arbeitsblatt.css",
  "spiele/wortarten-fabrik/arbeitsblatt.js",
  "spiele/lese-expedition/index.html",
  "spiele/lese-expedition/spiel.css",
  "spiele/lese-expedition/spiel.js",
  "spiele/lese-expedition/text.js",
  "spiele/lese-expedition/arbeitsblatt.html",
  "spiele/lese-expedition/arbeitsblatt.css",
  "spiele/lese-expedition/arbeitsblatt.js",
  "spiele/geschichten-werkstatt/index.html",
  "spiele/geschichten-werkstatt/spiel.css",
  "spiele/geschichten-werkstatt/spiel.js",
  "spiele/geschichten-werkstatt/arbeitsblatt.html",
  "spiele/geschichten-werkstatt/arbeitsblatt.css",
  "spiele/geschichten-werkstatt/arbeitsblatt.js",
  "inhalte/deutsch/klasse-4/wortarten.json",
  "inhalte/deutsch/klasse-4/geschichten-werkstatt.json",
  "inhalte/deutsch/klasse-4/lese-expedition.json"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(VERSION).then(function (cache) { return cache.addAll(DATEIEN); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (namen) {
      return Promise.all(namen.filter(function (n) { return n !== VERSION; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(
    caches.open(VERSION).then(function (cache) {
      return cache.match(event.request, { ignoreSearch: true }).then(function (gespeichert) {
        const netz = fetch(event.request).then(function (antwort) {
          if (antwort.ok) cache.put(event.request, antwort.clone());
          return antwort;
        }).catch(function () { return gespeichert; });
        return gespeichert || netz;
      });
    })
  );
});
