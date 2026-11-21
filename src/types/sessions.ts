import type { CardBase } from '@/types/cards';

export interface SessionTab {
  id: string;
  title: string;
  url: string;
}

export interface SessionExtra {
  name: string;
  tabs: SessionTab[];
}

export type SessionCard = CardBase & SessionExtra;
