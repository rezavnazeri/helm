import { StorageService } from '@/services/storage';
import {
  BOOKMARK_FOLDER_ICONS,
  DEFAULT_BOOKMARK_FOLDER_ICON,
  type BookmarkFolderConfig,
  type BookmarkFolderIcon,
  type BookmarkSpaceState,
} from '@/types/bookmarks';

const STORAGE_KEY = 'bookmarkSpace';
const MAX_CELLS = 400;
const MAX_TRACKED_REVISIONS = 50;

type Cells = (BookmarkFolderConfig | null)[];

export interface BookmarkSpaceSnapshot {
  loaded: boolean;
  state: BookmarkSpaceState;
}

const EMPTY_STATE: BookmarkSpaceState = { version: 1, cells: [] };

const isFolderIcon = (value: unknown): value is BookmarkFolderIcon =>
  typeof value === 'string' &&
  (BOOKMARK_FOLDER_ICONS as readonly string[]).includes(value);

const normalizeCells = (input: unknown): Cells => {
  const source = Array.isArray(input) ? input.slice(0, MAX_CELLS) : [];
  const seen = new Set<string>();
  const cells: Cells = [];

  for (const cell of source) {
    const candidate = cell as Partial<BookmarkFolderConfig> | null | undefined;

    if (
      candidate &&
      typeof candidate === 'object' &&
      typeof candidate.id === 'string' &&
      candidate.id !== '' &&
      !seen.has(candidate.id)
    ) {
      seen.add(candidate.id);
      cells.push({
        id: candidate.id,
        icon: isFolderIcon(candidate.icon)
          ? candidate.icon
          : DEFAULT_BOOKMARK_FOLDER_ICON,
        collapsed: candidate.collapsed === true,
      });
    } else {
      cells.push(null);
    }
  }

  while (cells.length > 0 && cells[cells.length - 1] === null) {
    cells.pop();
  }

  return cells;
};

const normalizeState = (input: unknown): BookmarkSpaceState => {
  const raw =
    input && typeof input === 'object'
      ? (input as { cells?: unknown; rev?: unknown })
      : {};

  return {
    version: 1,
    rev: typeof raw.rev === 'string' ? raw.rev : undefined,
    cells: normalizeCells(raw.cells),
  };
};

const sameCells = (a: Cells, b: Cells): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

let snapshot: BookmarkSpaceSnapshot = { loaded: false, state: EMPTY_STATE };
const listeners = new Set<() => void>();
const ownRevisions: string[] = [];
let loading: Promise<void> | null = null;
let writeChain: Promise<void> = Promise.resolve();

const emit = (next: BookmarkSpaceSnapshot): void => {
  snapshot = next;
  listeners.forEach((listener) => listener());
};

const rememberRevision = (rev: string): void => {
  ownRevisions.push(rev);
  if (ownRevisions.length > MAX_TRACKED_REVISIONS) ownRevisions.shift();
};

const persist = (state: BookmarkSpaceState): void => {
  writeChain = writeChain
    .then(() => StorageService.set(STORAGE_KEY, state))
    .catch((error) => {
      console.error('[BookmarkSpace] Failed to save layout:', error);
    });
};

const watchOtherTabs = (): void => {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[STORAGE_KEY]) return;

    const next = normalizeState(changes[STORAGE_KEY].newValue);

    if (next.rev) {
      const index = ownRevisions.indexOf(next.rev);
      if (index !== -1) {
        ownRevisions.splice(index, 1);
        return;
      }
    }

    if (sameCells(next.cells, snapshot.state.cells)) return;

    emit({ loaded: true, state: next });
  });
};

const ensureLoaded = (): Promise<void> => {
  if (!loading) {
    loading = (async () => {
      let stored: unknown;

      try {
        stored = await StorageService.get<unknown>(STORAGE_KEY);
      } catch (error) {
        console.error('[BookmarkSpace] Failed to load layout:', error);
      }

      emit({ loaded: true, state: normalizeState(stored) });
      watchOtherTabs();
    })();
  }

  return loading;
};

const update = async (
  mutate: (cells: Cells) => Cells | undefined,
): Promise<void> => {
  await ensureLoaded();

  const proposed = mutate(snapshot.state.cells);
  if (!proposed) return;

  const cells = normalizeCells(proposed);
  if (sameCells(cells, snapshot.state.cells)) return;

  const rev = crypto.randomUUID();
  rememberRevision(rev);

  const state: BookmarkSpaceState = { version: 1, rev, cells };
  emit({ loaded: true, state });
  persist(state);
};

export const BookmarkSpaceStore = {
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot: (): BookmarkSpaceSnapshot => snapshot,

  ensureLoaded,

  addFolder: async (
    id: string,
    icon: BookmarkFolderIcon = DEFAULT_BOOKMARK_FOLDER_ICON,
  ): Promise<boolean> => {
    let added = false;

    await update((cells) => {
      if (cells.some((cell) => cell?.id === id)) return undefined;

      const next = [...cells];
      let index = next.findIndex((cell) => cell === null);
      if (index === -1) index = next.length;
      if (index >= MAX_CELLS) return undefined;

      next[index] = { id, icon, collapsed: false };
      added = true;
      return next;
    });

    return added;
  },

  removeFolder: (id: string): Promise<void> =>
    update((cells) => cells.map((cell) => (cell?.id === id ? null : cell))),

  setCollapsed: (id: string, collapsed: boolean): Promise<void> =>
    update((cells) =>
      cells.map((cell) => (cell?.id === id ? { ...cell, collapsed } : cell)),
    ),

  moveFolder: (id: string, toIndex: number): Promise<void> =>
    update((cells) => {
      const from = cells.findIndex((cell) => cell?.id === id);
      if (from === -1 || from === toIndex || toIndex < 0 || toIndex >= MAX_CELLS) {
        return undefined;
      }

      const next = [...cells];
      while (next.length <= toIndex) next.push(null);

      [next[from], next[toIndex]] = [next[toIndex], next[from]];
      return next;
    }),

  keepOnly: (existingIds: ReadonlySet<string>): Promise<void> =>
    update((cells) => {
      if (!cells.some((cell) => cell && !existingIds.has(cell.id))) {
        return undefined;
      }

      return cells.map((cell) => (cell && existingIds.has(cell.id) ? cell : null));
    }),
};
