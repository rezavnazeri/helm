import type { IconName } from '@/components/Icon';

/** Icons a card can use. Shared by every card space. */
export const CARD_ICONS = [
  'home',
  'bookmark',
  'layers',
  'notes',
  'tasks',
  'code',
  'play',
  'palette',
  'search',
  'book',
] as const satisfies readonly IconName[];

export type CardIcon = (typeof CARD_ICONS)[number];

/** What every card remembers. Spaces add their own fields on top. */
export interface CardBase {
  id: string;
  icon: CardIcon;
  collapsed: boolean;
}

/** Cells of a card layout; `null` is an empty cell, so index = position. */
export type Cells<Card extends CardBase> = (Card | null)[];
