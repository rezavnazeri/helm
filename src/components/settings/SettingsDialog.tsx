import React, { useState } from 'react';
import Icon from '@/components/Icon';
import { useI18n } from '@/i18n/useI18n';

import {
  SETTINGS_GROUPS,
  SETTINGS_GROUP_ICONS,
} from '@/constants/settings';

import { SettingsGroup } from '@/types/models';

import AppearanceSettings from './AppearanceSettings';
import GeneralSettings from './GeneralSettings';
import WeatherSettings from './WeatherSettings';
import SpacesSettings from './SpacesSettings';
import LanguageSettings from './LanguageSettings';
import BehaviorSettings from './BehaviorSettings';
import DataSettings from './DataSettings';
import AboutSettings from './AboutSettings';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SETTINGS_CONTENT: Record<SettingsGroup, React.ReactNode> = {
  general: <GeneralSettings />,
  appearance: <AppearanceSettings />,
  weather: <WeatherSettings />,
  spaces: <SpacesSettings />,
  language: <LanguageSettings />,
  behavior: <BehaviorSettings />,
  data: <DataSettings />,
  about: <AboutSettings />,
};

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useI18n();
  const [activeGroup, setActiveGroup] =
    useState<SettingsGroup>('general');

  if (!isOpen) return null;

  const disableHelm = () => {
    try {
      chrome.management.setEnabled(chrome.runtime.id, false);
    } catch {
      void chrome.tabs.create({ url: 'chrome://extensions/' });
    }
  };

  return (
    <div
      className="settings-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <h2>{t('settings.title')}</h2>

          <button
            className="settings-close"
            type="button"
            onClick={onClose}
            aria-label={t('settings.close')}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="settings-body">
          <nav
            className="settings-groups"
            aria-label={t('settings.title')}
          >
            {SETTINGS_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                className={`settings-group-item ${
                  activeGroup === group ? 'active' : ''
                }`}
                onClick={() => setActiveGroup(group)}
              >
                <Icon
                  name={SETTINGS_GROUP_ICONS[group]}
                  size={20}
                />

                <span>
                  {t(`settings.groups.${group}`)}
                </span>
              </button>
            ))}

            <div className="settings-exit">
              <button
                type="button"
                className="settings-logout-button"
                onClick={disableHelm}
                title={t('exit.disableHelp')}
              >
                <Icon name="log-out" size={18} />
                <span>{t('exit.disable')}</span>
              </button>
            </div>
          </nav>

          <div className="settings-panel">
            {SETTINGS_CONTENT[activeGroup]}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;