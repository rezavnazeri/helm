import { useEffect, useMemo, useRef, useState } from 'react';
import { FaviconCache, type FaviconSnapshot } from '@/services/faviconCache';
import type { QuickAccessShortcut } from '@/types/quickAccess';

export interface ShortcutFaviconState {
  src?: string;
  failed: boolean;
}

interface FaviconTarget {
  key: string;
  url: string;
  source?: string;
}

export const useCachedFavicons = (
  shortcuts: QuickAccessShortcut[],
  enabled: boolean,
) => {
  const [ready, setReady] = useState(false);
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const snapshotRef = useRef<FaviconSnapshot>({ icons: {}, stale: [] });

  useEffect(() => {
    let cancelled = false;

    void FaviconCache.load().then((snapshot) => {
      if (cancelled) return;
      snapshotRef.current = {
        icons: { ...snapshot.icons },
        stale: [...snapshot.stale],
      };
      setIcons(snapshot.icons);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const targets = useMemo<FaviconTarget[]>(() => {
    const unique = new Map<string, FaviconTarget>();

    for (const shortcut of shortcuts) {
      const key = FaviconCache.keyFor(shortcut.url);
      if (unique.has(key)) continue;

      unique.set(key, {
        key,
        url: shortcut.url,
        source: /^https?:\/\//i.test(shortcut.favicon) ? shortcut.favicon : undefined,
      });
    }

    return Array.from(unique.values());
  }, [shortcuts]);

  useEffect(() => {
    if (!ready || !enabled) return;

    let cancelled = false;
    const snapshot = snapshotRef.current;

    for (const target of targets) {
      const isMissing = !snapshot.icons[target.key];
      const isStale = snapshot.stale.includes(target.key);
      if (!isMissing && !isStale) continue;

      void FaviconCache.fetchAndStore(target.url, target.source).then((data) => {
        if (cancelled) return;

        if (data) {
          snapshot.icons[target.key] = data;
          snapshot.stale = snapshot.stale.filter((key) => key !== target.key);
          setIcons((previous) => ({ ...previous, [target.key]: data }));
        } else if (isMissing) {
          setFailed((previous) => ({ ...previous, [target.key]: true }));
        }
      });
    }

    void FaviconCache.prune(targets.map((target) => target.key));

    return () => {
      cancelled = true;
    };
  }, [ready, enabled, targets]);

  const resolve = (shortcut: QuickAccessShortcut): ShortcutFaviconState => {
    const key = FaviconCache.keyFor(shortcut.url);
    const src = icons[key];
    return { src, failed: !src && failed[key] === true };
  };

  return { ready, resolve };
};