export const StorageService = {
  get: async <T>(key: string): Promise<T | undefined> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
          resolve(result[key] as T);
        });
      });
    }
    
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) as T : undefined;
    } catch (error) {
      console.warn(`[Storage] Failed to read "${key}" from localStorage:`, error);
      return undefined;
    }
  },

  set: async <T>(key: string, value: T): Promise<void> => {
    // Check if running in Chrome extension context
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
      });
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
      console.log(`[Storage] Saved "${key}" to localStorage (development mode)`);
    } catch (error) {
      console.error(`[Storage] Failed to save "${key}" to localStorage:`, error);
      throw error;
    }
  },

  remove: async (key: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove(key, resolve);
      });
    }
    
    try {
      localStorage.removeItem(key);
      console.log(`[Storage] Removed "${key}" from localStorage (development mode)`);
    } catch (error) {
      console.error(`[Storage] Failed to remove "${key}" from localStorage:`, error);
      throw error;
    }
  }
};