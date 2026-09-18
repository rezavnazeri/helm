import React from 'react';
import { useSettings } from '@/context/useSettings';
import { useI18n } from '@/i18n/useI18n';

interface ToggleProps {
  value: boolean;
  onChange: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ value, onChange }) => (
  <button
    type="button"
    className={`toggle-switch ${value ? 'on' : 'off'}`}
    onClick={onChange}
    role="switch"
    aria-checked={value}
  >
    <span className="toggle-handle" />
  </button>
);

const BehaviorSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();

  return (
    <div className="settings-section">
      <h3>{t('settings.groups.behavior')}</h3>

      <div className="setting-row">
        <label>{t('behavior.rememberLastSpace')}</label>
        <Toggle
          value={settings.rememberLastSpace}
          onChange={() =>
            updateSettings({ rememberLastSpace: !settings.rememberLastSpace })
          }
        />
      </div>

      <div className="setting-row">
        <label>{t('behavior.swipeNavigation')}</label>
        <Toggle
          value={settings.swipeNavigation}
          onChange={() =>
            updateSettings({ swipeNavigation: !settings.swipeNavigation })
          }
        />
      </div>

      <div className="setting-row">
        <label>{t('behavior.reducedMotion')}</label>
        <Toggle
          value={settings.reducedMotion}
          onChange={() =>
            updateSettings({ reducedMotion: !settings.reducedMotion })
          }
        />
      </div>
    </div>
  );
};

export default BehaviorSettings;