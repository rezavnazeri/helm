import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { useI18n } from '@/i18n/useI18n';
import { useBookmarkSpace } from '@/hooks/useBookmarkSpace';
import { useBookmarkTree } from '@/hooks/useBookmarkTree';
import { BookmarkSpaceStore } from '@/services/bookmarkSpace';
import {
  BOOKMARK_FOLDER_ICONS,
  DEFAULT_BOOKMARK_FOLDER_ICON,
  type BookmarkFolderIcon,
  type BookmarkNode,
} from '@/types/bookmarks';
import { bookmarksOf, isFolder } from '@/utils/bookmarkTree';

interface AddDialogProps {
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
  const name = node.title.trim() || t('bookmarks.untitled');

  return (
    <li
      role="treeitem"
      aria-selected={selected}
      aria-expanded={subfolders.length > 0 ? open : undefined}
    >
      <div
        className={`add-folder-row${selected ? ' is-selected' : ''}${added ? ' is-added' : ''}`}
        style={{ paddingInlineStart: 6 + depth * 18 }}
      >
        {subfolders.length > 0 ? (
          <button
            type="button"
            className={`add-folder-toggle${open ? '' : ' is-collapsed'}`}
            aria-label={open ? t('bookmarks.collapse') : t('bookmarks.expand')}
            onClick={() => setOpen((previous) => !previous)}
          >
            <Icon name="chevron-down" size={14} />
          </button>
        ) : (
          <span className="add-folder-toggle-spacer" />
        )}

        <button
          type="button"
          className="add-folder-select"
          disabled={added}
          onClick={() => onSelect(node.id)}
          onDoubleClick={() => onConfirm(node.id)}
        >
          <Icon name="folder" size={16} />
          <span className="add-folder-name">{name}</span>
          <span className="add-folder-meta">
            {added ? t('addDialog.added') : bookmarksOf(node).length}
          </span>
        </button>
      </div>

      {open && subfolders.length > 0 && (
        <ul role="group" className="add-folder-children">
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

const AddDialogContent: React.FC<Omit<AddDialogProps, 'isOpen'>> = ({
  onClose,
  onFolderAdded,
}) => {
  const { t } = useI18n();
  const { state } = useBookmarkSpace();
  const { status, tree } = useBookmarkTree();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [icon, setIcon] = useState<BookmarkFolderIcon>(DEFAULT_BOOKMARK_FOLDER_ICON);
  const [busy, setBusy] = useState(false);

  const addedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cell of state.cells) if (cell) ids.add(cell.id);
    return ids;
  }, [state.cells]);

  const topLevel = useMemo(
    () => tree.flatMap((root) => root.children ?? []).filter(isFolder),
    [tree],
  );

  useEffect(() => {
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const addFolder = async (id: string | null) => {
    if (!id || busy) return;
    setBusy(true);

    try {
      await BookmarkSpaceStore.addFolder(id, icon);
      onFolderAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add bookmark folder:', error);
      setBusy(false);
    }
  };

  const canAdd = selectedId !== null && !addedIds.has(selectedId) && !busy;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="add-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-dialog-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="add-dialog-title">{t('addDialog.title')}</h2>
        <p className="add-dialog-description">{t('addDialog.description')}</p>

        <div className="add-folder-tree">
          {status === 'loading' && (
            <p className="add-dialog-message">{t('common.loading')}</p>
          )}

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

        <div className="add-dialog-field">
          <span className="add-dialog-label">{t('addDialog.folderIcon')}</span>
          <div
            className="add-folder-icons"
            role="radiogroup"
            aria-label={t('addDialog.folderIcon')}
          >
            {BOOKMARK_FOLDER_ICONS.map((name) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={icon === name}
                aria-label={t(`bookmarks.icons.${name}`)}
                title={t(`bookmarks.icons.${name}`)}
                className={`add-folder-icon${icon === name ? ' is-selected' : ''}`}
                onClick={() => setIcon(name)}
              >
                <Icon name={name} size={18} />
              </button>
            ))}
          </div>
        </div>

        <div className="add-dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!canAdd}
            onClick={() => void addFolder(selectedId)}
          >
            {t('addDialog.submit')}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddDialog: React.FC<AddDialogProps> = ({ isOpen, onClose, onFolderAdded }) =>
  isOpen ? <AddDialogContent onClose={onClose} onFolderAdded={onFolderAdded} /> : null;

export default AddDialog;
