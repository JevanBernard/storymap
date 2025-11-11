import 'leaflet/dist/leaflet.css';
import '../styles/styles.css'; 
import App from './app';
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
  
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('sw.js');

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

    wb.register();
  }
});