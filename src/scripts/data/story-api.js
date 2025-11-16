import IdbHelper from './idb-helper'; // Impor helper IDB

const STORY_API_BASE_URL = 'https://story-api.dicoding.dev/v1';

class StoryApi {
  // ... (Fungsi _saveToken, getToken, logout, login, register, getAllStories, addStory tetap sama) ...
  static _saveToken(token) {
    localStorage.setItem('authToken', token);
  }

  static getToken() {
    return localStorage.getItem('authToken');
  }

  static async logout() {
    localStorage.removeItem('authToken'); 
    await IdbHelper.deleteToken(); 
  }

  static async login(email, password) {
    try {
      const response = await fetch(`${STORY_API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      if (responseJson.loginResult && responseJson.loginResult.token) {
        this._saveToken(responseJson.loginResult.token);
      }
      
      return responseJson;
      
    } catch (error) {
      console.error('Login failed:', error.message);
      throw error;
    }
  }

  static async register(name, email, password) {
    try {
      const response = await fetch(`${STORY_API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      return responseJson;
    } catch (error) {
      console.error('Register failed:', error.message);
      throw error;
    }
  }

  static async getAllStories() {
    const token = this.getToken();
    if (!token) {
      throw new Error('401 (Token tidak ada)');
    }

    try {
      const response = await fetch(`${STORY_API_BASE_URL}/stories`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.status === 401) {
       await this.logout();
        throw new Error('401 (Token tidak valid)');
      }

      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      return responseJson.listStory;
    } catch (error) {
      console.error('Failed to fetch stories:', error.message);
      throw error;
    }
  }

  static async addStory(formData) {
    const token = this.getToken(); 
    if (!token) {
      throw new Error('401 (Token tidak ditemukan di localStorage)');
    }

    try {
      const response = await fetch(`${STORY_API_BASE_URL}/stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (response.status === 401) {
        await this.logout();
        throw new Error('401 (Token tidak valid)');
      }

      const responseJson = await response.json();

      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      return responseJson;
    } catch (error) {
      console.error('Failed to add story:', error.message);
      throw error;
    }
  }

  static async registerPushSubscription(subscription) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token tidak ada. Silakan login terlebih dahulu.');
    }

    try {
      // Endpoint ini sudah benar (POST .../subscribe)
      const response = await fetch(`${STORY_API_BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subscription),
      });

      if (response.status === 401) {
        await this.logout();
        throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
      }

      const responseJson = await response.json();
      if (responseJson.error) throw new Error(responseJson.message || 'Gagal menyimpan subscription ke server.');
      return responseJson;
    } catch (error) {
      console.error('registerPushSubscription failed:', error.message);
      throw new Error(`Gagal mendaftarkan notifikasi: ${error.message}`);
    }
  }

  /**
   * PERBAIKAN: Menggunakan method DELETE dan endpoint /subscribe
   */
  static async unregisterPushSubscription(endpoint) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token tidak ada. Silakan login terlebih dahulu.');
    }

    try {
      // PERBAIKAN 1: URL-nya TETEAP /subscribe
      // PERBAIKAN 2: Ganti method ke 'DELETE'
      const response = await fetch(`${STORY_API_BASE_URL}/notifications/subscribe`, {
        method: 'DELETE', // <-- INI PERBAIKANNYA
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint }), // Body-nya sudah benar
      });

      if (response.status === 401) {
        await this.logout();
        throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
      }

      const responseJson = await response.json();
      if (responseJson.error) throw new Error(responseJson.message || 'Gagal membatalkan notifikasi dari server.');
      return responseJson;
    } catch (error) {
      console.error('unregisterPushSubscription failed:', error.message);
      throw new Error(`Gagal membatalkan notifikasi: ${error.message}`);
    }
  }
}

export default StoryApi;