// Simple IndexedDB wrapper - no external dependencies
const DB_NAME = 'helm-wallpaper-db';
const DB_VERSION = 1;
const STORE_NAME = 'wallpapers';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putRecord(record: CustomWallpaperRecord): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getRecord(id: string): Promise<CustomWallpaperRecord | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteRecord(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export interface CustomWallpaperRecord {
  id: string;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  DetectedTheme: 'light' | 'dark';
  createdAt: number;
}

const STORAGE_KEY = 'customWallpaper';

const MAX_STORAGE_BYTES = 32 * 1024 * 1024;

function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to load custom wallpaper'));
    };

    img.src = url;
  });
}

export async function prepareCustomWallpaper(
  file: File,
): Promise<{
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Unsupported wallpaper file');
  }

  if (file.size > MAX_STORAGE_BYTES) {
    throw new Error('Image is too large');
  }

  const image = await loadImage(file);

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  if (!width || !height) {
    throw new Error('Unable to determine wallpaper dimensions');
  }

  const dataUrl = await readFileAsDataUrl(file);

  return {
    dataUrl,
    blob: file,
    width,
    height,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to read image file'));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('Unable to read image file'));
    };

    reader.readAsDataURL(file);
  });
}

export async function getCustomWallpaper(): Promise<CustomWallpaperRecord | null> {
  return getRecord(STORAGE_KEY);
}

export async function saveCustomWallpaper(
  record: Omit<CustomWallpaperRecord, 'id'>,
): Promise<void> {
  const fullRecord: CustomWallpaperRecord = {
    ...record,
    id: STORAGE_KEY,
  };

  await putRecord(fullRecord);
}

export async function removeCustomWallpaper(): Promise<void> {
  await deleteRecord(STORAGE_KEY);
}