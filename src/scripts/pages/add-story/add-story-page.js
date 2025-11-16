import L from 'leaflet';
import StoryApi from '../../data/story-api';
import IdbHelper from '../../data/idb-helper';

class AddStoryPage {
  constructor() {
    this._map = null;
    this._selectedLat = null;
    this._selectedLon = null;
    this._mapMarker = null;
    this._stream = null;
    this._capturedFile = null;
  }

  render() {
    return `
      <section class="add-story-page">
        <h2>Upload Cerita Baru</h2>
        <p>Bagikan momen spesialmu ke seluruh dunia!</p>

        <form id="add-story-form" class="add-story-form" novalidate>
          
          <!-- Pilihan Kamera / Upload -->
          <div class="form-group form-group-toggle">
            <button type="button" id="camera-button" class="auth-button" aria-label="Buka Kamera">Buka Kamera</button>
            <button type="button" id="upload-button" class="auth-button" aria-label="Upload File">Upload File</button>
          </div>

          <!-- Preview & Input File -->
          <div class="form-group" id="file-upload-container">
            <label for="photo">Upload Foto:</label>
            <input type="file" id="photo" name="photo" class="form-control" accept="image/png, image/jpeg" required>
          </div>
          
          <!-- Tampilan Kamera -->
          <div class="form-group" id="camera-container" style="display: none;">
            <video id="camera-feed" autoplay playsinline></video>
            <div class="camera-buttons">
              <button type="button" id="capture-button" class="auth-button">Ambil Gambar</button>
              <button type="button" id="close-camera-button" class="auth-button">Tutup Kamera</button>
            </div>
          </div>
          
          <!-- Preview Gambar -->
          <div class="form-group">
            <label>Preview Foto:</label>
            <img id="image-preview" src="#" alt="Preview gambar yang akan di-upload" style="display: none; width: 100%; max-width: 400px; margin-top: 10px; border-radius: 8px;">
          </div>
          
          <!-- Deskripsi -->
          <div class="form-group">
            <label for="description">Deskripsi:</label>
            <textarea id="description" name="description" class="form-control" rows="4" required minlength="3"></textarea>
          </div>

          <!-- Peta untuk Pilih Lokasi -->
          <div class="form-group">
            <label>Pilih Lokasi di Peta:</label>
            <div id="add-story-map"></div>
            <input type="hidden" id="latitude" name="lat">
            <input type="hidden" id="longitude" name="lon">
          </div>

          <button type="submit" class="auth-button">Upload Cerita</button>
          
          <div id="error-message" class="error-message" role="alert" aria-live="assertive"></div>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this._initMap();
    this._initCameraControls();

    const addStoryForm = document.getElementById('add-story-form');
    addStoryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this._handleSubmit(event);
    });

    const photoInput = document.getElementById('photo');
    photoInput.addEventListener('change', () => {
      if (photoInput.files && photoInput.files[0]) {
        this._displayImagePreview(photoInput.files[0]);
        this._capturedFile = null; 
      }
    });
  }

  _initMap() {
    const mapElement = document.getElementById('add-story-map');
    if (!mapElement) return;
    if (this._map) this._map.remove();

    this._map = L.map(mapElement).setView([-2.5489, 118.0149], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this._map);

    this._map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      this._selectedLat = lat;
      this._selectedLon = lng;
      document.getElementById('latitude').value = lat;
      document.getElementById('longitude').value = lng;
      if (this._mapMarker) {
        this._map.removeLayer(this._mapMarker);
      }
      this._mapMarker = L.marker([lat, lng]).addTo(this._map);
      this._mapMarker.bindPopup('Lokasi dipilih!').openPopup();
    });
  }

  _initCameraControls() {
    const cameraButton = document.getElementById('camera-button');
    const uploadButton = document.getElementById('upload-button');
    const closeCameraButton = document.getElementById('close-camera-button');
    const captureButton = document.getElementById('capture-button');
    const cameraContainer = document.getElementById('camera-container');
    const fileUploadContainer = document.getElementById('file-upload-container');

    cameraButton.addEventListener('click', () => {
      cameraContainer.style.display = 'block';
      fileUploadContainer.style.display = 'none';
      this._startCamera();
    });
    uploadButton.addEventListener('click', () => {
      cameraContainer.style.display = 'none';
      fileUploadContainer.style.display = 'block';
      this._stopCamera();
    });
    closeCameraButton.addEventListener('click', () => {
      this._stopCamera();
    });
    captureButton.addEventListener('click', () => {
      this._captureImage();
    });
  }

  async _startCamera() {
    try {
      const videoElement = document.getElementById('camera-feed');
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this._stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        videoElement.srcObject = this._stream;
        videoElement.play();
      }
    } catch (error) {
      console.error('Error mengakses kamera:', error);
      this._showError(document.getElementById('error-message'), 'Gagal mengakses kamera. Pastikan izin diberikan.');
    }
  }

  _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach(track => track.stop());
      this._stream = null;
      document.getElementById('camera-feed').srcObject = null;
    }
    document.getElementById('camera-container').style.display = 'none';
    document.getElementById('file-upload-container').style.display = 'block';
  }

  _captureImage() {
    const videoElement = document.getElementById('camera-feed');
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext('2d').drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      this._capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      this._displayImagePreview(this._capturedFile);
      this._stopCamera();
    }, 'image/jpeg');
  }

  _displayImagePreview(file) {
    const preview = document.getElementById('image-preview');
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  async _handleSubmit(event) {
    const form = event.target;
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = '';
    errorMessageElement.style.display = 'none';

    const photoFromFile = form.photo.files[0];
    const photo = this._capturedFile || photoFromFile;
    const description = form.description.value;
    const lat = this._selectedLat;
    const lon = this._selectedLon;

    if (!photo || !description || !lat || !lon) {
      this._showError(errorMessageElement, 'Harap isi foto, deskripsi, dan pilih lokasi di peta.');
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.textContent = 'Mengunggah...';
    button.disabled = true;

    const storyData = {
      photo: photo,
      description: description,
      lat: lat,
      lon: lon,
    };

    try {
      if (navigator.onLine) {
        const formData = new FormData();
        formData.append('photo', storyData.photo);
        formData.append('description', storyData.description);
        formData.append('lat', storyData.lat);
        formData.append('lon', storyData.lon);

        await StoryApi.addStory(formData);
        
        this._capturedFile = null;
        await this._notify('Cerita baru berhasil ditambahkan', 'Cerita telah berhasil diunggah.');
        window.location.hash = 'storymap/#/stories';
      
      } else {
        throw new Error('Offline. Data akan disimpan untuk sync.');
      }
    } catch (error) {
      console.warn('Gagal upload (mungkin offline), menyimpan ke IndexedDB...', error.message);
      
      await IdbHelper.putStory(storyData);
      
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register('sync-offline-stories');
        });
      }
      
      this._capturedFile = null;
      await this._notify('Cerita disimpan (offline)', 'Cerita disimpan dan akan di-upload otomatis saat kembali online.');
      window.location.hash = 'storymap/#/stories'; 
    } finally {
      button.textContent = 'Upload Cerita';
      button.disabled = false;
    }
  }

  async _notify(title, body) {
    try {
      console.debug('[AddStory][_notify] called', { title, body, permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported' });
      if (typeof Notification === 'undefined') {
        alert(body);
        return;
      }

      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      console.debug('[AddStory][_notify] permission after request:', Notification.permission);

      if (Notification.permission === 'granted') {
        // Prefer showing notification via the active service worker registration
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          const registration = await navigator.serviceWorker.ready;
          console.debug('[AddStory][_notify] serviceWorker registration ready:', !!registration && typeof registration.showNotification === 'function');
          if (registration && registration.showNotification) {
            await registration.showNotification(title, {
              body,
              icon: 'icons/icon-192x192.png',
              badge: 'icons/icon-192x192.png',
              data: { url: '/storymap/#/stories' },
            });
            return;
          }
        }

        // Fallback to window Notification constructor
        try {
          // eslint-disable-next-line no-new
          new Notification(title, { body, icon: 'icons/icon-192x192.png' });
          return;
        } catch (err) {
          console.warn('Notification constructor failed:', err.message);
        }
      }

      // If permission denied or other failures, fallback to alert
      alert(body);
    } catch (err) {
      console.warn('Gagal menampilkan notifikasi:', err.message);
      alert(body);
    }
  }

  _showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

export default AddStoryPage;