import type { CardBase, Cells } from '@/types/cards';

/** Rows that are always available as drop targets. */
export const RESERVED_ROWS = 5;

/** Index of the last cell that holds a card, or -1. */
export const lastOccupiedIndex = (
  cells: Cells<CardBase>,
  ignoreId?: string,
): number => {
  for (let index = cells.length - 1; index >= 0; index -= 1) {
    const cell = cells[index];
    if (cell && cell.id !== ignoreId) return index;
  }

  return -1;
};

/**
 * Rows that exist as drop targets: the reserved rows, plus one row below the
 * last row that holds a card. `ignoreId` leaves the dragged card out, so it
 * cannot be the one that "unlocks" the row it is moving into.
 */
export const getRowCount = (
  cells: Cells<CardBase>,
  columns: number,
  ignoreId?: string,
): number => {
  const last = lastOccupiedIndex(cells, ignoreId);
  if (last < 0) return RESERVED_ROWS;

  return Math.max(RESERVED_ROWS, Math.floor(last / Math.max(1, columns)) + 2);
};
