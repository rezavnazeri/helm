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
  blob: Blob;
  width: number;
  height: number;
  DetectedTheme: 'light' | 'dark';
  createdAt: number;
}

const STORAGE_KEY = 'customWallpaper';

const MAX_STORAGE_BYTES = 32 * 1024 * 1024;

const MAX_EDGE = 2560;
const WALLPAPER_QUALITY = 0.88;

/** Shrinks (and re-encodes as WebP) images that are larger than they need to be. */
async function downscale(file: Blob, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  if (scale === 1 && file.size <= 1.5 * 1024 * 1024) return { blob: file, width, height };

  const target = { width: Math.round(width * scale), height: Math.round(height * scale) };
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  canvas.getContext('2d')?.drawImage(image, 0, 0, target.width, target.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WALLPAPER_QUALITY),
  );

  return blob && (scale < 1 || blob.size < file.size) ? { blob, ...target } : { blob: file, width, height };
}

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

  return downscale(file, image, width, height);
}

function slimRecord(record: CustomWallpaperRecord): CustomWallpaperRecord {
  if (!('dataUrl' in record)) return record;

  const slim: CustomWallpaperRecord = {
    id: record.id,
    blob: record.blob,
    width: record.width,
    height: record.height,
    DetectedTheme: record.DetectedTheme,
    createdAt: record.createdAt,
  };
  void putRecord(slim);
  return slim;
}

export async function dropLegacyDataUrl(): Promise<void> {
  const record = await getRecord(STORAGE_KEY);
  if (record) slimRecord(record);
}

export async function getCustomWallpaper(): Promise<CustomWallpaperRecord | null> {
  const record = await getRecord(STORAGE_KEY);
  return record ? slimRecord(record) : null;
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