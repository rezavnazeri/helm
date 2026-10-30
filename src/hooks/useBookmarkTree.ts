import { useCallback, useEffect, useState } from 'react';
import { BookmarksService } from '@/services/bookmarks';
import type { BookmarkNode } from '@/types/bookmarks';
import { removeNode, renameNode } from '@/utils/bookmarkTree';

export type BookmarkTreeStatus = 'loading' | 'ready' | 'unavailable';

interface TreeState {
  status: BookmarkTreeStatus;
  tree: BookmarkNode[];
}

const REFRESH_DELAY_MS = 60;

export const useBookmarkTree = () => {
  const [state, setState] = useState<TreeState>({ status: 'loading', tree: [] });

  useEffect(() => {
    if (!BookmarksService.isAvailable()) {
      const timer = window.setTimeout(
        () => setState({ status: 'unavailable', tree: [] }),
        0,
      );
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const tree = await BookmarksService.getTree();
        if (cancelled) return;

        setState(
          tree.length > 0
            ? { status: 'ready', tree }
            : { status: 'unavailable', tree: [] },
        );
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
        if (!cancelled) {
          setState((previous) =>
            previous.status === 'ready' ? previous : { status: 'unavailable', tree: [] },
          );
        }
      }
    };

    const scheduleLoad = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void load(), REFRESH_DELAY_MS);
    };

    void load();
    const unsubscribe = BookmarksService.subscribe(scheduleLoad);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const patchTitle = useCallback((id: string, title: string) => {
    setState((previous) => {
      const tree = renameNode(previous.tree, id, title);
      return tree === previous.tree ? previous : { ...previous, tree };
    });
  }, []);

  const patchRemoved = useCallback((id: string) => {
    setState((previous) => {
      const tree = removeNode(previous.tree, id);
      return tree === previous.tree ? previous : { ...previous, tree };
    });
  }, []);

  return { status: state.status, tree: state.tree, patchTitle, patchRemoved };
};