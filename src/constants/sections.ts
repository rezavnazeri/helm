import { Space } from '@/types/models';
import { IconName } from '@/components/Icon';

export const SECTIONS: Space[] = [
  'home',
  'bookmarks',
  'sessions',
  'tasks',
  'notes',
];

export const SECTION_LABELS: Record<Space, string> = {
  home: 'common.home',
  bookmarks: 'common.bookmarks',
  sessions: 'common.sessions',
  tasks: 'common.tasks',
  notes: 'common.notes',
};

export const SECTION_ICONS: Record<Space, IconName> = {
  home: 'home',
  bookmarks: 'bookmark',
  sessions: 'layers',
  tasks: 'tasks',
  notes: 'notes',
};