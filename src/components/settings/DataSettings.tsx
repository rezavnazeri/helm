import React, { useRef } from 'react';
import { useSettings } from '@/context/useSettings';
import { useI18n } from '@/i18n/useI18n';
import Icon from '@/components/Icon';

const DataSettings: React.FC = () => {
  const { resetSettings } = useSettings();
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  const exportData = async () => {
    try {
      const result = await chrome.storage.local.get(null);
      delete result.faviconCache;
      const blob = new Blob(
        [JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...result }, null, 2)],
        { type: 'application/json' },
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'helm-backup.json';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert(t('data.exportFailed'));
    }
  };

  const importData = async (file?: File) => {
    if (!file) return;

    try {
      if (!window.confirm(t('data.importConfirm'))) return;

      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== 'object') throw new Error('invalid');

      const record = parsed as Record<string, unknown>;
      const allowed = ['settings', 'bookmarkSpace', 'sessionSpace', 'quickAccessShortcuts', 'todos', 'notes'];
      const payload = Object.fromEntries(
        allowed.filter((key) => key in record).map((key) => [key, record[key]]),
      );

      await chrome.storage.local.set(payload);
      window.location.reload();
    } catch (error) {
      console.error('Failed to import data:', error);
      alert(t('data.importFailed'));
    }
  };

  const reset = async () => {
    if (!window.confirm(t('data.resetConfirm'))) return;

    await chrome.storage.local.clear();
    await resetSettings();
    window.location.reload();
  };

  return (
    <div className="settings-section">
      <h3>{t('settings.groups.data')}</h3>

      <div className="data-block">
        <h4>{t('data.exportTitle')}</h4>
        <p>{t('data.exportDescription')}</p>
        <button type="button" className="primary-button" onClick={() => void exportData()}>
          <Icon name="download" size={17} />
          {t('data.export')}
        </button>
      </div>

      <div className="data-block">
        <h4>{t('data.import')}</h4>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => void importData(e.target.files?.[0])}
        />
        <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>
          <Icon name="upload" size={17} />
          {t('data.import')}
        </button>
      </div>

      <div className="data-block">
        <h4>{t('data.resetTitle')}</h4>
        <p>{t('data.resetDescription')}</p>
        <button type="button" className="danger-button" onClick={() => void reset()}>
          <Icon name="alert" size={17} />
          {t('data.reset')}
        </button>
      </div>
    </div>
  );
};

export default DataSettings;
