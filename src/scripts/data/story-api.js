import IdbHelper from './idb-helper'; // Impor helper IDB

const STORY_API_BASE_URL = 'https://story-api.dicoding.dev/v1';

class StoryApi {
  static _saveToken(token) {
    localStorage.setItem('authToken', token);
  }

  static getToken() {
    return localStorage.getItem('authToken');
  }

  static async logout() {
    localStorage.removeItem('authToken'); // Hapus dari localStorage
    await IdbHelper.deleteToken(); // Hapus dari IndexedDB
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
    // ... (kode register-mu sudah benar) ...
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
       await this.logout(); // Panggil logout (async)
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
        await this.logout(); // Panggil logout (async)
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
      throw new Error('401 (Token tidak ada)');
    }

    try {
      const response = await fetch(`${STORY_API_BASE_URL}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subscription),
      });

      if (response.status === 401) {
        await this.logout();
        throw new Error('401 (Token tidak valid)');
      }

      const responseJson = await response.json();
      if (responseJson.error) throw new Error(responseJson.message || 'Gagal menyimpan subscription');
      return responseJson;
    } catch (error) {
      console.error('registerPushSubscription failed:', error.message);
      throw error;
    }
  }

  static async unregisterPushSubscription(endpoint) {
    const token = this.getToken();
    if (!token) {
      throw new Error('401 (Token tidak ada)');
    }

    try {
      const response = await fetch(`${STORY_API_BASE_URL}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint }),
      });

      if (response.status === 401) {
        await this.logout();
        throw new Error('401 (Token tidak valid)');
      }

      const responseJson = await response.json();
      if (responseJson.error) throw new Error(responseJson.message || 'Gagal menghapus subscription');
      return responseJson;
    } catch (error) {
      console.error('unregisterPushSubscription failed:', error.message);
      throw error;
    }
  }
}

export default StoryApi;