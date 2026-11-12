import { createCardStore } from '@/services/cardStore';

/** Layout of the Bookmarks space: which Chrome folders are shown, and where. */
export const BookmarkStore = createCardStore({
  storageKey: 'bookmarkSpace',
  defaultIcon: 'bookmark',
});
