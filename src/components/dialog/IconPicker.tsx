import React from 'react';
import Icon from '@/components/Icon';
import { useI18n } from '@/i18n/useI18n';
import { CARD_ICONS, type CardIcon } from '@/types/cards';

interface IconPickerProps {
  value: CardIcon;
  onChange: (icon: CardIcon) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const { t } = useI18n();

  return (
    <div className="add-dialog-field">
      <span className="add-dialog-label">{t('addDialog.folderIcon')}</span>
      <div className="icon-picker" role="radiogroup" aria-label={t('addDialog.folderIcon')}>
        {CARD_ICONS.map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            aria-label={t(`cards.icons.${name}`)}
            title={t(`cards.icons.${name}`)}
            className={`icon-picker-item${value === name ? ' is-selected' : ''}`}
            onClick={() => onChange(name)}
          >
            <Icon name={name} variant="solid" size={18} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default IconPicker;
