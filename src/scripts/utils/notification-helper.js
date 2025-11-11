const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'; 

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
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: _urlB64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  
  console.log('Push subscription berhasil:', subscription);
  return subscription;
}

// Melakukan unsubscribe dari push notification
async function unsubscribePush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    console.log('Push subscription dibatalkan.');
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