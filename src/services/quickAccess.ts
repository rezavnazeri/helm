import {
  MAX_QUICK_ACCESS_SHORTCUTS,
  QuickAccessShortcut,
} from '@/types/quickAccess';

import { remoteFaviconUrl } from '@/services/faviconCache';

const STORAGE_KEY = 'quickAccessShortcuts';

const DEFAULT_SHORTCUTS: QuickAccessShortcut[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com/',
    favicon: 'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fwww.youtube.com%2F&sz=64',
    order: 0,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/',
    favicon: 'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fwww.instagram.com%2F&sz=64',
    order: 1,
  },
  {
    id: 'x',
    name: 'X',
    url: 'https://x.com/',
    favicon: 'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fx.com%2F&sz=64',
    order: 2,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    url: 'https://open.spotify.com/',
    favicon: 'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fopen.spotify.com%2F&sz=64',
    order: 3,
  },
];

const storage = {
  get: async (): Promise<QuickAccessShortcut[] | undefined> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(STORAGE_KEY, (result) => {
          resolve(result[STORAGE_KEY] as QuickAccessShortcut[] | undefined);
        });
      });
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as QuickAccessShortcut[] : undefined;
    } catch {
      return undefined;
    }
  },
  set: async (shortcuts: QuickAccessShortcut[]) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise<void>((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: shortcuts }, resolve);
      });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  },
};

const faviconFor = remoteFaviconUrl;

const automaticNameFor = (url: string) => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, '');
    const label = hostname.split('.')[0] || hostname;
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return url;
  }
};

export const QuickAccessService = {
  getAll: async (): Promise<QuickAccessShortcut[]> => {
    const stored = await storage.get();
    if (Array.isArray(stored)) {
      return stored
        .filter((shortcut) => shortcut && typeof shortcut.url === 'string')
        .slice(0, MAX_QUICK_ACCESS_SHORTCUTS)
        .map((shortcut, index) => ({
          ...shortcut,
          favicon: shortcut.favicon || faviconFor(shortcut.url),
          order: index,
        }));
    }

    await storage.set(DEFAULT_SHORTCUTS);
    return DEFAULT_SHORTCUTS;
  },

  add: async (name: string, url: string): Promise<QuickAccessShortcut> => {
    const shortcuts = await QuickAccessService.getAll();
    if (shortcuts.length >= MAX_QUICK_ACCESS_SHORTCUTS) {
      throw new Error('limit');
    }

    const shortcut: QuickAccessShortcut = {
      id: crypto.randomUUID(),
      name: name.trim() || automaticNameFor(url),
      url,
      favicon: faviconFor(url),
      order: shortcuts.length,
    };

    await storage.set([...shortcuts, shortcut]);
    return shortcut;
  },

  update: async (id: string, name: string, url: string) => {
    const shortcuts = await QuickAccessService.getAll();
    const updated = shortcuts.map((shortcut) =>
      shortcut.id === id
        ? { ...shortcut, name: name.trim() || automaticNameFor(url), url, favicon: faviconFor(url) }
        : shortcut,
    );
    await storage.set(updated);
    return updated;
  },

  remove: async (id: string) => {
    const shortcuts = await QuickAccessService.getAll();
    await storage.set(
      shortcuts
        .filter((shortcut) => shortcut.id !== id)
        .map((shortcut, index) => ({ ...shortcut, order: index })),
    );
  },

  reorder: async (sourceId: string, targetId: string): Promise<QuickAccessShortcut[]> => {
    const shortcuts = await QuickAccessService.getAll();
    const sourceIndex = shortcuts.findIndex((shortcut) => shortcut.id === sourceId);
    const targetIndex = shortcuts.findIndex((shortcut) => shortcut.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
      return shortcuts;
    }

    const reordered = [...shortcuts];
    const [moved] = reordered.splice(sourceIndex, 1);
    const insertionIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
    reordered.splice(insertionIndex, 0, moved);

    const normalized = reordered.map((shortcut, index) => ({
      ...shortcut,
      order: index,
    }));

    await storage.set(normalized);
    return normalized;
  },
};

