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
    throw new Error('Push messaging tidak didukung pada browser Anda.');
  }

  const registration = await navigator.serviceWorker.ready;
  // Gunakan default VAPID key dari Dicoding API
  const vapidKey = DEFAULT_VAPID_PUBLIC_KEY;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: _urlB64ToUint8Array(vapidKey),
  });
  
  console.log('Push subscription berhasil dibuat:', subscription);
  
  try {
    // Kirim subscription ke server API Dicoding (endpoint harus terdaftar dengan token)
    await StoryApi.registerPushSubscription(subscription);
    console.log('Subscription berhasil dikirim ke server API Dicoding.');
    
    // Simpan subscription lokal juga untuk referensi
    const plainSub = JSON.parse(JSON.stringify(subscription));
    await IdbHelper.saveSubscription(plainSub);
    console.log('Subscription disimpan ke IndexedDB.');
    
    return subscription;
  } catch (err) {
    console.error('Gagal mendaftarkan subscription:', err.message);
    // Jika gagal, unsubscribe dari browser dan hapus dari IDB
    await subscription.unsubscribe();
    try {
      await IdbHelper.deleteSubscription(subscription.endpoint);
    } catch (idbErr) {
      console.warn('Gagal menghapus subscription dari IDB:', idbErr.message);
    }
    throw err; // Re-throw untuk ditangani di UI
  }
}

// Melakukan unsubscribe dari push notification
async function unsubscribePush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    try {
      // Unsubscribe dari browser
      await subscription.unsubscribe();
      console.log('Push subscription dibatalkan dari browser.');
      
      // Notifikasi server untuk membatalkan subscription
      try {
        await StoryApi.unregisterPushSubscription(endpoint);
        console.log('Subscription dibatalkan dari server API Dicoding.');
      } catch (err) {
        console.warn('Gagal membatalkan subscription dari server:', err.message);
      }
      
      // Hapus dari IndexedDB
      try {
        await IdbHelper.deleteSubscription(endpoint);
        console.log('Subscription dihapus dari IndexedDB.');
      } catch (err) {
        console.warn('Gagal menghapus subscription dari IDB:', err.message);
      }
    } catch (err) {
      console.error('Gagal membatalkan subscription:', err.message);
      throw err;
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
      // Tampilkan pesan error yang user-friendly
      const errorMsg = error.message.includes('Token') ? 
        'Silakan login terlebih dahulu untuk mengaktifkan notifikasi.' :
        `${error.message || 'Gagal mengubah pengaturan notifikasi.'}`;
      alert(errorMsg);
      toggle.checked = !isChecked;
    }
  });
}

export { initNotificationToggle };