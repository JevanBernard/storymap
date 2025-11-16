import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { clientsClaim, setCacheNameDetails } from 'workbox-core';

// Helper IDB untuk ambil token & data
import IdbHelper from './scripts/data/idb-helper';

// URL API
const STORY_API_BASE_URL = 'https://story-api.dicoding.dev/v1';

setCacheNameDetails({
  prefix: 'storymap-pwa',
  suffix: 'v1',
  precache: 'precache',
  runtime: 'runtime-cache'
});

clientsClaim();
self.skipWaiting();

precacheAndRoute(self.__WB_MANIFEST);

// Caching data API
registerRoute(
  ({ url }) => url.href.startsWith(STORY_API_BASE_URL),
  new StaleWhileRevalidate({
    cacheName: 'story-api-cache',
    plugins: [{
      cacheableResponse: { statuses: [0, 200] },
    }],
  })
);

// Caching gambar peta
registerRoute(
  ({ url }) => url.href.startsWith('https://tile.openstreetmap.org/'),
  new CacheFirst({
    cacheName: 'leaflet-tiles-cache',
    plugins: [
      {
        expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    ],
  })
);

// PUSH NOTIFICATION (Sudah Benar)
// --- Kriteria 2: PUSH NOTIFICATION ---

/**
 * PERBAIKAN: 'push' listener sekarang bisa menangani JSON atau Teks Biasa
 */
self.addEventListener('push', (event) => {
  console.log('Push event diterima:', event.data.text());
  
  let data;
  let notificationTitle;
  let notificationOptions;

  try {
    // 1. Coba parsing sebagai JSON (untuk data dari API)
    data = event.data.json();
    notificationTitle = data.title || 'Notifikasi Baru';
    notificationOptions = {
      body: data.body || 'Kamu mendapat pesan baru.',
      icon: data.icon || 'icons/icon-192x192.png',
      badge: 'icons/icon-192x192.png',
      data: {
        url: data.url || '/storymap/#/stories' // Simpan URL untuk di-klik
      },
      actions: [
        { action: 'explore-action', title: 'Lihat Sekarang' }
      ]
    };
  } catch (e) {
    // 2. Jika GAGAL, anggap sebagai Teks Biasa (untuk tes DevTools)
    data = event.data.text();
    notificationTitle = 'Notifikasi Tes';
    notificationOptions = {
      body: data, // Tampilkan teks mentah dari DevTools
      icon: 'icons/icon-192x192.png',
      badge: 'icons/icon-192x192.png',
      data: {
        url: '/storymap/#/stories' // Default URL
      }
    };
  }

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
            }
        }
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
        })
    );
});

// BACKGROUND SYNC
self.addEventListener('sync', (event) => {
  console.log('Event "sync" terdeteksi:', event.tag);
  if (event.tag === 'sync-offline-stories') {
    event.waitUntil(syncOfflineStories());
  }
});

async function syncOfflineStories() {
  console.log('Menjalankan background sync untuk upload cerita...');
  
  try {
    const token = await IdbHelper.getToken();
    if (!token) {
      console.warn('Token tidak ditemukan di IDB, sync dibatalkan.');
      return;
    }

    const stories = await IdbHelper.getAllStories();
    if (stories.length === 0) {
      console.log('Tidak ada cerita offline untuk disinkronkan.');
      return;
    }

    console.log(`Menemukan ${stories.length} cerita untuk disinkronkan...`);

    for (const story of stories) {
      console.log('Mencoba upload cerita ID:', story.id);
      
      const formData = new FormData();
      formData.append('photo', story.photo);
      formData.append('description', story.description);
      formData.append('lat', story.lat);
      formData.append('lon', story.lon);

      try {
        const response = await fetch(`${STORY_API_BASE_URL}/stories`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const responseJson = await response.json();

        if (response.status >= 400 || responseJson.error) {
          throw new Error(`Gagal upload (Status: ${response.status}): ${responseJson.message}`);
        }
        
        await IdbHelper.deleteStory(story.id);
        console.log('Cerita ID:', story.id, 'berhasil disinkronkan.');
        // Tampilkan notifikasi kecil ketika sebuah cerita offline berhasil diupload
        const notifTitle = 'Cerita tersinkronisasi';
        const notifOptions = {
          body: `Cerita "${story.description?.substring(0, 40) || 'tanpa judul'}" berhasil diupload.`,
          icon: 'icons/icon-192x192.png',
          badge: 'icons/icon-192x192.png',
          data: { url: '/storymap/#/stories' }
        };
        try {
          await self.registration.showNotification(notifTitle, notifOptions);
        } catch (err) {
          console.warn('Gagal menampilkan notifikasi sinkronisasi:', err.message);
        }
        
      } catch (uploadError) {
        console.error('Gagal sinkronisasi cerita ID:', story.id, uploadError.message);
        if (uploadError.message.includes('401') || uploadError.message.includes('403')) {
          await IdbHelper.deleteToken(); // Hapus token jika tidak valid
          console.warn('Token tidak valid. Logout dari IDB.');
        }
      }
    }
    console.log('Background sync selesai.');
  } catch (dbError) {
    console.error('Gagal mengakses IndexedDB saat sync:', dbError.message);
  }
}