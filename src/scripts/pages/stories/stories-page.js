// src/pages/stories/stories-page.js
// PERBAIKAN: 'render()' dibuat sinkron

import L from 'leaflet';
import StoryApi from '../../data/story-api';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

class StoriesPage {
  constructor() {
    this._map = null;
    
    // Fix untuk marker Leaflet (sudah benar)
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
    });
  }

  _formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  }

  // PERBAIKAN: 'render()' dibuat sinkron
  render() {
    return `
      <section class="stories-page">
        <h2>Jelajahi Cerita di Peta</h2>
        <p>Lihat cerita dari seluruh penjuru!</p>
        <div id="map"></div>
        <h3>Daftar Cerita</h3>
        <div id="story-list-container" class="story-list">
          <p>Memuat cerita...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    try {
      const stories = await StoryApi.getAllStories();
      this._initMap(stories);
      this._renderStoryList(stories);
    } catch (error) {
      if (error.message.includes('401')) { 
        alert('Sesi Anda habis. Silakan login kembali.');
        window.location.hash = '#/'; 
      } else {
        const storyContainer = document.getElementById('story-list-container');
        storyContainer.innerHTML = `<p class="story-item story-item--no-image">Gagal memuat cerita: ${error.message}. Coba refresh halaman.</p>`;
      }
    }
  }

  _initMap(stories) {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    if (this._map) {
      this._map.remove();
    }

    const centerLat = -2.5489;
    const centerLon = 118.0149;
    
    this._map = L.map(mapElement).setView([centerLat, centerLon], 5);

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    const stamenTonerLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png', {
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ...'
    });
    const baseMaps = {
      "OpenStreetMap": osmLayer,
      "Mode Gelap": stamenTonerLayer
    };
    L.control.layers(baseMaps).addTo(this._map);
    osmLayer.addTo(this._map);

    stories.forEach(story => {
      if (story.lat && story.lon) {
        const storyName = story.name || 'Tanpa Nama';
        const storyDate = this._formatDate(story.createdAt); // Kriteria 2 (Teks ke-3)

        L.marker([story.lat, story.lon])
          .addTo(this._map)
          .bindPopup(`
            <b>${storyName}</b><br>
            <small>${storyDate}</small><br>
            ${story.photoUrl ? `<img src="${story.photoUrl}" alt="Foto ${storyName}" style="width: 100px; margin-top: 5px;">` : ''}
            <p style="font-size: 12px; max-width: 150px; white-space: pre-wrap;">${(story.description || '...').substring(0, 100)}...</p>
          `);
      }
    });
  }

  _renderStoryList(stories) {
    const storyContainer = document.getElementById('story-list-container');
    if (!storyContainer) return; 
    
    if (stories.length === 0) {
      storyContainer.innerHTML = '<p class="story-item story-item--no-image">Belum ada cerita.</p>';
      return;
    }
    storyContainer.innerHTML = '';

    stories.forEach(story => {
      const storyName = story.name || 'Cerita Tanpa Nama';
      const storyDescription = story.description || 'Tidak ada deskripsi.';
      const storyDate = this._formatDate(story.createdAt); // Kriteria 2 (Teks ke-3)
      
      const storyItem = document.createElement('article');
      storyItem.classList.add('story-item');

      let storyHTML = '';
      if (story.photoUrl) {
        storyItem.classList.add('story-item--with-image');
        storyHTML = `
          <img src="${story.photoUrl}" alt="Cerita oleh ${storyName}: ${storyDescription.substring(0, 50)}...">
          <div class="story-item__content">
            <h4 class="story-item__title">${storyName}</h4>
            <span class="story-item__date">${storyDate}</span> <!-- Teks ke-3 -->
            <p class="story-item__description">${storyDescription}</p>
          </div>
        `;
      } else {
        storyItem.classList.add('story-item--no-image');
        storyHTML = `
          <div class="story-item__content">
            <h4 class="story-item__title">${storyName}</h4>
            <span class="story-item__date">${storyDate}</span> <!-- Teks ke-3 -->
            <p class="story-item__description">${storyDescription}</p>
          </div>
        `;
      }
      storyItem.innerHTML = storyHTML;
      storyContainer.appendChild(storyItem);
    });
  }
}

export default StoriesPage;