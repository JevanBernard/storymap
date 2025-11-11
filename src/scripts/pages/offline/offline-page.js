import IdbHelper from '../../data/idb-helper';

class OfflinePage {
  constructor() {
    this._stories = [];
  }
  
  render() {
    return `
      <section class="offline-page auth-page">
        <h2 class="auth-page__title">Cerita Offline</h2>
        <p>
          Ini adalah cerita yang kamu buat saat offline.
          Cerita ini akan di-upload otomatis saat kamu kembali online.
        </p>
        <div id="offline-list-container" class="story-list">
          <p>Memuat cerita offline...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const storyContainer = document.getElementById('offline-list-container');
    
    try {
      this._stories = await IdbHelper.getAllStories();
      
      if (this._stories.length === 0) {
        storyContainer.innerHTML = '<p class="story-item story-item--no-image">Tidak ada cerita offline yang menunggu.</p>';
        return;
      }
      
      this._renderStoryList(storyContainer);

    } catch (error) {
      storyContainer.innerHTML = `<p class="story-item story-item--no-image">Gagal memuat cerita offline: ${error.message}</p>`;
    }
  }

  _renderStoryList(container) {
    container.innerHTML = '';
    
    this._stories.forEach(story => {
      const storyItem = document.createElement('article');
      storyItem.classList.add('story-item', 'story-item--offline');
      
      const photoUrl = URL.createObjectURL(story.photo);
      
      storyItem.innerHTML = `
        <img src="${photoUrl}" alt="Cerita offline: ${story.description.substring(0, 30)}...">
        <div class="story-item__content">
          <h4 class="story-item__title">Status: Menunggu Sync...</h4>
          <p class="story-item__description">${story.description}</p>
          <button type="button" class="auth-button delete-button" data-id="${story.id}">
            Hapus dari Antrian
          </button>
        </div>
      `;
      
      storyItem.querySelector('.delete-button').addEventListener('click', async (event) => {
        const storyId = Number(event.target.dataset.id);
        await this._deleteStory(storyId, storyItem, photoUrl);
      });

      container.appendChild(storyItem);

      storyItem.querySelector('img').onload = () => {
        URL.revokeObjectURL(photoUrl);
      };
    });
  }

  async _deleteStory(id, element, photoUrl) {
    try {
      await IdbHelper.deleteStory(id);
      URL.revokeObjectURL(photoUrl);
      element.remove();
      alert('Cerita offline berhasil dihapus dari antrian.');

      if (document.getElementById('offline-list-container').childElementCount === 0) {
         document.getElementById('offline-list-container').innerHTML = 
           '<p class="story-item story-item--no-image">Tidak ada cerita offline yang menunggu.</p>';
      }
    } catch (error) {
      alert(`Gagal menghapus cerita: ${error.message}`);
    }
  }
}

export default OfflinePage;