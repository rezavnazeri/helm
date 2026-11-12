import { StorageService } from '@/services/storage';
import {
  CARD_ICONS,
  type CardBase,
  type CardIcon,
  type Cells,
} from '@/types/cards';

/**
 * Layout store shared by every card space (Bookmarks, Sessions, ...).
 *
 * A store keeps an ordered list of cells (`null` = empty cell) in extension
 * storage. Each space adds its own fields to its cards through `readExtra`.
 * The state lives in memory for the lifetime of the page, so every component
 * works on the same, latest data, and changes made by other Helm tabs are
 * picked up through storage events.
 */

const MAX_CELLS = 400;
const MAX_TRACKED_REVISIONS = 50;

export interface CardSnapshot<Card extends CardBase> {
  loaded: boolean;
  cells: Cells<Card>;
}

export interface CardStore<Card extends CardBase> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => CardSnapshot<Card>;
  ensureLoaded: () => Promise<void>;
  /** Puts the card in the first free cell. False when the id already exists. */
  add: (card: Card) => Promise<boolean>;
  patch: (id: string, change: (card: Card) => Card) => Promise<void>;
  /** Removes a card; its cell stays in place as an empty cell. */
  remove: (id: string) => Promise<void>;
  toggleCollapsed: (id: string) => Promise<void>;
  /** Moves a card into a cell, swapping with the card that is there. */
  move: (id: string, toIndex: number) => Promise<void>;
  /** Forgets cards whose id is not in the set. */
  keepOnly: (ids: ReadonlySet<string>) => Promise<void>;
}

interface CardStoreOptions<Extra extends object> {
  storageKey: string;
  defaultIcon: CardIcon;
  /** Reads (and validates) the space's own fields from stored data. */
  readExtra?: (raw: Record<string, unknown>) => Extra;
}

const isCardIcon = (value: unknown): value is CardIcon =>
  typeof value === 'string' && (CARD_ICONS as readonly string[]).includes(value);

const sameCells = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

export const createCardStore = <Extra extends object = object>({
  storageKey,
  defaultIcon,
  readExtra,
}: CardStoreOptions<Extra>): CardStore<CardBase & Extra> => {
  type Card = CardBase & Extra;

  const normalizeCells = (input: unknown): Cells<Card> => {
    const source = Array.isArray(input) ? input.slice(0, MAX_CELLS) : [];
    const seen = new Set<string>();
    const cells: Cells<Card> = [];

    for (const item of source) {
      const raw = item as Record<string, unknown> | null;

      if (
        raw &&
        typeof raw === 'object' &&
        typeof raw.id === 'string' &&
        raw.id !== '' &&
        !seen.has(raw.id)
      ) {
        seen.add(raw.id);
        cells.push({
          ...(readExtra ? readExtra(raw) : {}),
          id: raw.id,
          icon: isCardIcon(raw.icon) ? raw.icon : defaultIcon,
          collapsed: raw.collapsed === true,
        } as Card);
      } else {
        // Keep the position of broken or duplicated entries as an empty cell.
        cells.push(null);
      }
    }

    while (cells.length > 0 && cells[cells.length - 1] === null) cells.pop();
    return cells;
  };

  let snapshot: CardSnapshot<Card> = { loaded: false, cells: [] };
  const listeners = new Set<() => void>();
  const ownRevisions: string[] = [];
  let loading: Promise<void> | null = null;
  let writeChain: Promise<void> = Promise.resolve();

  const emit = (next: CardSnapshot<Card>): void => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  const persist = (rev: string, cells: Cells<Card>): void => {
    writeChain = writeChain
      .then(() => StorageService.set(storageKey, { version: 1, rev, cells }))
      .catch((error) => {
        console.error(`[${storageKey}] Failed to save:`, error);
      });
  };

  const watchOtherTabs = (): void => {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes[storageKey]) return;

      const value = changes[storageKey].newValue as
        | { rev?: unknown; cells?: unknown }
        | undefined;

      // Echo of a write this page made itself.
      if (typeof value?.rev === 'string') {
        const index = ownRevisions.indexOf(value.rev);
        if (index !== -1) {
          ownRevisions.splice(index, 1);
          return;
        }
      }

      const cells = normalizeCells(value?.cells);
      if (!sameCells(cells, snapshot.cells)) emit({ loaded: true, cells });
    });
  };

  const ensureLoaded = (): Promise<void> => {
    if (!loading) {
      loading = (async () => {
        let stored: { cells?: unknown } | undefined;

        try {
          stored = await StorageService.get<{ cells?: unknown }>(storageKey);
        } catch (error) {
          console.error(`[${storageKey}] Failed to load:`, error);
        }

        emit({ loaded: true, cells: normalizeCells(stored?.cells) });
        watchOtherTabs();
      })();
    }

    return loading;
  };

  /**
   * Applies `mutate` to the current cells. Returning undefined (or equal cells)
   * changes nothing. It runs synchronously once the store is loaded, so
   * concurrent callers can never overwrite each other's changes.
   */
  const update = async (
    mutate: (cells: Cells<Card>) => Cells<Card> | undefined,
  ): Promise<void> => {
    await ensureLoaded();

    const proposed = mutate(snapshot.cells);
    if (!proposed) return;

    const cells = normalizeCells(proposed);
    if (sameCells(cells, snapshot.cells)) return;

    const rev = crypto.randomUUID();
    ownRevisions.push(rev);
    if (ownRevisions.length > MAX_TRACKED_REVISIONS) ownRevisions.shift();

    emit({ loaded: true, cells });
    persist(rev, cells);
  };

  const patch = (id: string, change: (card: Card) => Card): Promise<void> =>
    update((cells) => cells.map((cell) => (cell?.id === id ? change(cell) : cell)));

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot: () => snapshot,

    ensureLoaded,

    add: async (card) => {
      let added = false;

      await update((cells) => {
        if (cells.some((cell) => cell?.id === card.id)) return undefined;

        const next = [...cells];
        let index = next.findIndex((cell) => cell === null);
        if (index === -1) index = next.length;
        if (index >= MAX_CELLS) return undefined;

        next[index] = card;
        added = true;
        return next;
      });

      return added;
    },

    patch,

    remove: (id) =>
      update((cells) => cells.map((cell) => (cell?.id === id ? null : cell))),

    toggleCollapsed: (id) =>
      patch(id, (card) => ({ ...card, collapsed: !card.collapsed })),

    move: (id, toIndex) =>
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

    keepOnly: (ids) =>
      update((cells) =>
        cells.some((cell) => cell && !ids.has(cell.id))
          ? cells.map((cell) => (cell && ids.has(cell.id) ? cell : null))
          : undefined,
      ),
  };
};
