import React, { useRef } from 'react';
import Icon from '@/components/Icon';
import { useI18n } from '@/i18n/useI18n';
import type { BookmarkFolderConfig, BookmarkNode } from '@/types/bookmarks';
import { canModifyNode } from '@/utils/bookmarkTree';
import BookmarkRow from './BookmarkRow';
import InlineRename from './InlineRename';
import {
  menuRequestFromButton,
  menuRequestFromContextEvent,
  type FolderActions,
} from './types';

interface BookmarkFolderProps {
  config: BookmarkFolderConfig;
  node: BookmarkNode;
  bookmarks: BookmarkNode[];
  renamingId: string | null;
  isDragSource: boolean;
  actions: FolderActions;
}

const BookmarkFolder: React.FC<BookmarkFolderProps> = ({
  config,
  node,
  bookmarks,
  renamingId,
  isDragSource,
  actions,
}) => {
  const { t, locale } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);

  const expanded = !config.collapsed && !isDragSource;
  const modifiable = canModifyNode(node);
  const renamingFolder = renamingId === node.id;
  const name = node.title.trim() || t('bookmarks.untitled');
  const count = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(
    bookmarks.length,
  );

  return (
    <div
      ref={cardRef}
      className={`bm-card${expanded ? ' is-expanded' : ''}${isDragSource ? ' is-drag-source' : ''}`}
      onContextMenu={(event) => {
        event.preventDefault();
        actions.openMenu(menuRequestFromContextEvent(event, 'folder', node.id));
      }}
    >
      <div
        className="bm-header"
        draggable={!renamingFolder}
        onDragStart={(event) => actions.startDrag(event, node.id, cardRef.current)}
        onDragEnd={actions.endDrag}
      >
        <div className="bm-header-main">
          <span className="bm-folder-icon">
            <Icon name={config.icon} size={18} />
          </span>

          {renamingFolder ? (
            <InlineRename
              className="bm-folder-name"
              value={node.title}
              label={t('bookmarks.renameFolder')}
              onCommit={(next) => actions.commitRename(node.id, next)}
              onCancel={() => actions.cancelRename(node.id)}
            />
          ) : modifiable ? (
            <span
              className="bm-folder-name is-editable"
              role="button"
              tabIndex={0}
              title={name}
              onClick={() => actions.startRename(node.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === 'F2') {
                  event.preventDefault();
                  actions.startRename(node.id);
                }
              }}
            >
              {name}
            </span>
          ) : (
            <span className="bm-folder-name" title={name}>
              {name}
            </span>
          )}

          <span className="bm-count">{count}</span>
        </div>

        <div className="bm-header-actions">
          <button
            type="button"
            className="bm-icon-button"
            data-menu-owner={`folder:${node.id}`}
            aria-label={t('bookmarks.folderOptions')}
            aria-haspopup="menu"
            onClick={(event) =>
              actions.openMenu(menuRequestFromButton(event.currentTarget, 'folder', node.id))
            }
          >
            <Icon name="more-menu" size={20} />
          </button>

          <button
            type="button"
            className="bm-icon-button bm-toggle"
            aria-expanded={expanded}
            aria-label={expanded ? t('bookmarks.collapse') : t('bookmarks.expand')}
            onClick={() => actions.toggle(node.id)}
          >
            <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} />
          </button>
        </div>
      </div>

      <div className={`bm-body${expanded ? ' is-expanded' : ''}`} inert={!expanded}>
        <div className="bm-body-inner">
          <div className="bm-list">
            {bookmarks.length === 0 ? (
              <p className="bm-empty-folder">{t('bookmarks.emptyFolder')}</p>
            ) : (
              bookmarks.map((bookmark) => (
                <BookmarkRow
                  key={bookmark.id}
                  node={bookmark}
                  renaming={renamingId === bookmark.id}
                  canModify={canModifyNode(bookmark)}
                  actions={actions}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarkFolder;