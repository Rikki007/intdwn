/**
 * INTDWN - IndexedDB Storage Module
 */

import { DB_NAME, DB_VERSION, STORES } from './constants.js';

class Storage {
    constructor() {
        this.db = null;
        this.isReady = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open database');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // User store
                if (!db.objectStoreNames.contains(STORES.USER)) {
                    const userStore = db.createObjectStore(STORES.USER, { keyPath: 'id', autoIncrement: true });
                    userStore.createIndex('name', 'name', { unique: false });
                    userStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Test results store
                if (!db.objectStoreNames.contains(STORES.TEST_RESULTS)) {
                    const resultsStore = db.createObjectStore(STORES.TEST_RESULTS, { keyPath: 'id', autoIncrement: true });
                    resultsStore.createIndex('testId', 'testId', { unique: false });
                    resultsStore.createIndex('date', 'date', { unique: false });
                    resultsStore.createIndex('testId_date', ['testId', 'date'], { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    const settingsStore = db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                    settingsStore.createIndex('key', 'key', { unique: true });
                }
            };
        });
    }

    async getStore(storeName, mode = 'readonly') {
        if (!this.db) {
            await this.init();
        }
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    // Generic CRUD operations
    async get(storeName, key) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(storeName, data) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // User-specific methods
    async getUser() {
        const users = await this.getAll(STORES.USER);
        return users.length > 0 ? users[0] : null;
    }

    async saveUser(userData) {
        const existingUser = await this.getUser();
        if (existingUser) {
            return this.put(STORES.USER, { ...existingUser, ...userData });
        }
        return this.add(STORES.USER, { ...userData, createdAt: new Date().toISOString() });
    }

    // Test results methods
    async saveTestResult(result) {
        const data = {
            ...result,
            date: new Date().toISOString()
        };
        return this.add(STORES.TEST_RESULTS, data);
    }

    async getTestResults(testId = null) {
        const allResults = await this.getAll(STORES.TEST_RESULTS);
        if (testId) {
            return allResults.filter(r => r.testId === testId);
        }
        return allResults.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async getLatestTestResult(testId) {
        const results = await this.getTestResults(testId);
        return results.length > 0 ? results[0] : null;
    }

    // Settings methods
    async getSetting(key, defaultValue = null) {
        try {
            const result = await this.get(STORES.SETTINGS, key);
            return result ? result.value : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    async setSetting(key, value) {
        return this.put(STORES.SETTINGS, { key, value });
    }

    async getAllSettings() {
        const settings = await this.getAll(STORES.SETTINGS);
        return settings.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {});
    }

    // Export/Import
    async exportData() {
        const user = await this.getUser();
        const testResults = await this.getTestResults();
        const settings = await this.getAllSettings();

        return {
            version: 1,
            exportDate: new Date().toISOString(),
            user,
            testResults,
            settings
        };
    }

    async importData(data) {
        if (data.user) {
            await this.clear(STORES.USER);
            await this.add(STORES.USER, data.user);
        }

        if (data.testResults && Array.isArray(data.testResults)) {
            await this.clear(STORES.TEST_RESULTS);
            for (const result of data.testResults) {
                await this.add(STORES.TEST_RESULTS, result);
            }
        }

        if (data.settings) {
            await this.clear(STORES.SETTINGS);
            for (const [key, value] of Object.entries(data.settings)) {
                await this.setSetting(key, value);
            }
        }

        return true;
    }

    // Clear all data
    async clearAllData() {
        await this.clear(STORES.USER);
        await this.clear(STORES.TEST_RESULTS);
        await this.clear(STORES.SETTINGS);
        return true;
    }
}

export const storage = new Storage();
export default storage;
