import L from 'leaflet';
import StoryApi from '../../data/story-api';
import IdbHelper from '../../data/idb-helper';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

class StoriesPage {
  constructor() {
    this._map = null;
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

  render() {
    return `
      <section class="stories-page">
        <h2>Jelajahi Cerita di Peta</h2>
        <p>Lihat cerita dari seluruh penjuru!</p>
        <div class="favorites-controls">
          <button id="show-favorites-btn" class="btn">Lihat Favorit</button>
        </div>
        <div id="favorites-search-container" style="display:none; margin-bottom: 16px;">
          <input type="text" id="favorites-search" placeholder="Cari favorit berdasarkan judul..." class="search-input" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        <div id="favorites-list-container" class="story-list" style="display:none; margin-bottom: 16px;"></div>
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
      // Load favorites ids into a Set for fast lookup
      this._favoriteIds = new Set((await IdbHelper.getAllFavorites()).map(f => f.id));
      this._allFavorites = await IdbHelper.getAllFavorites(); // Store all favorites for search
      this._renderStoryList(stories);
      // Render favorites list dan pasang listener
      await this._renderFavoritesList();
      const favBtn = document.getElementById('show-favorites-btn');
      if (favBtn) {
        favBtn.addEventListener('click', () => {
          const favContainer = document.getElementById('favorites-list-container');
          const searchContainer = document.getElementById('favorites-search-container');
          if (!favContainer) return;
          const isHidden = favContainer.style.display === 'none';
          favContainer.style.display = isHidden ? 'block' : 'none';
          if (searchContainer) searchContainer.style.display = isHidden ? 'block' : 'none';
        });
      }
      // Pasang listener search
      const searchInput = document.getElementById('favorites-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.toLowerCase().trim();
          this._filterFavorites(query);
        });
      }
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
      // Tambahkan tombol favorit
      const favAction = document.createElement('button');
      favAction.className = 'btn btn--small btn--favorite';
      favAction.setAttribute('data-story-id', story.id || '');
      favAction.setAttribute('aria-label', `Simpan cerita ${storyName}`);

      // Icon + label structure
      favAction.innerHTML = `
        <span class="fav-icon" aria-hidden="true">★</span>
        <span class="fav-label">Simpan</span>
      `;

      // Jika sudah ada di favorites, tampilkan state tersimpan
      const isFav = story.id && this._favoriteIds && this._favoriteIds.has(story.id);
      if (isFav) {
        favAction.classList.add('saved');
        favAction.querySelector('.fav-label').textContent = 'Tersimpan';
        favAction.disabled = true;
        favAction.setAttribute('aria-pressed', 'true');
      }

      favAction.addEventListener('click', async () => {
        try {
          // Prevent double save
          favAction.disabled = true;
          await IdbHelper.addFavorite({
            id: story.id,
            name: story.name,
            description: story.description,
            photoUrl: story.photoUrl,
            createdAt: story.createdAt,
            lat: story.lat,
            lon: story.lon,
          });
          // Update local cache and UI
          if (!this._favoriteIds) this._favoriteIds = new Set();
          this._favoriteIds.add(story.id);
          favAction.classList.add('saved');
          favAction.querySelector('.fav-label').textContent = 'Tersimpan';
          favAction.setAttribute('aria-pressed', 'true');
          // refresh favorites list
          await this._renderFavoritesList();
        } catch (err) {
          console.error('Gagal menyimpan favorit:', err);
          alert('Gagal menyimpan favorit. Coba lagi.');
          favAction.disabled = false;
        }
      });

      // let user find actions area
      const contentEl = storyItem.querySelector('.story-item__content') || storyItem;
      contentEl.appendChild(favAction);
    });
  }

  async _renderFavoritesList() {
    const favContainer = document.getElementById('favorites-list-container');
    if (!favContainer) return;
    try {
      const favorites = await IdbHelper.getAllFavorites();
      this._allFavorites = favorites; // Store for search/filter
      if (!favorites || favorites.length === 0) {
        favContainer.innerHTML = '<p class="story-item story-item--no-image">Belum ada favorit tersimpan.</p>';
        return;
      }
      this._renderFavoritesContent(favorites);
    } catch (err) {
      console.error('Gagal memuat favorit:', err);
      favContainer.innerHTML = '<p class="story-item story-item--no-image">Gagal memuat favorit.</p>';
    }
  }

  _renderFavoritesContent(favorites) {
    const favContainer = document.getElementById('favorites-list-container');
    if (!favContainer) return;
    
    if (!favorites || favorites.length === 0) {
      favContainer.innerHTML = '<p class="story-item story-item--no-image">Belum ada favorit sesuai pencarian.</p>';
      return;
    }
    
    favContainer.innerHTML = '';
    favorites.forEach(fav => {
      const favItem = document.createElement('article');
      favItem.classList.add('story-item');
      const favHTML = `
        <div class="story-item__content">
          <h4 class="story-item__title">${fav.name || 'Cerita Tanpa Nama'}</h4>
          <span class="story-item__date">${this._formatDate(fav.createdAt || Date.now())}</span>
          <p class="story-item__description">${(fav.description || '').substring(0, 140)}</p>
        </div>
      `;
      favItem.innerHTML = favHTML;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn--small btn--danger';
      removeBtn.textContent = 'Hapus';
      removeBtn.addEventListener('click', async () => {
        try {
          await IdbHelper.deleteFavorite(fav.id);
          // update local favorite ids and UI
          if (this._favoriteIds && this._favoriteIds.has(fav.id)) {
            this._favoriteIds.delete(fav.id);
          }
          this._renderFavoritesList();
          // update story list buttons if present
          const btn = document.querySelector(`button[data-story-id="${fav.id}"]`);
          if (btn) {
            btn.innerHTML = `<span class="fav-icon" aria-hidden="true">★</span><span class="fav-label">Simpan</span>`;
            btn.classList.remove('saved');
            btn.disabled = false;
            btn.setAttribute('aria-pressed', 'false');
          }
        } catch (err) {
          console.error('Gagal hapus favorit:', err);
          alert('Gagal menghapus favorit. Coba lagi.');
        }
      });

      favItem.appendChild(removeBtn);
      favContainer.appendChild(favItem);
    });
  }

  _filterFavorites(query) {
    if (!this._allFavorites) return;
    
    let filtered = this._allFavorites;
    if (query) {
      filtered = this._allFavorites.filter(fav => 
        (fav.name || '').toLowerCase().includes(query) ||
        (fav.description || '').toLowerCase().includes(query)
      );
    }
    
    this._renderFavoritesContent(filtered);
  }
}

export default StoriesPage;