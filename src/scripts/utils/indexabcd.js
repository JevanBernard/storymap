export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// src/scripts/index.js

// import 'leaflet/dist/leaflet.css';
// import '../styles/styles.css'; 
// import App from './app';

// // Jalankan aplikasi saat DOM siap
// document.addEventListener('DOMContentLoaded', () => {
//   // Buat instance App baru
//   const app = new App({
//     button: document.getElementById('drawer-button'),
//     drawer: document.getElementById('navigation-drawer'),
//     content: document.getElementById('app-content'),
//   });

//   window.addEventListener('hashchange', () => {
//     app.renderPage();
//   });
//   window.addEventListener('load', () => {
//     app.renderPage();
//   });
// });


