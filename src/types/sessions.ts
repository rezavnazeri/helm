import type { CardBase } from '@/types/cards';

export interface SessionTab {
  id: string;
  title: string;
  url: string;
}

/** Fields a session card stores next to the shared card fields. */
export interface SessionExtra {
  name: string;
  tabs: SessionTab[];
}

export type SessionCard = CardBase & SessionExtra;
