const CACHE_NAME = 'ashqaf-donasi-v2'; // Ganti nama versi jika ada update besar-besaran
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// Install Event - Melakukan Caching awal & Memaksa update
self.addEventListener('install', event => {
  // Memaksa Service Worker baru untuk langsung aktif tanpa menunggu app ditutup
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate Event - Mengambil alih kontrol seketika & Membersihkan Cache lama
self.addEventListener('activate', event => {
  // Langsung aplikasikan Service Worker ke semua halaman yang terbuka
  event.waitUntil(clients.claim()); 

  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Hapus cache versi lama
          }
        })
      );
    })
  );
});

// Fetch Event - STRATEGI: Network-First, Fallback to Cache
self.addEventListener('fetch', event => {
  // Hanya proses request GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Jika sukses ambil dari GitHub (internet jalan), simpan versi terbaru ke cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response; // Tampilkan versi terbaru
      })
      .catch(() => {
        // Jika gagal ambil dari GitHub (sedang offline/tidak ada sinyal), ambil dari cache HP
        return caches.match(event.request);
      })
  );
});
