import React from 'react';
import { useI18n } from '@/i18n/useI18n';
import Icon from '@/components/Icon';

const AboutSettings: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="settings-section">
      <h3>{t('settings.groups.about')}</h3>

      <div className="about-card">
        <div className="about-logo">
            <Icon name='helm' variant='line' size={24}/>
        </div>
        <div>
          <h4>{t('app.name')}</h4>
          <p>{t('about.version')}</p>
        </div>
      </div>

      <p className="about-description">{t('about.description')}</p>

      <div className="about-links">
        <a href="https://github.com/rezavnazeri/helm" target="_blank" rel="noreferrer">
          {t('about.github')}
          <Icon name="external-link" size={14} />
        </a>
        <a href="https://github.com/rezavnazeri/helm/blob/main/LICENSE" target="_blank" rel="noreferrer">
          {t('about.licenses')}
        </a>
        <a href="https://github.com/rezavnazeri/helm#privacy" target="_blank" rel="noreferrer">
          {t('about.privacy')}
        </a>
      </div>
    </div>
  );
};

export default AboutSettings;