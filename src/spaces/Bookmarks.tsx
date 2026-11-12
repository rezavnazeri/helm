import React, { useEffect, useMemo } from 'react';
import BookmarkRow from '@/components/bookmarks/BookmarkRow';
import Card from '@/components/cards/Card';
import CardGrid from '@/components/cards/CardGrid';
import { openAllItems, openLinkItems, renameItem } from '@/components/cards/menuItems';
import type { MenuRequest } from '@/components/cards/types';
import ContextMenu, { type ContextMenuItem } from '@/components/ContextMenu';
import { useBookmarkTree } from '@/hooks/useBookmarkTree';
import { useCardStore } from '@/hooks/useCardStore';
import { useCardUi } from '@/hooks/useCardUi';
import { useI18n } from '@/i18n/useI18n';
import { BookmarksService } from '@/services/bookmarks';
import { BookmarkStore } from '@/services/bookmarkSpace';
import { BrowserService } from '@/services/browser';
import { lastOccupiedIndex } from '@/utils/cardGrid';
import { bookmarksOf, canModifyNode, indexTree, isFolder } from '@/utils/bookmarkTree';

interface BookmarksProps {
  onAddFolder: () => void;
}

const Bookmarks: React.FC<BookmarksProps> = ({ onAddFolder }) => {
  const { t } = useI18n();
  const { loaded, cells } = useCardStore(BookmarkStore);
  const { status, tree, patchTitle, patchRemoved } = useBookmarkTree();
  const { menu, openMenu, closeMenu, renamingId, setRenamingId, cancelRename } = useCardUi();

  const nodes = useMemo(() => indexTree(tree), [tree]);
  const ready = loaded && status === 'ready';

  // Forget displayed folders that no longer exist in Chrome.
  useEffect(() => {
    if (!ready) return;

    const existing = new Set<string>();
    for (const cell of cells) {
      const node = cell ? nodes.get(cell.id) : undefined;
      if (cell && node && isFolder(node)) existing.add(cell.id);
    }

    void BookmarkStore.keepOnly(existing);
  }, [ready, cells, nodes]);

  const commitRename = (id: string, title: string) => {
    void (async () => {
      try {
        await BookmarksService.rename(id, title);
        patchTitle(id, title);
      } catch (error) {
        console.error('Failed to rename:', error);
      }

      cancelRename(id);
    })();
  };

  const deleteBookmark = async (id: string) => {
    try {
      await BookmarksService.removeBookmark(id);
      patchRemoved(id);
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  const menuItems = (request: MenuRequest): ContextMenuItem[] | null => {
    const node = nodes.get(request.id);
    if (!node) return null;

    const modifiable = canModifyNode(node);
    const rename = renameItem(t, modifiable, () => setRenamingId(node.id));

    if (request.kind === 'card') {
      return [
        ...openAllItems(t, bookmarksOf(node).map((bookmark) => bookmark.url), node.title),
        rename,
        {
          id: 'remove',
          label: t('bookmarks.remove'),
          icon: 'delete',
          onSelect: () => void BookmarkStore.remove(node.id),
        },
      ];
    }

    return [
      ...openLinkItems(t, node.url ?? ''),
      rename,
      {
        id: 'delete',
        label: t('cards.delete'),
        icon: 'delete',
        danger: true,
        disabled: !modifiable,
        onSelect: () => void deleteBookmark(node.id),
      },
    ];
  };

  const items = menu ? menuItems(menu) : null;

  let notice: React.ReactNode = null;
  if (status === 'unavailable') {
    notice = <p className="card-message">{t('bookmarks.unavailable')}</p>;
  } else if (ready && lastOccupiedIndex(cells) < 0) {
    notice = (
      <div className="card-empty">
        <p>{t('bookmarks.emptyTitle')}</p>
        <span>{t('bookmarks.emptyHint')}</span>
        <button type="button" className="primary-button" onClick={onAddFolder}>
          {t('bookmarks.addFolder')}
        </button>
      </div>
    );
  }

  return (
    <>
      <CardGrid
        store={BookmarkStore}
        cells={cells}
        ready={ready}
        notice={notice}
        isAvailable={(card) => {
          const node = nodes.get(card.id);
          return node !== undefined && isFolder(node);
        }}
        renderCard={(card, host) => {
          const folder = nodes.get(card.id);
          if (!folder) return null;

          const bookmarks = bookmarksOf(folder);

          return (
            <Card
              id={folder.id}
              icon={card.icon}
              title={folder.title}
              count={bookmarks.length}
              collapsed={card.collapsed}
              canRename={canModifyNode(folder)}
              renaming={renamingId === folder.id}
              host={host}
              optionsLabel={t('bookmarks.folderOptions')}
              renameLabel={t('bookmarks.renameFolder')}
              onOpenMenu={openMenu}
              onStartRename={() => setRenamingId(folder.id)}
              onCommitRename={(title) => commitRename(folder.id, title)}
              onCancelRename={() => cancelRename(folder.id)}
            >
              {bookmarks.length === 0 ? (
                <p className="card-empty-list">{t('bookmarks.emptyFolder')}</p>
              ) : (
                bookmarks.map((bookmark) => (
                  <BookmarkRow
                    key={bookmark.id}
                    id={bookmark.id}
                    title={bookmark.title}
                    url={bookmark.url ?? ''}
                    canRename={canModifyNode(bookmark)}
                    renaming={renamingId === bookmark.id}
                    optionsLabel={t('bookmarks.bookmarkOptions')}
                    renameLabel={t('bookmarks.renameBookmark')}
                    onOpen={(disposition) =>
                      void BrowserService.open(bookmark.url ?? '', disposition)
                    }
                    onOpenMenu={openMenu}
                    onStartRename={() => setRenamingId(bookmark.id)}
                    onCommitRename={(title) => commitRename(bookmark.id, title)}
                    onCancelRename={() => cancelRename(bookmark.id)}
                  />
                ))
              )}
            </Card>
          );
        }}
      />

      {menu && items && (
        <ContextMenu
          ownerKey={menu.key}
          x={menu.x}
          y={menu.y}
          alignEnd={menu.alignEnd}
          label={menu.kind === 'card' ? t('bookmarks.folderOptions') : t('bookmarks.bookmarkOptions')}
          items={items}
          onClose={closeMenu}
        />
      )}
    </>
  );
};

export default Bookmarks;
