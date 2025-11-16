const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'; 
import StoryApi from '../data/story-api';
import IdbHelper from '../data/idb-helper';

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

async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Izin notifikasi ditolak.');
  }
  return permission;
}

async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push messaging tidak didukung.');
  }

  const registration = await navigator.serviceWorker.ready;
  const vapidKey = VAPID_PUBLIC_KEY;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: _urlB64ToUint8Array(vapidKey),
  });
  
  console.log('Push subscription berhasil dibuat:', subscription);
    
  try {
    const subJson = subscription.toJSON();
    const cleanSubscription = {
      endpoint: subJson.endpoint,
      keys: subJson.keys,
    };

    // Kirim subscription yang sudah bersih ke server API Dicoding
    await StoryApi.registerPushSubscription(cleanSubscription);
    console.log('Subscription berhasil dikirim ke server API Dicoding.');

    // Simpan subscription (versi lengkap) ke IndexedDB
    const plainSub = JSON.parse(JSON.stringify(subscription));
    await IdbHelper.saveSubscription(plainSub);

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

async function unsubscribePush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    try {
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

async function initNotificationToggle() {
  const toggle = document.getElementById('notification-toggle');
  if (!toggle) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    toggle.checked = !!subscription;

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
        
        // Error handling yang lebih baik
        const errorMsg = error.message.includes('Token') ? 
          'Silakan login terlebih dahulu untuk mengaktifkan notifikasi.' :
          `${error.message || 'Gagal mengubah pengaturan notifikasi.'}`;
        alert(errorMsg);
        
        toggle.checked = !isChecked;
      }
    });
  } catch (err) {
    console.error('Gagal inisialisasi toggle notifikasi (SW tidak siap?):', err.message);
    toggle.disabled = true; // Matikan toggle jika SW gagal
  }
}

export { initNotificationToggle };