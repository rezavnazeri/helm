import { useEffect, useSyncExternalStore } from 'react';
import type { CardSnapshot, CardStore } from '@/services/cardStore';
import type { CardBase } from '@/types/cards';

/** Subscribes to a card store and makes sure it has been loaded. */
export const useCardStore = <Card extends CardBase>(
  store: CardStore<Card>,
): CardSnapshot<Card> => {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  useEffect(() => {
    void store.ensureLoaded();
  }, [store]);

  return snapshot;
};
