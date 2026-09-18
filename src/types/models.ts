export interface QuickBookmark {
  id: string;
  title: string;
  url: string;
  domain: string;
  icon?: string;
}

export interface QuickBookmarkGroup {
  id: string;
  title: string;
  icon?: string;
  bookmarkIds: string[];
  collapsed: boolean;
  order: number;
}

export type Space = 'home' | 'bookmarks' | 'tasks' | 'notes' | 'reminders';

export type SettingsGroup =
  | 'general'
  | 'appearance'
  | 'weather'
  | 'spaces'
  | 'language'
  | 'behavior'
  | 'data'
  | 'about';