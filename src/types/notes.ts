import type { CardBase } from '@/types/cards';

export interface NoteExtra {
  name: string;
  text: string;
}

export type NoteCard = CardBase & NoteExtra;
