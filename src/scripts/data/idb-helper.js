import { openDB } from 'idb';

const DB_NAME = 'storymap-db';
const DB_VERSION = 4;
const OFFLINE_STORE_NAME = 'offline_stories';
const AUTH_STORE_NAME = 'auth_token';
const FAVORITES_STORE_NAME = 'favorites';
const SUBSCRIPTIONS_STORE_NAME = 'push_subscriptions';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    // Buat object store 'offline_stories'
    if (oldVersion < 1 || !db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
      db.createObjectStore(OFFLINE_STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true,
      });
    }
    
    // Buat object store 'auth_token'
    if (oldVersion < 2 || !db.objectStoreNames.contains(AUTH_STORE_NAME)) {
      db.createObjectStore(AUTH_STORE_NAME);
    }
    // object store 'favorites' menyimpan cerita favorit (id dari API sebagai key)
    if (oldVersion < 3 || !db.objectStoreNames.contains(FAVORITES_STORE_NAME)) {
      db.createObjectStore(FAVORITES_STORE_NAME, {
        keyPath: 'id',
      });
    }
    // object store menyimpan push subscription secara lokal
    if (oldVersion < 4 || !db.objectStoreNames.contains(SUBSCRIPTIONS_STORE_NAME)) {
      db.createObjectStore(SUBSCRIPTIONS_STORE_NAME, {
        keyPath: 'endpoint',
      });
    }
  },
});

const IdbHelper = {
  // Fungsi Cerita Offline
  async putStory(story) {
    const db = await dbPromise;
    return db.put(OFFLINE_STORE_NAME, story);
  },
  async getAllStories() {
    const db = await dbPromise;
    return db.getAll(OFFLINE_STORE_NAME);
  },
  async deleteStory(id) {
    const db = await dbPromise;
    return db.delete(OFFLINE_STORE_NAME, id);
  },

  // Fungsi Token
  async saveToken(token) {
    const db = await dbPromise;
    return db.put(AUTH_STORE_NAME, token, 'authTokenKey');
  },
  async getToken() {
    const db = await dbPromise;
    return db.get(AUTH_STORE_NAME, 'authTokenKey');
  },
  async deleteToken() {
    const db = await dbPromise;
    return db.delete(AUTH_STORE_NAME, 'authTokenKey');
  },
  // FAVORITES: menyimpan, mengambil semua, menghapus
  async addFavorite(story) {
    const db = await dbPromise;
    if (!story.id) story.id = `fav-${Date.now()}`;
    return db.put(FAVORITES_STORE_NAME, story);
  },
  async getAllFavorites() {
    const db = await dbPromise;
    return db.getAll(FAVORITES_STORE_NAME);
  },
  async deleteFavorite(id) {
    const db = await dbPromise;
    return db.delete(FAVORITES_STORE_NAME, id);
  },
  // Cek apakah story sudah menjadi favorit
  async isFavorite(id) {
    if (!id) return false;
    const db = await dbPromise;
    try {
      const fav = await db.get(FAVORITES_STORE_NAME, id);
      return !!fav;
    } catch (err) {
      console.warn('isFavorite check failed:', err.message);
      return false;
    }
  },
  // PUSH SUBSCRIPTIONS: simpan, ambil semua, hapus
  async saveSubscription(subscription) {
    const db = await dbPromise;
    return db.put(SUBSCRIPTIONS_STORE_NAME, subscription);
  },
  async getAllSubscriptions() {
    const db = await dbPromise;
    return db.getAll(SUBSCRIPTIONS_STORE_NAME);
  },
  async deleteSubscription(endpoint) {
    const db = await dbPromise;
    return db.delete(SUBSCRIPTIONS_STORE_NAME, endpoint);
  },
};

export default IdbHelper;