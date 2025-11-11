// src/scripts/index.js
// PERBAIKAN: Menggunakan sintaks Workbox v6+ ('new Workbox')

import 'leaflet/dist/leaflet.css';
import '../styles/styles.css'; 
import App from './app';
// PERBAIKAN: Impor 'Workbox' (class), bukan 'register' (fungsi)
import { Workbox } from 'workbox-window';

document.addEventListener('DOMContentLoaded', () => {
  const app = new App({
    drawerButton: document.getElementById('drawer-button'),
    navigationDrawer: document.getElementById('navigation-drawer'),
    content: document.getElementById('app-content'),
  });

  window.addEventListener('hashchange', () => {
    app.renderPage();
  });
  window.addEventListener('load', () => {
    app.renderPage();
  });
  
  // PERBAIKAN: Gunakan sintaks 'Workbox' class (v6+)
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js'); // Buat instance Workbox

    wb.addEventListener('waiting', () => {
      console.log('Service worker baru sedang menunggu untuk aktif.');
    });

    wb.addEventListener('activated', (event) => {
      if (!event.isUpdate) {
        console.log('Service worker diaktifkan untuk pertama kali!');
      } else {
        console.log('Service worker telah diperbarui.');
      }
    });

    // Daftarkan service worker
    wb.register();
  }
});