import React from 'react';
import { useSettings } from '@/context/useSettings';
import { useI18n } from '@/i18n/useI18n';

const LanguageSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { t, locale } = useI18n();

  const localeCode = locale === 'fa' ? 'fa-IR' : 'en-US';
  const exampleDate = new Date();

  const formatExample = (format: typeof settings.dateFormat) => {
    if (format === 'local') {
      return exampleDate.toLocaleDateString(localeCode);
    }

    if (format === 'long') {
      return exampleDate.toLocaleDateString(localeCode, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    if (format === 'medium') {
      return exampleDate.toLocaleDateString(localeCode, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }

    return exampleDate.toLocaleDateString(localeCode, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleLanguageChange = (language: string) => {
    updateSettings({
      language,
      textDirection: 'auto',
    });
  };

  return (
    <div className="settings-section">
      <h3>{t('settings.groups.language')}</h3>

      <div className="setting-row">
        <label>{t('language.language')}</label>
        <select
          className="select-input"
          value={settings.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
        >
          <option value="en">{t('language.languages.en')}</option>
          <option value="fa">{t('language.languages.fa')}</option>
        </select>
      </div>

      <div className="setting-row">
        <label>{t('language.textDirection')}</label>
        <select
          className="select-input"
          value={settings.textDirection}
          onChange={(e) =>
            updateSettings({
              textDirection: e.target.value as 'auto' | 'ltr' | 'rtl',
            })
          }
        >
          <option value="auto">
            {t('language.directions.auto', {
              direction: locale === 'fa' ? 'RTL' : 'LTR',
            })}
          </option>
          <option value="ltr">{t('language.directions.ltr')}</option>
          <option value="rtl">{t('language.directions.rtl')}</option>
        </select>
      </div>

      <div className="setting-row">
        <label>{t('language.dateFormat')}</label>
        <select
          className="select-input"
          value={settings.dateFormat}
          onChange={(e) =>
            updateSettings({
              dateFormat: e.target.value as typeof settings.dateFormat,
            })
          }
        >
          <option value="local">{formatExample('local')}</option>
          <option value="long">{formatExample('long')}</option>
          <option value="medium">{formatExample('medium')}</option>
          <option value="short">{formatExample('short')}</option>
        </select>
      </div>

      <div className="setting-row">
        <label>{t('language.firstDay')}</label>
        <div className="segmented-control">
          {(['monday', 'sunday', 'saturday'] as const).map((day) => (
            <button
              key={day}
              type="button"
              className={`segmented-btn ${
                settings.firstDayOfWeek === day ? 'active' : ''
              }`}
              onClick={() => updateSettings({ firstDayOfWeek: day })}
            >
              {t(`language.days.${day}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSettings;
