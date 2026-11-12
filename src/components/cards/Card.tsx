import React, { useRef } from 'react';
import Icon, { type IconName } from '@/components/Icon';
import InlineRename from '@/components/InlineRename';
import { useI18n } from '@/i18n/useI18n';
import type { CardHost } from './CardGrid';
import {
  menuRequestFromButton,
  menuRequestFromContextEvent,
  type MenuRequest,
} from './types';

interface CardProps {
  id: string;
  icon: IconName;
  /** Name as stored; shown as "Untitled" when empty. */
  title: string;
  count: number;
  collapsed: boolean;
  /** Whether the title can be renamed (click on the name). */
  canRename: boolean;
  renaming: boolean;
  host: CardHost;
  /** Screen-reader labels. */
  optionsLabel: string;
  renameLabel: string;
  /** Extra header buttons, placed before the options button. */
  extraActions?: React.ReactNode;
  onOpenMenu: (request: MenuRequest) => void;
  onStartRename: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
  children: React.ReactNode;
}

/**
 * Collapsible card shared by every space: a draggable header (icon, name,
 * count, buttons) above a body that expands and collapses.
 */
const Card: React.FC<CardProps> = ({
  id,
  icon,
  title,
  count,
  collapsed,
  canRename,
  renaming,
  host,
  optionsLabel,
  renameLabel,
  extraActions,
  onOpenMenu,
  onStartRename,
  onCommitRename,
  onCancelRename,
  children,
}) => {
  const { t, locale } = useI18n();
  const cardRef = useRef<HTMLDivElement>(null);

  // While the card is dragged it folds up, so the cells below move closer.
  const expanded = !collapsed && !host.isDragSource;
  const name = title.trim() || t('cards.untitled');
  const formattedCount = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(count);

  return (
    <div
      ref={cardRef}
      className={`card${expanded ? ' is-expanded' : ''}${host.isDragSource ? ' is-drag-source' : ''}`}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenMenu(menuRequestFromContextEvent(event, 'card', id));
      }}
    >
      <div
        className="card-header"
        draggable={!renaming}
        onDragStart={(event) => host.onDragStart(event, cardRef.current)}
        onDragEnd={host.onDragEnd}
      >
        <div className="card-header-main">
          <span className="card-icon">
            <Icon name={icon} variant="solid" size={18} />
          </span>

          {renaming ? (
            <InlineRename
              className="card-name"
              value={title}
              label={renameLabel}
              onCommit={onCommitRename}
              onCancel={onCancelRename}
            />
          ) : canRename ? (
            <span
              className="card-name is-editable"
              role="button"
              tabIndex={0}
              title={name}
              onClick={onStartRename}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === 'F2') {
                  event.preventDefault();
                  onStartRename();
                }
              }}
            >
              {name}
            </span>
          ) : (
            <span className="card-name" title={name}>
              {name}
            </span>
          )}

          <span className="card-count">{formattedCount}</span>
        </div>

        <div className="card-header-actions">
          {extraActions}

          <button
            type="button"
            className="card-icon-button"
            data-menu-owner={`card:${id}`}
            aria-label={optionsLabel}
            aria-haspopup="menu"
            onClick={(event) =>
              onOpenMenu(menuRequestFromButton(event.currentTarget, 'card', id))
            }
          >
            <Icon name="more-menu" size={20} />
          </button>

          <button
            type="button"
            className="card-icon-button card-toggle"
            aria-expanded={expanded}
            aria-label={expanded ? t('cards.collapse') : t('cards.expand')}
            onClick={host.toggle}
          >
            <Icon name="chevron-up" size={16} />
          </button>
        </div>
      </div>

      <div className={`card-body${expanded ? ' is-expanded' : ''}`} inert={!expanded}>
        <div className="card-body-inner">
          <div className="card-list">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Card;
