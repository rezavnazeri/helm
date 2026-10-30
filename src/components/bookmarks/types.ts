import type { DragEvent, MouseEvent } from 'react';
import type { BookmarkNode } from '@/types/bookmarks';

export type OpenDisposition = 'current' | 'tab' | 'background-tab' | 'window';

export interface MenuRequest {
  key: string;
  kind: 'folder' | 'bookmark';
  id: string;
  x: number;
  y: number;
  alignEnd: boolean;
  toggle: boolean;
}

export interface FolderActions {
  toggle: (id: string) => void;
  openMenu: (request: MenuRequest) => void;
  startRename: (id: string) => void;
  commitRename: (id: string, title: string) => void;
  cancelRename: (id: string) => void;
  openBookmark: (node: BookmarkNode, disposition: OpenDisposition) => void;
  startDrag: (event: DragEvent<HTMLElement>, id: string, card: HTMLElement | null) => void;
  endDrag: () => void;
}

const isRtl = (): boolean => document.documentElement.dir === 'rtl';

export const menuRequestFromButton = (
  button: Element,
  kind: MenuRequest['kind'],
  id: string,
): MenuRequest => {
  const rect = button.getBoundingClientRect();
  const rtl = isRtl();

  return {
    key: `${kind}:${id}`,
    kind,
    id,
    x: rtl ? rect.left : rect.right,
    y: rect.bottom + 4,
    alignEnd: !rtl,
    toggle: true,
  };
};

export const menuRequestFromContextEvent = (
  event: MouseEvent<HTMLElement>,
  kind: MenuRequest['kind'],
  id: string,
): MenuRequest => {
  let { clientX: x, clientY: y } = event;

  if (x === 0 && y === 0) {
    const rect = event.currentTarget.getBoundingClientRect();
    x = rect.left + 24;
    y = rect.top + rect.height / 2;
  }

  return { key: `${kind}:${id}`, kind, id, x, y, alignEnd: false, toggle: false };
};
