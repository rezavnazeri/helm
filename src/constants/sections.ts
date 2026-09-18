import { Space } from '@/types/models';
import { IconName } from '@/components/Icon';

export const SECTIONS: Space[] = [
  'home',
  'bookmarks',
  'tasks',
  'notes',
  'reminders',
];

export const SECTION_LABELS: Record<Space, string> = {
  home: 'common.home',
  bookmarks: 'common.bookmarks',
  tasks: 'common.tasks',
  notes: 'common.notes',
  reminders: 'common.reminders',
};

export const SECTION_ICONS: Record<Space, IconName> = {
  home: 'home',
  bookmarks: 'bookmark',
  tasks: 'tasks',
  notes: 'notes',
  reminders: 'reminders',
};