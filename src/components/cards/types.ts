import type { MouseEvent } from 'react';

export interface MenuRequest {
  /** `${kind}:${id}`; matches the data-menu-owner of the button that opens it. */
  key: string;
  kind: 'card' | 'row';
  id: string;
  x: number;
  y: number;
  alignEnd: boolean;
  /** Pressing the same trigger again closes the menu. */
  toggle: boolean;
}

const isRtl = (): boolean => document.documentElement.dir === 'rtl';

/** Menu opened with a "more options" button: anchored below the button. */
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

/** Menu opened with a right click (or the keyboard's context-menu key). */
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
