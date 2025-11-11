// src/scripts/data/idb-helper.js
// PERBAIKAN: Menambahkan 'AUTH_STORE_NAME' (v2)

import { openDB } from 'idb';

const DB_NAME = 'storymap-db';
const DB_VERSION = 2; // NAIKKAN VERSI DB
const OFFLINE_STORE_NAME = 'offline_stories';
const AUTH_STORE_NAME = 'auth_token'; // <-- STORE BARU

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    // Buat object store 'offline_stories'
    if (oldVersion < 1 || !db.objectStoreNames.contains(OFFLINE_STORE_NAME)) {
      db.createObjectStore(OFFLINE_STORE_NAME, {
        keyPath: 'id',
        autoIncrement: true,
      });
    }
    
    // VERSI 2: Buat object store 'auth_token'
    if (oldVersion < 2 || !db.objectStoreNames.contains(AUTH_STORE_NAME)) {
      db.createObjectStore(AUTH_STORE_NAME);
    }
  },
});

const IdbHelper = {
  // --- Fungsi Cerita Offline ---
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

  // --- Fungsi Token (BARU) ---
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
};

export default IdbHelper;