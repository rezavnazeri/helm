import React, { useMemo, useState } from 'react';
import AddDialogShell from '@/components/dialog/AddDialogShell';
import IconPicker from '@/components/dialog/IconPicker';
import Icon from '@/components/Icon';
import { useBookmarkTree } from '@/hooks/useBookmarkTree';
import { useCardStore } from '@/hooks/useCardStore';
import { useI18n } from '@/i18n/useI18n';
import { BookmarkStore } from '@/services/bookmarkSpace';
import type { BookmarkNode } from '@/types/bookmarks';
import type { CardIcon } from '@/types/cards';
import { bookmarksOf, isFolder } from '@/utils/bookmarkTree';

interface AddBookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFolderAdded: () => void;
}

interface FolderOptionProps {
  node: BookmarkNode;
  depth: number;
  selectedId: string | null;
  addedIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
  onConfirm: (id: string) => void;
}

const FolderOption: React.FC<FolderOptionProps> = ({
  node,
  depth,
  selectedId,
  addedIds,
  onSelect,
  onConfirm,
}) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(depth === 0);

  const subfolders = (node.children ?? []).filter(isFolder);
  const added = addedIds.has(node.id);
  const selected = selectedId === node.id;
  const name = node.title.trim() || t('cards.untitled');

  return (
    <li
      role="treeitem"
      aria-selected={selected}
      aria-expanded={subfolders.length > 0 ? open : undefined}
    >
      <div
        className={`tree-row${selected ? ' is-selected' : ''}${added ? ' is-added' : ''}`}
        style={{ paddingInlineStart: 6 + depth * 18 }}
      >
        {subfolders.length > 0 ? (
          <button
            type="button"
            className={`tree-toggle${open ? '' : ' is-collapsed'}`}
            aria-label={open ? t('cards.collapse') : t('cards.expand')}
            onClick={() => setOpen((previous) => !previous)}
          >
            <Icon name="chevron-down" size={14} />
          </button>
        ) : (
          <span className="tree-toggle-spacer" />
        )}

        <button
          type="button"
          className="tree-select"
          disabled={added}
          onClick={() => onSelect(node.id)}
          onDoubleClick={() => onConfirm(node.id)}
        >
          <Icon name="folder" variant="solid" size={16} />
          <span className="tree-name">{name}</span>
          <span className="tree-meta">
            {added ? t('addDialog.added') : bookmarksOf(node).length}
          </span>
        </button>
      </div>

      {open && subfolders.length > 0 && (
        <ul role="group">
          {subfolders.map((child) => (
            <FolderOption
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              addedIds={addedIds}
              onSelect={onSelect}
              onConfirm={onConfirm}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const Content: React.FC<Omit<AddBookmarkDialogProps, 'isOpen'>> = ({
  onClose,
  onFolderAdded,
}) => {
  const { t } = useI18n();
  const { cells } = useCardStore(BookmarkStore);
  const { status, tree } = useBookmarkTree();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [icon, setIcon] = useState<CardIcon>('bookmark');
  const [busy, setBusy] = useState(false);

  const addedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cell of cells) if (cell) ids.add(cell.id);
    return ids;
  }, [cells]);

  const topLevel = useMemo(
    () => tree.flatMap((root) => root.children ?? []).filter(isFolder),
    [tree],
  );

  const addFolder = async (id: string | null) => {
    if (!id || busy) return;
    setBusy(true);

    try {
      await BookmarkStore.add({ id, icon, collapsed: false });
      onFolderAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add bookmark folder:', error);
      setBusy(false);
    }
  };

  return (
    <AddDialogShell
      title={t('addDialog.title')}
      description={t('addDialog.description')}
      submitLabel={t('addDialog.submit')}
      canSubmit={selectedId !== null && !addedIds.has(selectedId) && !busy}
      onSubmit={() => void addFolder(selectedId)}
      onClose={onClose}
    >
      <div className="dialog-tree">
        {status === 'loading' && <p className="add-dialog-message">{t('common.loading')}</p>}

        {status === 'unavailable' && (
          <p className="add-dialog-message">{t('bookmarks.unavailable')}</p>
        )}

        {status === 'ready' && topLevel.length === 0 && (
          <p className="add-dialog-message">{t('addDialog.noFolders')}</p>
        )}

        {status === 'ready' && topLevel.length > 0 && (
          <ul role="tree" aria-label={t('addDialog.title')}>
            {topLevel.map((node) => (
              <FolderOption
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                addedIds={addedIds}
                onSelect={setSelectedId}
                onConfirm={(id) => void addFolder(id)}
              />
            ))}
          </ul>
        )}
      </div>

      <IconPicker value={icon} onChange={setIcon} />
    </AddDialogShell>
  );
};

const AddBookmarkDialog: React.FC<AddBookmarkDialogProps> = ({
  isOpen,
  onClose,
  onFolderAdded,
}) => (isOpen ? <Content onClose={onClose} onFolderAdded={onFolderAdded} /> : null);

export default AddBookmarkDialog;
