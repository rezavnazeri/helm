import { useEffect, useSyncExternalStore } from 'react';
import {
  BookmarkSpaceStore,
  type BookmarkSpaceSnapshot,
} from '@/services/bookmarkSpace';

export const useBookmarkSpace = (): BookmarkSpaceSnapshot => {
  const snapshot = useSyncExternalStore(
    BookmarkSpaceStore.subscribe,
    BookmarkSpaceStore.getSnapshot,
  );

  useEffect(() => {
    void BookmarkSpaceStore.ensureLoaded();
  }, []);

  return snapshot;
};
