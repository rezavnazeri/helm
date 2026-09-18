import React from 'react';
import { useSettings } from '@/context/useSettings';
import { useI18n } from '@/i18n/useI18n';

interface ToggleProps {
  value: boolean;
  disabled?: boolean;
  onChange: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ value, disabled, onChange }) => (
  <button
    type="button"
    className={`toggle-switch ${value ? 'on' : 'off'}`}
    disabled={disabled}
    onClick={onChange}
    role="switch"
    aria-checked={value}
  >
    <span className="toggle-handle" />
  </button>
);

const GeneralSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();

  return (
    <div className="settings-section">
      <h3>{t('settings.groups.general')}</h3>

      <div className="setting-row">
        <label>{t('general.clock')}</label>
        <Toggle
          value={settings.showClock}
          onChange={() => updateSettings({ showClock: !settings.showClock })}
        />
      </div>

      {settings.showClock && (
        <div className="setting-row">
          <label>{t('general.clockFormat')}</label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${settings.clockFormat === '24h' ? 'active' : ''}`}
              onClick={() => updateSettings({ clockFormat: '24h' })}
            >
              {t('general.hours24')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${settings.clockFormat === '12h' ? 'active' : ''}`}
              onClick={() => updateSettings({ clockFormat: '12h' })}
            >
              {t('general.hours12')}
            </button>
          </div>
        </div>
      )}

      <div className="setting-row">
        <label>{t('general.date')}</label>
        <Toggle
          value={settings.showDate}
          onChange={() => updateSettings({ showDate: !settings.showDate })}
        />
      </div>

      <div className="setting-row">
        <label>{t('general.showGreeting')}</label>
        <Toggle
          value={settings.showGreeting}
          onChange={() => updateSettings({ showGreeting: !settings.showGreeting })}
        />
      </div>

      {settings.showGreeting && (
        <div className="setting-row sub-setting">
          <label>{t('general.name')}</label>
          <input
            type="text"
            className="text-input"
            placeholder={t('general.yourName')}
            value={settings.userName}
            onChange={(e) => updateSettings({ userName: e.target.value })}
          />
        </div>
      )}

      <div className="setting-row">
        <label>{t('general.quickWeather')}</label>
        <Toggle
          value={settings.showQuickWeather}
          onChange={() => updateSettings({ showQuickWeather: !settings.showQuickWeather })}
        />
      </div>


      <div className="setting-row">
        <label>{t('general.quickAccess')}</label>
        <Toggle
          value={settings.quickAccessEnabled}
          onChange={() => updateSettings({ quickAccessEnabled: !settings.quickAccessEnabled })}
        />
      </div>

      {settings.quickAccessEnabled && (
        <div className="setting-row quick-access-position-row">
          <label>{t('general.quickAccessPosition')}</label>
          <div className="segmented-control segmented-control--wrap">
            {(['left', 'top', 'right', 'bottom', 'below-header'] as const).map((position) => (
              <button
                key={position}
                type="button"
                className={`segmented-btn ${settings.quickAccessPosition === position ? 'active' : ''}`}
                onClick={() => updateSettings({ quickAccessPosition: position })}
              >
                {t(`general.quickAccessPositions.${position}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="setting-row">
        <label>{t('general.sideNav')}</label>
        <Toggle
          value={settings.sideNavEnabled}
          onChange={() => updateSettings({ sideNavEnabled: !settings.sideNavEnabled })}
        />
      </div>

      {settings.sideNavEnabled && (
        <div className="setting-row">
          <label>{t('general.sideNavPosition')}</label>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${settings.sideNavPosition === 'left' ? 'active' : ''}`}
              onClick={() => updateSettings({ sideNavPosition: 'left' })}
            >
              {t('general.sideNavLeft')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${settings.sideNavPosition === 'top' ? 'active' : ''}`}
              onClick={() => updateSettings({ sideNavPosition: 'top' })}
            >
              {t('general.sideNavTop')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${settings.sideNavPosition === 'right' ? 'active' : ''}`}
              onClick={() => updateSettings({ sideNavPosition: 'right' })}
            >
              {t('general.sideNavRight')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${settings.sideNavPosition === 'bottom' ? 'active' : ''}`}
              onClick={() => updateSettings({ sideNavPosition: 'bottom' })}
            >
              {t('general.sideNavBottom')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralSettings;