export const BookmarksService = {
  getTree: (): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => resolve(tree));
    });
  },

  getBookmark: (id: string): Promise<chrome.bookmarks.BookmarkTreeNode> => {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.get(id, (results) => {
        if (results && results.length > 0) {
          resolve(results[0]);
        } else {
          reject(new Error('Bookmark not found'));
        }
      });
    });
  },

  createBookmark: (title: string, url: string, parentId?: string): Promise<chrome.bookmarks.BookmarkTreeNode> => {
    return new Promise((resolve) => {
      chrome.bookmarks.create({ title, url, parentId }, resolve);
    });
  },

  removeBookmark: (id: string): Promise<void> => {
    return new Promise((resolve) => {
      chrome.bookmarks.remove(id, resolve);
    });
  }
};