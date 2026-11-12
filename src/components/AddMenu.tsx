import React, { useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import Icon, { type IconName } from './Icon';
import type { SideNavPosition } from '@/types/settings';

/** One entry of the add menu; every space that can add things contributes one. */
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

const AddMenu: React.FC<AddMenuProps> = ({ position, options, floating = false }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const closeAnd = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className={`add-menu-anchor${floating ? ' add-menu-anchor--floating' : ''}`}>
      <div
        className={`add-menu add-menu--${position} ${floating ? 'is-fade' : 'is-slide'}${open ? ' is-open' : ''}`}
        aria-hidden={!open}
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="add-menu-option"
            data-tooltip={option.label}
            aria-label={option.label}
            tabIndex={open ? 0 : -1}
            onClick={() => closeAnd(option.onSelect)}
          >
            <Icon name={option.icon} variant="solid" size={16} />
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`${floating ? 'floating-utility' : 'nav-utility'} add-menu-trigger${open ? ' is-open' : ''}`}
        aria-label={t('navigation.add')}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="plus" variant="line" size={20} />
      </button>
    </div>
  );
};

export default AddMenu;
