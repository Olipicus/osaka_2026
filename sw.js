/* Osaka 2026 — service worker: แคชทั้งเว็บไว้เปิดออฟไลน์ (ใช้ตอนสัญญาณตกในรถไฟ/ใต้ดิน)
   กลยุทธ์: stale-while-revalidate — ตอบจากแคชทันที แล้วดึงของใหม่อัปเดตเบื้องหลังเมื่อออนไลน์
   แก้ไฟล์หน้าเว็บครั้งใหญ่แล้วอยากบังคับรีเฟรช: เปลี่ยนเลข VERSION ด้านล่าง */
var VERSION = 'v6';
var CACHE = 'osaka2026-' + VERSION;
var PRECACHE = [
  './',
  './index.html',
  './day-1-bangkok-kyoto.html',
  './day-2-kiyomizu-gion-nanzenji.html',
  './day-3-arashiyama-universal-city.html',
  './day-4-universal-studios.html',
  './day-5-kaiyukan-namba.html',
  './day-6-kuromon-nara.html',
  './day-7-osaka-castle-midosuji.html',
  './day-8-minoo-rinku.html',
  './day-9-return-bangkok.html',
  './map.html',
  './emergency.html',
  './live-info.html',
  './fx-converter.js',
  './leaflet/leaflet.css',
  './leaflet/leaflet.js',
  './manifest.json',
  './favicon.svg',
  './favicon-32.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      /* แคชทีละไฟล์ — ไฟล์ไหนพลาดไม่ให้ทั้ง install ล้ม */
      return Promise.all(PRECACHE.map(function (url) {
        return cache.add(url).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; /* ลิงก์ภายนอก (Google Maps ฯลฯ) ปล่อยผ่านตามปกติ */

  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (cached) {
        var network = fetch(req).then(function (res) {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(function () {
          /* ออฟไลน์และไม่มีในแคช: หน้าเว็บ fallback ไป index (ทุกหน้าถูก precache ไว้แล้ว จึงเกือบไม่มีทางโดน) */
          if (req.mode === 'navigate') return cache.match('./index.html');
          return cached || Response.error();
        });
        return cached || network;
      });
    })
  );
});
