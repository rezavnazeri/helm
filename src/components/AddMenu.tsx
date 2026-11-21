import React, { useCallback, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import Icon, { type IconName } from './Icon';
import type { SideNavPosition } from '@/types/settings';

export interface AddMenuOption {
  id: string;
  icon: IconName;
  label: string;
  onSelect: () => void;
}

interface AddMenuProps {
  position: SideNavPosition;
  options: AddMenuOption[];
  floating?: boolean;
}

interface MenuAnchor {
  x: number;
  y: number;
  alignEnd: boolean;
  alignBottom: boolean;
}

const GAP = 8;

const anchorFor = (rect: DOMRect, position: SideNavPosition): MenuAnchor => {
  const lowerHalf = rect.top + rect.height / 2 > window.innerHeight / 2;
  const rightHalf = rect.left + rect.width / 2 > window.innerWidth / 2;

  if (position === 'left' || position === 'right') {
    const toTheLeft = position === 'right';

    return {
      x: toTheLeft ? rect.left - GAP : rect.right + GAP,
      y: lowerHalf ? rect.bottom : rect.top,
      alignEnd: toTheLeft,
      alignBottom: lowerHalf,
    };
  }

  const below = position === 'top';

  return {
    x: rightHalf ? rect.right : rect.left,
    y: below ? rect.bottom + GAP : rect.top - GAP,
    alignEnd: rightHalf,
    alignBottom: !below,
  };
};

const AddMenu: React.FC<AddMenuProps> = ({ position, options, floating = false }) => {
  const { t } = useI18n();
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);

  const close = useCallback(() => setAnchor(null), []);

  const items: ContextMenuItem[] = options.map((option) => ({
    id: option.id,
    label: option.label,
    icon: option.icon,
    onSelect: option.onSelect,
  }));

  return (
    <>
      <button
        type="button"
        className={`${floating ? 'floating-utility' : 'nav-utility'} add-menu-trigger`}
        data-menu-owner="add"
        aria-label={t('navigation.add')}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setAnchor((current) => (current ? null : anchorFor(rect, position)));
        }}
      >
        <Icon name="plus" variant="line" size={20} />
      </button>

      {anchor && (
        <ContextMenu
          ownerKey="add"
          x={anchor.x}
          y={anchor.y}
          alignEnd={anchor.alignEnd}
          alignBottom={anchor.alignBottom}
          label={t('navigation.add')}
          items={items}
          onClose={close}
        />
      )}
    </>
  );
};

export default AddMenu;
