import React from 'react';
import Favicon from '@/components/Favicon';
import Icon from '@/components/Icon';
import InlineRename from '@/components/InlineRename';
import { rowHandlers } from '@/components/cards/rowHandlers';
import type { MenuRequest } from '@/components/cards/types';
import type { OpenDisposition } from '@/services/browser';
import { shortAddress } from '@/utils/links';

interface BookmarkRowProps {
  id: string;
  title: string;
  url: string;
  canRename: boolean;
  renaming: boolean;
  optionsLabel: string;
  renameLabel: string;
  onOpen: (disposition: OpenDisposition) => void;
  onOpenMenu: (request: MenuRequest) => void;
  onStartRename: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
}

/** A bookmark: favicon, name, short address and an options button. */
const BookmarkRow: React.FC<BookmarkRowProps> = ({
  id,
  title,
  url,
  canRename,
  renaming,
  optionsLabel,
  renameLabel,
  onOpen,
  onOpenMenu,
  onStartRename,
  onCommitRename,
  onCancelRename,
}) => {
  const address = shortAddress(url);
  const name = title.trim() || address;
  const handlers = rowHandlers({ id, renaming, canRename, onOpen, onOpenMenu, onStartRename });

  return (
    <div
      className={`bookmark-row${renaming ? ' is-renaming' : ''}`}
      title={renaming ? undefined : `${name}\n${url}`}
      {...handlers.row}
    >
      <Favicon key={url} url={url} className="bookmark-favicon" />

      <div className="bookmark-info">
        {renaming ? (
          <InlineRename
            className="bookmark-title"
            value={title}
            label={renameLabel}
            onCommit={onCommitRename}
            onCancel={onCancelRename}
          />
        ) : (
          <span className="bookmark-title">{name}</span>
        )}
        <span className="bookmark-address">{address}</span>
      </div>

      <button
        type="button"
        className="card-icon-button bookmark-options"
        aria-label={optionsLabel}
        {...handlers.options}
      >
        <Icon name="more-menu" size={20} />
      </button>
    </div>
  );
};

export default BookmarkRow;
