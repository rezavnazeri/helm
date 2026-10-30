import type { IconName } from '@/components/Icon';

export type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;

export const BOOKMARK_FOLDER_ICONS = [
  'bookmark',
  'folder',
  'home',
  'globe',
  'tasks',
  'notes',
  'reminders',
  'palette',
  'data',
  'user',
] as const satisfies readonly IconName[];

export type BookmarkFolderIcon = (typeof BOOKMARK_FOLDER_ICONS)[number];

export const DEFAULT_BOOKMARK_FOLDER_ICON: BookmarkFolderIcon = 'bookmark';

export interface BookmarkFolderConfig {
  id: string;
  icon: BookmarkFolderIcon;
  collapsed: boolean;
}

export interface BookmarkSpaceState {
  version: 1;
  rev?: string;
  cells: (BookmarkFolderConfig | null)[];
}

export const BOOKMARK_RESERVED_ROWS = 5;