import { StorageService } from '@/services/storage';

/**
 * Persistent favicon cache for Quick Access.
 *
 * Icons are downloaded once, stored as data URLs in extension storage and then
 * served locally, so opening a new tab does not trigger any favicon requests.
 * Entries are keyed by origin and refreshed in the background once they are
 * older than MAX_AGE_MS (the stale icon keeps being shown in the meantime).
 */

const STORAGE_KEY = 'faviconCache';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_ICON_BYTES = 256 * 1024;

interface CacheEntry {
  data: string;
  savedAt: number;
}

type CacheRecord = Record<string, CacheEntry>;

export interface FaviconSnapshot {
  /** Cache key -> data URL. */
  icons: Record<string, string>;
  /** Keys whose icon is older than MAX_AGE_MS and should be refreshed. */
  stale: string[];
}

export const remoteFaviconUrl = (url: string): string =>
  `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=64`;

const keyFor = (url: string): string => {
  try {
    return new URL(url).origin.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
};

const isCacheRecord = (value: unknown): value is CacheRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readStored = async (): Promise<CacheRecord> => {
  try {
    const stored = await StorageService.get<unknown>(STORAGE_KEY);
    if (!isCacheRecord(stored)) return {};

    const clean: CacheRecord = {};
    for (const [key, entry] of Object.entries(stored)) {
      if (
        entry &&
        typeof entry.data === 'string' &&
        entry.data.startsWith('data:image/') &&
        typeof entry.savedAt === 'number'
      ) {
        clean[key] = entry;
      }
    }
    return clean;
  } catch (error) {
    console.warn('[FaviconCache] Failed to read cache:', error);
    return {};
  }
};

let memory: CacheRecord | null = null;
let loading: Promise<CacheRecord> | null = null;
let writeChain: Promise<void> = Promise.resolve();
const inFlight = new Map<string, Promise<string | undefined>>();

const loadMemory = (): Promise<CacheRecord> => {
  if (memory) return Promise.resolve(memory);
  if (!loading) {
    loading = readStored().then((stored) => {
      memory = stored;
      return stored;
    });
  }
  return loading;
};

const persist = (): void => {
  writeChain = writeChain
    .then(async () => {
      if (memory) await StorageService.set(STORAGE_KEY, memory);
    })
    .catch((error) => {
      console.warn('[FaviconCache] Failed to save cache:', error);
    });
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Unexpected reader result'));
    reader.onerror = () => reject(reader.error ?? new Error('Read failed'));
    reader.readAsDataURL(blob);
  });

const download = async (source: string): Promise<string | undefined> => {
  const response = await fetch(source, { credentials: 'omit' });
  if (!response.ok) return undefined;

  const blob = await response.blob();
  if (!blob.type.startsWith('image/') || blob.size === 0 || blob.size > MAX_ICON_BYTES) {
    return undefined;
  }

  return blobToDataUrl(blob);
};

export const FaviconCache = {
  keyFor,

  /** Reads the cache once; later calls are served from memory. */
  load: async (): Promise<FaviconSnapshot> => {
    const record = await loadMemory();
    const now = Date.now();
    const icons: Record<string, string> = {};
    const stale: string[] = [];

    for (const [key, entry] of Object.entries(record)) {
      icons[key] = entry.data;
      if (now - entry.savedAt > MAX_AGE_MS) stale.push(key);
    }

    return { icons, stale };
  },

  /**
   * Downloads the icon for `pageUrl` (from `source`) and stores it. Resolves to
   * the data URL, or undefined when the icon could not be fetched. Parallel
   * calls for the same origin share one request.
   */
  fetchAndStore: (pageUrl: string, source: string = remoteFaviconUrl(pageUrl)): Promise<string | undefined> => {
    const key = keyFor(pageUrl);
    const running = inFlight.get(key);
    if (running) return running;

    const task = (async () => {
      try {
        const data = await download(source);
        if (!data) return undefined;

        const record = await loadMemory();
        record[key] = { data, savedAt: Date.now() };
        persist();
        return data;
      } catch (error) {
        console.warn(`[FaviconCache] Could not download favicon for ${key}:`, error);
        return undefined;
      } finally {
        inFlight.delete(key);
      }
    })();

    inFlight.set(key, task);
    return task;
  },

  /** Drops icons that no shortcut uses any more. */
  prune: async (keepKeys: string[]): Promise<void> => {
    const record = await loadMemory();
    const keep = new Set(keepKeys);
    let changed = false;

    for (const key of Object.keys(record)) {
      if (!keep.has(key)) {
        delete record[key];
        changed = true;
      }
    }

    if (changed) persist();
  },
};
