import { useLayoutEffect, useState, type RefObject } from 'react';

export interface GridMetrics {
  columns: number;
  cellWidth: number;
  ready: boolean;
}

const DEFAULTS = { minWidth: 300, maxWidth: 420, gap: 6 };

const readPx = (element: Element, property: string, fallback: number): number => {
  const value = parseFloat(getComputedStyle(element).getPropertyValue(property));
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const useGridMetrics = (
  containerRef: RefObject<HTMLElement | null>,
): GridMetrics => {
  const [metrics, setMetrics] = useState<GridMetrics>({
    columns: 1,
    cellWidth: 0,
    ready: false,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const width = container.clientWidth;
      if (width <= 0) return;

      const minWidth = readPx(container, '--card-min-width', DEFAULTS.minWidth);
      const maxWidth = readPx(container, '--card-max-width', DEFAULTS.maxWidth);
      const gap = readPx(container, '--card-gap', DEFAULTS.gap);

      const columns = Math.max(1, Math.floor((width + gap) / (minWidth + gap)));
      const shared = Math.floor((width - gap * (columns - 1)) / columns);
      const cellWidth = Math.max(0, Math.min(maxWidth, shared));

      setMetrics((previous) =>
        previous.ready &&
        previous.columns === columns &&
        previous.cellWidth === cellWidth
          ? previous
          : { columns, cellWidth, ready: true },
      );
    };

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    return () => observer.disconnect();
  }, [containerRef]);

  return metrics;
};