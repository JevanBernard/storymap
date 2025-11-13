const DEFAULT_VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
// Local dev push server (fallback). Change if your local push server runs on different port.
const LOCAL_PUSH_SERVER = 'http://localhost:4000';

// Mengubah string VAPID key ke Uint8Array
function _urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

import StoryApi from '../data/story-api';
import IdbHelper from '../data/idb-helper';

// Meminta izin notifikasi ke pengguna
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Izin notifikasi ditolak.');
  }
  return permission;
}

// Melakukan subscribe ke push notification
async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push messaging tidak didukung.');
  }

  const registration = await navigator.serviceWorker.ready;
  let vapidKey = DEFAULT_VAPID_PUBLIC_KEY;
  try {
    const resp = await fetch(`${LOCAL_PUSH_SERVER}/` , { method: 'GET' });
    if (resp.ok) {
      const j = await resp.json();
      if (j.vapidPublicKey) vapidKey = j.vapidPublicKey;
    }
  } catch (err) {
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: _urlB64ToUint8Array(vapidKey),
  });
  
  console.log('Push subscription berhasil:', subscription);
    try {
      try {
        await StoryApi.registerPushSubscription(subscription);
        console.log('Subscription dikirim ke server.');
      } catch (serverErr) {
        console.warn('Gagal mengirim subscription ke server (mungkin endpoint tidak tersedia):', serverErr.message);
        try {
          await fetch(`${LOCAL_PUSH_SERVER}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
          });
          console.log('Subscription dikirim ke local push server.');
        } catch (localErr) {
          console.warn('Gagal mengirim subscription ke local push server:', localErr.message);
        }
      }

    const plainSub = JSON.parse(JSON.stringify(subscription));
    await IdbHelper.saveSubscription(plainSub);
  } catch (err) {
    console.error('Gagal menyimpan subscription lokal:', err.message);
  }

  return subscription;
}

// Melakukan unsubscribe dari push notification
async function unsubscribePush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    console.log('Push subscription dibatalkan (local).');
    // Hapus dari server dan lokal
    try {
      await StoryApi.unregisterPushSubscription(endpoint);
    } catch (err) {
      console.warn('Gagal memanggil endpoint unregister di server:', err.message);
    }
    try {
      await IdbHelper.deleteSubscription(endpoint);
    } catch (err) {
      console.warn('Gagal menghapus subscription dari IDB:', err.message);
    }
  }
}

// Inisialisasi Toggle Notifikasi
async function initNotificationToggle() {
  const toggle = document.getElementById('notification-toggle');
  if (!toggle) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  // Set status awal toggle
  toggle.checked = !!subscription;

  // Tambahkan listener ke toggle
  toggle.addEventListener('change', async (event) => {
    const isChecked = event.target.checked;
    try {
      if (isChecked) {
        await requestNotificationPermission();
        await subscribePush();
        alert('Notifikasi berhasil diaktifkan!');
      } else {
        await unsubscribePush();
        alert('Notifikasi berhasil dinonaktifkan.');
      }
      toggle.checked = isChecked;
    } catch (error) {
      console.error('Gagal mengubah status notifikasi:', error.message);
      alert(`Gagal: ${error.message}`);
      toggle.checked = !isChecked;
    }
  });
}

export { initNotificationToggle };