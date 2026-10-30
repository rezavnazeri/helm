import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon, { type IconName } from '@/components/Icon';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: IconName;
  disabled?: boolean;
  danger?: boolean;
  separatorBefore?: boolean;
  onSelect: () => void;
}

interface ContextMenuProps {
  ownerKey: string;
  x: number;
  y: number;
  alignEnd?: boolean;
  label: string;
  items: ContextMenuItem[];
  onClose: () => void;
}

const VIEWPORT_MARGIN = 8;
const ContextMenu: React.FC<ContextMenuProps> = ({
  ownerKey,
  x,
  y,
  alignEnd = false,
  label,
  items,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const { width, height } = menu.getBoundingClientRect();
    const desiredLeft = alignEnd ? x - width : x;
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;

    menu.style.left = `${Math.max(VIEWPORT_MARGIN, Math.min(desiredLeft, maxLeft))}px`;
    menu.style.top = `${Math.max(VIEWPORT_MARGIN, Math.min(y, maxTop))}px`;
    menu.style.visibility = 'visible';
    menu.focus({ preventScroll: true });
  }, [x, y, alignEnd]);

  useEffect(() => {
    const closeOnOutside = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target && menuRef.current?.contains(target)) return;

      const owner = target?.closest('[data-menu-owner]');
      if (
        event.type === 'pointerdown' &&
        owner?.getAttribute('data-menu-owner') === ownerKey
      ) {
        return;
      }

      onClose();
    };

    const close = () => onClose();

    window.addEventListener('pointerdown', closeOnOutside, true);
    window.addEventListener('contextmenu', closeOnOutside, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('blur', close);

    return () => {
      window.removeEventListener('pointerdown', closeOnOutside, true);
      window.removeEventListener('contextmenu', closeOnOutside, true);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('blur', close);
    };
  }, [ownerKey, onClose]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      onClose();
      return;
    }

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
    );
    if (buttons.length === 0) return;

    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;

    if (event.key === 'ArrowDown') next = (current + 1) % buttons.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;

    if (next !== -1) {
      event.preventDefault();
      buttons[next].focus();
    }
  };

  return createPortal(
    <div
      ref={menuRef}
      className="context-menu"
      role="menu"
      aria-label={label}
      tabIndex={-1}
      style={{ visibility: 'hidden' }}
      onKeyDown={handleKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item) => (
        <React.Fragment key={item.id}>
          {item.separatorBefore && (
            <div className="context-menu-separator" role="separator" />
          )}
          <button
            type="button"
            role="menuitem"
            className={`context-menu-item${item.danger ? ' is-danger' : ''}`}
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
          >
            {item.icon
              ? <Icon name={item.icon} size={16} className="context-menu-icon" />
              : <span className="context-menu-icon" aria-hidden="true" />}
            <span>{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>,
    document.body,
  );
};

export default ContextMenu;