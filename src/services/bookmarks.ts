import type { BookmarkNode } from '@/types/bookmarks';

const hasBookmarksApi = (): boolean =>
  typeof chrome !== 'undefined' && Boolean(chrome.bookmarks?.getTree);

/**
 * Thin wrapper around chrome.bookmarks. Chrome is the single source of truth:
 * Helm never keeps its own copy of bookmarks or folders.
 */
export const BookmarksService = {
  isAvailable: hasBookmarksApi,

  getTree: (): Promise<BookmarkNode[]> => chrome.bookmarks.getTree(),

  getBookmark: async (id: string): Promise<BookmarkNode> => {
    const results = await chrome.bookmarks.get(id);

    if (results && results.length > 0) {
      return results[0];
    }

    throw new Error('Bookmark not found');
  },

  createBookmark: (title: string, url: string, parentId?: string): Promise<BookmarkNode> =>
    new Promise((resolve) => {
      chrome.bookmarks.create({ title, url, parentId }, resolve);
    }),

  removeBookmark: async (id: string): Promise<void> => {
    await chrome.bookmarks.remove(id);
  },

  /** Removes a folder together with everything inside it. */
  removeFolder: async (id: string): Promise<void> => {
    await chrome.bookmarks.removeTree(id);
  },

  rename: async (id: string, title: string): Promise<void> => {
    await chrome.bookmarks.update(id, { title });
  },

  /**
   * Calls `listener` whenever anything about bookmarks changes in Chrome,
   * including changes made in other windows. Returns an unsubscribe function.
   */
  subscribe: (listener: () => void): (() => void) => {
    if (!hasBookmarksApi()) return () => undefined;

    const events = [
      chrome.bookmarks.onCreated,
      chrome.bookmarks.onRemoved,
      chrome.bookmarks.onChanged,
      chrome.bookmarks.onMoved,
      chrome.bookmarks.onChildrenReordered,
      chrome.bookmarks.onImportEnded,
    ];

    for (const event of events) event.addListener(listener);

    return () => {
      for (const event of events) event.removeListener(listener);
    };
  },
};
