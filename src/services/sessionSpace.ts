import { createCardStore } from '@/services/cardStore';
import type { SessionExtra, SessionTab } from '@/types/sessions';

const MAX_TABS_PER_SESSION = 500;

const clip = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.slice(0, max) : '';

const readTabs = (value: unknown): SessionTab[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const tabs: SessionTab[] = [];

  for (const item of value.slice(0, MAX_TABS_PER_SESSION)) {
    const raw = item as Record<string, unknown> | null;
    const url = clip(raw?.url, 4000);
    const id = clip(raw?.id, 100) || crypto.randomUUID();

    if (url && !seen.has(id)) {
      seen.add(id);
      tabs.push({ id, title: clip(raw?.title, 300), url });
    }
  }

  return tabs;
};

/** Sessions: saved sets of tabs. Names and tabs are stored by Helm itself. */
export const SessionStore = createCardStore<SessionExtra>({
  storageKey: 'sessionSpace',
  defaultIcon: 'layers',
  readExtra: (raw) => ({ name: clip(raw.name, 200), tabs: readTabs(raw.tabs) }),
});

export const createSessionTab = (title: string, url: string): SessionTab => ({
  id: crypto.randomUUID(),
  title,
  url,
});
