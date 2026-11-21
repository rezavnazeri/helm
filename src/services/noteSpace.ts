import { createCardStore } from '@/services/cardStore';
import type { NoteExtra } from '@/types/notes';

export const MAX_NOTE_LENGTH = 50_000;

const clip = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.slice(0, max) : '';

export const NoteStore = createCardStore<NoteExtra>({
  storageKey: 'noteSpace',
  readExtra: (raw) => ({ name: clip(raw.name, 200), text: clip(raw.text, MAX_NOTE_LENGTH) }),
});

// The note whose text box should take focus once it is on screen. Creating a
// note can happen while another space is shown, so the request has to outlive
// the component that made it.
let pendingFocusId: string | null = null;

export const consumeNoteFocus = (id: string): boolean => {
  if (pendingFocusId !== id) return false;
  pendingFocusId = null;
  return true;
};

/**
 * Adds an empty note named by `nameFor(n)`, using the lowest number n (from 0)
 * that no other note already uses. Returns the new note's id, or null when it could
 * not be added.
 */
export const createNote = async (
  nameFor: (number: number) => string,
): Promise<string | null> => {
  await NoteStore.ensureLoaded();

  const taken = new Set(NoteStore.getSnapshot().cells.map((cell) => cell?.name));
  let number = 0;
  while (taken.has(nameFor(number))) number += 1;

  const id = crypto.randomUUID();
  // Set first: adding re-renders the space, which may mount the text box at once.
  pendingFocusId = id;

  const added = await NoteStore.add({
    id,
    collapsed: false,
    name: nameFor(number),
    text: '',
  });

  if (!added) {
    if (pendingFocusId === id) pendingFocusId = null;
    return null;
  }

  return id;
};
