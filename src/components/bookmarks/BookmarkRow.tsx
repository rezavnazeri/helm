import React, { useState } from 'react';
import Icon from '@/components/Icon';
import { useI18n } from '@/i18n/useI18n';
import type { BookmarkNode } from '@/types/bookmarks';
import { bookmarkFaviconUrl, shortAddress } from '@/utils/bookmarkTree';
import InlineRename from './InlineRename';
import {
  menuRequestFromButton,
  menuRequestFromContextEvent,
  type FolderActions,
  type OpenDisposition,
} from './types';

interface BookmarkRowProps {
  node: BookmarkNode;
  renaming: boolean;
  canModify: boolean;
  actions: FolderActions;
}

const BookmarkFavicon: React.FC<{ url: string }> = ({ url }) => {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span className="bm-favicon bm-favicon--fallback">
        <Icon name="globe" size={16} />
      </span>
    );
  }

  return (
    <img
      className="bm-favicon"
      src={bookmarkFaviconUrl(url)}
      alt=""
      loading="lazy"
      draggable={false}
      onError={() => setBroken(true)}
    />
  );
};

const dispositionFor = (event: React.MouseEvent): OpenDisposition => {
  const modifier = event.ctrlKey || event.metaKey;

  if (modifier && event.shiftKey) return 'tab';
  if (modifier) return 'background-tab';
  if (event.shiftKey) return 'window';
  return 'current';
};

const BookmarkRow: React.FC<BookmarkRowProps> = ({
  node,
  renaming,
  canModify,
  actions,
}) => {
  const { t } = useI18n();
  const url = node.url ?? '';
  const address = shortAddress(url);
  const title = node.title.trim() || address;

  return (
    <div
      className={`bm-row${renaming ? ' is-renaming' : ''}`}
      tabIndex={renaming ? -1 : 0}
      title={renaming ? undefined : `${title}\n${url}`}
      onClick={(event) => {
        if (renaming) return;
        actions.openBookmark(node, dispositionFor(event));
      }}
      onMouseDown={(event) => {
        if (event.button === 1) event.preventDefault();
      }}
      onAuxClick={(event) => {
        if (renaming || event.button !== 1) return;
        event.preventDefault();
        actions.openBookmark(node, 'background-tab');
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        actions.openMenu(menuRequestFromContextEvent(event, 'bookmark', node.id));
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          actions.openBookmark(node, 'current');
        } else if (event.key === 'F2' && canModify) {
          event.preventDefault();
          actions.startRename(node.id);
        }
      }}
    >
      <BookmarkFavicon key={url} url={url} />

      <div className="bm-info">
        {renaming ? (
          <InlineRename
            className="bm-title"
            value={node.title}
            label={t('bookmarks.renameBookmark')}
            onCommit={(next) => actions.commitRename(node.id, next)}
            onCancel={() => actions.cancelRename(node.id)}
          />
        ) : (
          <span className="bm-title">{title}</span>
        )}
        <span className="bm-address">{address}</span>
      </div>

      <button
        type="button"
        className="bm-icon-button bm-options"
        data-menu-owner={`bookmark:${node.id}`}
        aria-label={t('bookmarks.bookmarkOptions')}
        aria-haspopup="menu"
        onClick={(event) => {
          event.stopPropagation();
          actions.openMenu(menuRequestFromButton(event.currentTarget, 'bookmark', node.id));
        }}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <Icon name="more-menu" size={20} />
      </button>
    </div>
  );
};

export default BookmarkRow;