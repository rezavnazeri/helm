import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGridMetrics } from '@/hooks/useGridMetrics';
import type { CardStore } from '@/services/cardStore';
import type { CardBase, Cells } from '@/types/cards';
import { getRowCount } from '@/utils/cardGrid';

const DRAG_TYPE = 'application/x-helm-card';

/** What a card needs from the grid to be draggable and collapsible. */
export interface CardHost {
  isDragSource: boolean;
  toggle: () => void;
  onDragStart: (event: React.DragEvent<HTMLElement>, card: HTMLElement | null) => void;
  onDragEnd: () => void;
}

interface CardGridProps<Card extends CardBase> {
  store: CardStore<Card>;
  cells: Cells<Card>;
  /** The space's data is loaded; nothing is drawn before that. */
  ready: boolean;
  /** Cards that are no longer available (e.g. a deleted folder) are drawn as empty cells. */
  isAvailable?: (card: Card) => boolean;
  /** Shown above the grid (empty state, error message). */
  notice?: React.ReactNode;
  renderCard: (card: Card, host: CardHost) => React.ReactNode;
}

/**
 * Layout shared by every card space: a responsive set of columns whose cells
 * hold cards, can stay empty, and can be rearranged by drag and drop. The
 * first rows are always available as drop targets; a new row appears below
 * the last one that holds a card.
 */
function CardGrid<Card extends CardBase>({
  store,
  cells,
  ready,
  isAvailable,
  notice,
  renderCard,
}: CardGridProps<Card>) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { columns, cellWidth, ready: gridReady } = useGridMetrics(gridRef);

  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const rowCount = getRowCount(cells, columns);
  const dragRowLimit = dragId ? getRowCount(cells, columns, dragId) : 0;

  const cardAt = (index: number): Card | null => {
    const card = cells[index] ?? null;
    return card && (!isAvailable || isAvailable(card)) ? card : null;
  };

  const clearDrag = useCallback(() => {
    dragIdRef.current = null;
    setDragId(null);
    setOverIndex(null);
  }, []);

  // A drag that ends outside of any cell (or is cancelled with Escape).
  useEffect(() => {
    window.addEventListener('dragend', clearDrag);
    window.addEventListener('drop', clearDrag);

    return () => {
      window.removeEventListener('dragend', clearDrag);
      window.removeEventListener('drop', clearDrag);
    };
  }, [clearDrag]);

  const canDropAt = (index: number): boolean => {
    if (!dragId) return false;

    const current = cells.findIndex((cell) => cell?.id === dragId);
    if (current === -1 || current === index) return false;

    return Math.floor(index / columns) < dragRowLimit;
  };

  const handleDragOver = (event: React.DragEvent<HTMLElement>, index: number) => {
    if (!dragIdRef.current || !event.dataTransfer.types.includes(DRAG_TYPE)) return;

    if (!canDropAt(index)) {
      setOverIndex(null);
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>, index: number) => {
    const id = dragIdRef.current;
    if (!id || !event.dataTransfer.types.includes(DRAG_TYPE)) return;

    event.preventDefault();
    const allowed = canDropAt(index);
    clearDrag();

    if (allowed) void store.move(id, index);
  };

  const startDrag = (
    event: React.DragEvent<HTMLElement>,
    id: string,
    card: HTMLElement | null,
  ) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(DRAG_TYPE, id);

    if (card) {
      const rect = card.getBoundingClientRect();
      event.dataTransfer.setDragImage(card, event.clientX - rect.left, event.clientY - rect.top);
    }

    dragIdRef.current = id;
    // Changing the layout inside dragstart cancels the drag in some browsers.
    window.setTimeout(() => {
      if (dragIdRef.current === id) setDragId(id);
    }, 0);
  };

  return (
    <div className="space-cards">
      {notice}

      <div
        ref={gridRef}
        className={`card-grid${dragId ? ' is-dragging' : ''}${gridReady && ready ? ' is-ready' : ''}`}
      >
        {ready &&
          Array.from({ length: columns }, (_, column) => {
            const indexes = Array.from({ length: rowCount }, (_, row) => row * columns + column);

            let lastRowInColumn = -1;
            indexes.forEach((index, row) => {
              if (cells[index]) lastRowInColumn = row;
            });

            return (
              <div key={column} className="card-column" style={{ width: cellWidth }}>
                {indexes.map((index, row) => {
                  const card = cardAt(index);

                  const classes = ['card-cell'];
                  if (!card) classes.push('is-empty');
                  if (row > lastRowInColumn) classes.push('is-trailing');
                  if (dragId !== null && row >= dragRowLimit) classes.push('is-locked');
                  if (overIndex === index) classes.push('is-over');

                  return (
                    <div
                      key={card ? `card:${card.id}` : `empty:${index}`}
                      className={classes.join(' ')}
                      data-index={index}
                      onDragOver={(event) => handleDragOver(event, index)}
                      onDrop={(event) => handleDrop(event, index)}
                    >
                      {card &&
                        renderCard(card, {
                          isDragSource: dragId === card.id,
                          toggle: () => void store.toggleCollapsed(card.id),
                          onDragStart: (event, element) => startDrag(event, card.id, element),
                          onDragEnd: clearDrag,
                        })}
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default CardGrid;

