import React from 'react';
import Favicon from '@/components/Favicon';
import Icon from '@/components/Icon';
import InlineRename from '@/components/InlineRename';
import { rowHandlers } from '@/components/cards/rowHandlers';
import type { MenuRequest } from '@/components/cards/types';
import type { OpenDisposition } from '@/services/browser';
import { shortAddress } from '@/utils/links';

interface SessionRowProps {
  id: string;
  title: string;
  url: string;
  renaming: boolean;
  optionsLabel: string;
  renameLabel: string;
  onOpen: (disposition: OpenDisposition) => void;
  onOpenMenu: (request: MenuRequest) => void;
  onStartRename: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
}

/**
 * A saved tab: a small favicon and the page title. The address is not shown
 * (it is in the tooltip), and the options button only appears on hover or focus.
 */
const SessionRow: React.FC<SessionRowProps> = ({
  id,
  title,
  url,
  renaming,
  optionsLabel,
  renameLabel,
  onOpen,
  onOpenMenu,
  onStartRename,
  onCommitRename,
  onCancelRename,
}) => {
  const name = title.trim() || shortAddress(url);
  const handlers = rowHandlers({
    id,
    renaming,
    canRename: true,
    onOpen,
    onOpenMenu,
    onStartRename,
  });

  return (
    <div
      className={`session-tab${renaming ? ' is-renaming' : ''}`}
      title={renaming ? undefined : `${name}\n${url}`}
      {...handlers.row}
    >
      <Favicon key={url} url={url} className="session-tab-favicon" />

      {renaming ? (
        <InlineRename
          className="session-tab-title"
          value={title}
          label={renameLabel}
          onCommit={onCommitRename}
          onCancel={onCancelRename}
        />
      ) : (
        <span className="session-tab-title">{name}</span>
      )}

      <button
        type="button"
        className="card-icon-button session-tab-options"
        aria-label={optionsLabel}
        {...handlers.options}
      >
        <Icon name="more-menu" size={16} />
      </button>
    </div>
  );
};

export default SessionRow;
