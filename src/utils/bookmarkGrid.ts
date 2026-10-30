import {
  BOOKMARK_RESERVED_ROWS,
  type BookmarkFolderConfig,
} from '@/types/bookmarks';

type Cells = (BookmarkFolderConfig | null)[];

export const lastOccupiedIndex = (cells: Cells, ignoreId?: string): number => {
  for (let index = cells.length - 1; index >= 0; index -= 1) {
    const cell = cells[index];
    if (cell && cell.id !== ignoreId) return index;
  }

  return -1;
};

export const getRowCount = (
  cells: Cells,
  columns: number,
  ignoreId?: string,
): number => {
  const last = lastOccupiedIndex(cells, ignoreId);
  if (last < 0) return BOOKMARK_RESERVED_ROWS;

  return Math.max(
    BOOKMARK_RESERVED_ROWS,
    Math.floor(last / Math.max(1, columns)) + 2,
  );
};