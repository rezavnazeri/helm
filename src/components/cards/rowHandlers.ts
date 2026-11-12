import type { MouseEvent, KeyboardEvent } from 'react';
import type { OpenDisposition } from '@/services/browser';
import {
  menuRequestFromButton,
  menuRequestFromContextEvent,
  type MenuRequest,
} from './types';

interface RowHandlerOptions {
  id: string;
  renaming: boolean;
  canRename: boolean;
  onOpen: (disposition: OpenDisposition) => void;
  onOpenMenu: (request: MenuRequest) => void;
  onStartRename: () => void;
}

/** Ctrl/Cmd = background tab, Shift = new window, both = foreground tab. */
const dispositionFor = (event: MouseEvent): OpenDisposition => {
  const modifier = event.ctrlKey || event.metaKey;

  if (modifier && event.shiftKey) return 'tab';
  if (modifier) return 'background-tab';
  if (event.shiftKey) return 'window';
  return 'current';
};

/**
 * Behaviour shared by every row of links (bookmarks, session tabs): open with
 * click, modifier keys or middle click, a context menu on right click, the
 * keyboard, and the "more options" button. Rows only differ in how they look,
 * so each one spreads these props onto its own markup.
 */
export const rowHandlers = ({
  id,
  renaming,
  canRename,
  onOpen,
  onOpenMenu,
  onStartRename,
}: RowHandlerOptions) => ({
  row: {
    tabIndex: renaming ? -1 : 0,
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (!renaming) onOpen(dispositionFor(event));
    },
    onMouseDown: (event: MouseEvent<HTMLElement>) => {
      // Stops the browser's middle-click autoscroll; auxclick opens the tab.
      if (event.button === 1) event.preventDefault();
    },
    onAuxClick: (event: MouseEvent<HTMLElement>) => {
      if (renaming || event.button !== 1) return;
      event.preventDefault();
      onOpen('background-tab');
    },
    onContextMenu: (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
      // Do not let the card's own menu open as well.
      event.stopPropagation();
      onOpenMenu(menuRequestFromContextEvent(event, 'row', id));
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpen('current');
      } else if (event.key === 'F2' && canRename) {
        event.preventDefault();
        onStartRename();
      }
    },
  },

  options: {
    'data-menu-owner': `row:${id}`,
    'aria-haspopup': 'menu' as const,
    onClick: (event: MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      onOpenMenu(menuRequestFromButton(event.currentTarget, 'row', id));
    },
    onDoubleClick: (event: MouseEvent<HTMLElement>) => event.stopPropagation(),
  },
});
