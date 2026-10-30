import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ContextMenu, { type ContextMenuItem } from '@/components/ContextMenu';
import BookmarkFolder from '@/components/bookmarks/BookmarkFolder';
import type {
  FolderActions,
  MenuRequest,
  OpenDisposition,
} from '@/components/bookmarks/types';
import { useBookmarkSpace } from '@/hooks/useBookmarkSpace';
import { useBookmarkTree } from '@/hooks/useBookmarkTree';
import { useGridMetrics } from '@/hooks/useGridMetrics';
import { useI18n } from '@/i18n/useI18n';
import { BookmarksService } from '@/services/bookmarks';
import { BookmarkSpaceStore } from '@/services/bookmarkSpace';
import { BrowserService } from '@/services/browser';
import type { BookmarkNode } from '@/types/bookmarks';
import { getRowCount, lastOccupiedIndex } from '@/utils/bookmarkGrid';
import {
  bookmarksOf,
  canModifyNode,
  indexTree,
  isFolder,
} from '@/utils/bookmarkTree';

const DRAG_TYPE = 'application/x-helm-bookmark-folder';

interface BookmarksProps {
  onAddFolder: () => void;
}

interface DragState {
  id: string;
}

const Bookmarks: React.FC<BookmarksProps> = ({ onAddFolder }) => {
  const { t } = useI18n();
  const { loaded, state } = useBookmarkSpace();
  const { status, tree, patchTitle, patchRemoved } = useBookmarkTree();

  const gridRef = useRef<HTMLDivElement>(null);
  const { columns, cellWidth, ready: gridReady } = useGridMetrics(gridRef);

  const [menu, setMenu] = useState<MenuRequest | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const cells = state.cells;
  const nodes = useMemo(() => indexTree(tree), [tree]);
  const ready = loaded && status === 'ready';

  useEffect(() => {
    if (!ready) return;

    const existing = new Set<string>();
    for (const cell of cells) {
      const node = cell ? nodes.get(cell.id) : undefined;
      if (cell && node && isFolder(node)) existing.add(cell.id);
    }

    void BookmarkSpaceStore.keepOnly(existing);
  }, [ready, cells, nodes]);

  const rowCount = getRowCount(cells, columns);
  const hasFolders = lastOccupiedIndex(cells) >= 0;
  const dragRowLimit = drag ? getRowCount(cells, columns, drag.id) : 0;

  const folderAt = (index: number) => {
    const config = cells[index] ?? null;
    const node = config ? nodes.get(config.id) : undefined;
    return config && node && isFolder(node) ? { config, node } : null;
  };

  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenu = useCallback((request: MenuRequest) => {
    setMenu((previous) =>
      request.toggle && previous?.key === request.key ? null : request,
    );
  }, []);

  const removeFolderFromSpace = async (id: string) => {
    try {
      await BookmarkSpaceStore.removeFolder(id);
    } catch (error) {
      console.error('Failed to remove bookmark folder from space:', error);
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      await BookmarksService.removeBookmark(id);
      patchRemoved(id);
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  const openBookmark = useCallback(
    (node: BookmarkNode, disposition: OpenDisposition) => {
      const url = node.url;
      if (!url) return;

      if (disposition === 'tab') void BrowserService.openInNewTab(url, true);
      else if (disposition === 'background-tab') void BrowserService.openInNewTab(url, false);
      else if (disposition === 'window') void BrowserService.openInNewWindow([url]);
      else void BrowserService.openInCurrentTab(url);
    },
    [],
  );

  const menuItems = (request: MenuRequest): ContextMenuItem[] | null => {
    const node = nodes.get(request.id);
    if (!node) return null;

    const modifiable = canModifyNode(node);
    const rename: ContextMenuItem = {
      id: 'rename',
      label: t('bookmarks.rename'),
      icon: 'edit',
      separatorBefore: true,
      disabled: !modifiable,
      onSelect: () => setRenamingId(node.id),
    };

    if (request.kind === 'folder') {
      const urls = bookmarksOf(node).map((bookmark) => bookmark.url);
      const isEmpty = urls.length === 0;

      return [
        {
          id: 'open-all',
          label: t('bookmarks.openAll'),
          icon: 'external-link',
          disabled: isEmpty,
          onSelect: () => void BrowserService.openAll(urls),
        },
        {
          id: 'open-all-tabs',
          label: t('bookmarks.openAllNewTabs'),
          //icon: 'plus',
          disabled: isEmpty,
          onSelect: () => void BrowserService.openAllInNewTabs(urls),
        },
        {
          id: 'open-all-window',
          label: t('bookmarks.openAllNewWindow'),
          //icon: 'layout',
          disabled: isEmpty,
          onSelect: () => void BrowserService.openInNewWindow(urls),
        },
        rename,
        {
          id: 'remove',
          label: t('bookmarks.remove'),
          icon: 'delete',
          onSelect: () => void removeFolderFromSpace(node.id),
        },
      ];
    }

    return [
      {
        id: 'open',
        label: t('bookmarks.open'),
        icon: 'external-link',
        onSelect: () => openBookmark(node, 'current'),
      },
      {
        id: 'open-tab',
        label: t('bookmarks.openNewTab'),
        //icon: 'plus',
        onSelect: () => openBookmark(node, 'tab'),
      },
      {
        id: 'open-window',
        label: t('bookmarks.openNewWindow'),
        //icon: 'layout',
        onSelect: () => openBookmark(node, 'window'),
      },
      rename,
      {
        id: 'delete',
        label: t('bookmarks.delete'),
        icon: 'delete',
        danger: true,
        disabled: !modifiable,
        onSelect: () => void deleteBookmark(node.id),
      },
    ];
  };

  const clearDrag = useCallback(() => {
    dragIdRef.current = null;
    setDrag(null);
    setOverIndex(null);
  }, []);

  useEffect(() => {
    window.addEventListener('dragend', clearDrag);
    window.addEventListener('drop', clearDrag);

    return () => {
      window.removeEventListener('dragend', clearDrag);
      window.removeEventListener('drop', clearDrag);
    };
  }, [clearDrag]);

  const canDropAt = (index: number): boolean => {
    if (!drag) return false;

    const current = cells.findIndex((cell) => cell?.id === drag.id);
    if (current === -1 || current === index) return false;

    return Math.floor(index / columns) < dragRowLimit;
  };

  const handleCellDragOver = (event: React.DragEvent<HTMLElement>, index: number) => {
    if (!dragIdRef.current || !event.dataTransfer.types.includes(DRAG_TYPE)) return;

    if (!canDropAt(index)) {
      setOverIndex(null);
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  };

  const handleCellDrop = (event: React.DragEvent<HTMLElement>, index: number) => {
    const id = dragIdRef.current;
    if (!id || !event.dataTransfer.types.includes(DRAG_TYPE)) return;

    event.preventDefault();
    const allowed = canDropAt(index);
    clearDrag();

    if (allowed) void BookmarkSpaceStore.moveFolder(id, index);
  };

  const actions: FolderActions = {
    toggle: (id) => {
      const config = cells.find((cell) => cell?.id === id);
      if (config) void BookmarkSpaceStore.setCollapsed(id, !config.collapsed);
    },
    openMenu,
    startRename: (id) => {
      const node = nodes.get(id);
      if (node && canModifyNode(node)) setRenamingId(id);
    },
    commitRename: (id, title) => {
      void (async () => {
        try {
          await BookmarksService.rename(id, title);
          patchTitle(id, title);
        } catch (error) {
          console.error('Failed to rename:', error);
        }

        setRenamingId((current) => (current === id ? null : current));
      })();
    },
    cancelRename: (id) => setRenamingId((current) => (current === id ? null : current)),
    openBookmark,
    startDrag: (event, id, card) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(DRAG_TYPE, id);

      if (card) {
        const rect = card.getBoundingClientRect();
        event.dataTransfer.setDragImage(
          card,
          event.clientX - rect.left,
          event.clientY - rect.top,
        );
      }

      dragIdRef.current = id;
      window.setTimeout(() => {
        if (dragIdRef.current === id) setDrag({ id });
      }, 0);
    },
    endDrag: clearDrag,
  };

  const activeMenuItems = menu ? menuItems(menu) : null;

  return (
    <div className="space-bookmarks">
      {status === 'unavailable' && (
        <p className="bm-message">{t('bookmarks.unavailable')}</p>
      )}

      {ready && !hasFolders && (
        <div className="bm-empty">
          <p>{t('bookmarks.emptyTitle')}</p>
          <span>{t('bookmarks.emptyHint')}</span>
          <button type="button" className="primary-button" onClick={onAddFolder}>
            {t('bookmarks.addFolder')}
          </button>
        </div>
      )}

      <div
        ref={gridRef}
        className={`bm-grid${drag ? ' is-dragging' : ''}${gridReady && ready ? ' is-ready' : ''}`}
      >
        {ready &&
          Array.from({ length: columns }, (_, column) => {
            const indexes = Array.from({ length: rowCount }, (_, row) => row * columns + column);

            let lastRowInColumn = -1;
            indexes.forEach((index, row) => {
              if (cells[index]) lastRowInColumn = row;
            });

            return (
              <div key={column} className="bm-column" style={{ width: cellWidth }}>
                {indexes.map((index, row) => {
                  const folder = folderAt(index);
                  const isTrailing = row > lastRowInColumn;
                  const isLocked = drag !== null && row >= dragRowLimit;

                  const classes = ['bm-cell'];
                  if (!folder) classes.push('is-empty');
                  if (isTrailing) classes.push('is-trailing');
                  if (isLocked) classes.push('is-locked');
                  if (overIndex === index) classes.push('is-over');

                  return (
                    <div
                      key={folder ? `folder:${folder.config.id}` : `empty:${index}`}
                      className={classes.join(' ')}
                      data-index={index}
                      onDragOver={(event) => handleCellDragOver(event, index)}
                      onDrop={(event) => handleCellDrop(event, index)}
                    >
                      {folder && (
                        <BookmarkFolder
                          config={folder.config}
                          node={folder.node}
                          bookmarks={bookmarksOf(folder.node)}
                          renamingId={renamingId}
                          isDragSource={drag?.id === folder.config.id}
                          actions={actions}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>

      {menu && activeMenuItems && (
        <ContextMenu
          ownerKey={menu.key}
          x={menu.x}
          y={menu.y}
          alignEnd={menu.alignEnd}
          label={menu.kind === 'folder' ? t('bookmarks.folderOptions') : t('bookmarks.bookmarkOptions')}
          items={activeMenuItems}
          onClose={closeMenu}
        />
      )}
    </div>
  );
};

export default Bookmarks;
