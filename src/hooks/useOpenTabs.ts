import { useEffect, useState } from 'react';
import { TabsService, type WindowTabs } from '@/services/tabs';

export type OpenTabsStatus = 'loading' | 'ready' | 'unavailable';

interface OpenTabsState {
  status: OpenTabsStatus;
  data: WindowTabs;
}

const EMPTY: WindowTabs = { tabs: [], groups: [] };

/** Reads the open tabs of the current window once, when the component mounts. */
export const useOpenTabs = (): OpenTabsState => {
  const [state, setState] = useState<OpenTabsState>({ status: 'loading', data: EMPTY });

  useEffect(() => {
    if (!TabsService.isAvailable()) {
      // Resolved asynchronously so the effect never sets state synchronously.
      const timer = window.setTimeout(
        () => setState({ status: 'unavailable', data: EMPTY }),
        0,
      );
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;

    TabsService.getWindowTabs()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((error) => {
        console.error('Failed to read open tabs:', error);
        if (!cancelled) setState({ status: 'unavailable', data: EMPTY });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
