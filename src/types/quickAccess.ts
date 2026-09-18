export type QuickAccessPosition = 'left' | 'top' | 'right' | 'bottom' | 'below-header';

export interface QuickAccessShortcut {
  id: string;
  name: string;
  url: string;
  favicon: string;
  order: number;
}

export const MAX_QUICK_ACCESS_SHORTCUTS = 20;
