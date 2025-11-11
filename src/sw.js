// src/sw.js
// PERBAIKAN TOTAL: Kriteria 4 (Advanced)
// TIDAK mengimpor StoryApi. Mengambil token dari IDB & fetch manual.

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { clientsClaim, setCacheNameDetails } from 'workbox-core';

// IMPOR BARU: Helper IDB untuk ambil token & data
import IdbHelper from './scripts/data/idb-helper';

// URL API (untuk fetch manual)
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

// --- Kriteria 2: PUSH NOTIFICATION (Sudah Benar) ---
self.addEventListener('push', (event) => {
  console.log('Push event diterima:', event.data.text());
  
  const data = event.data.json();
  const notificationTitle = data.title || 'Notifikasi Baru';
  const notificationOptions = {
    body: data.body || 'Kamu mendapat pesan baru.',
    icon: data.icon || 'icons/icon-192x192.png',
    badge: 'icons/icon-192x192.png',
    data: {
      url: data.url || '/#/stories'
    },
    actions: [
      { action: 'explore-action', title: 'Lihat Sekarang' }
    ]
  };

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

// --- Kriteria 4 (Advanced): BACKGROUND SYNC (SUDAH DIPERBAIKI) ---
self.addEventListener('sync', (event) => {
  console.log('Event "sync" terdeteksi:', event.tag);
  if (event.tag === 'sync-offline-stories') {
    event.waitUntil(syncOfflineStories());
  }
});

/**
 * PERBAIKAN TOTAL:
 * Fungsi ini sekarang mengambil token dari IDB dan fetch manual.
 */
async function syncOfflineStories() {
  console.log('Menjalankan background sync untuk upload cerita...');
  
  try {
    // 1. Ambil token dari IndexedDB
    const token = await IdbHelper.getToken();
    if (!token) {
      console.warn('Token tidak ditemukan di IDB, sync dibatalkan.');
      return;
    }

    // 2. Ambil semua cerita dari IndexedDB
    const stories = await IdbHelper.getAllStories();
    if (stories.length === 0) {
      console.log('Tidak ada cerita offline untuk disinkronkan.');
      return;
    }

    console.log(`Menemukan ${stories.length} cerita untuk disinkronkan...`);

    // 3. Coba upload satu per satu
    for (const story of stories) {
      console.log('Mencoba upload cerita ID:', story.id);
      
      const formData = new FormData();
      formData.append('photo', story.photo);
      formData.append('description', story.description);
      formData.append('lat', story.lat);
      formData.append('lon', story.lon);

      try {
        // 4. Lakukan FETCH MANUAL menggunakan token dari IDB
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
        
        // 5. Jika berhasil, hapus dari IDB
        await IdbHelper.deleteStory(story.id);
        console.log('Cerita ID:', story.id, 'berhasil disinkronkan.');
        
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