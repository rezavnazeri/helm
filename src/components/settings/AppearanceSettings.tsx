import React, { useRef, useState } from 'react';
import { useSettings } from '@/context/useSettings';
import { useI18n } from '@/i18n/useI18n';
import Icon from '@/components/Icon';
import {
  prepareCustomWallpaper,
  saveCustomWallpaper,
} from '@/services/customWallpaper';
import { detectImageTheme } from '@/services/wallpaperAppearance';
import { BUILTIN_WALLPAPERS } from '@/constants/wallpapers';

const AppearanceSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseCustomWallpaper = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const onCustomWallpaperSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const prepared = await prepareCustomWallpaper(file);
      const DetectedTheme = await detectImageTheme(file);
      const revision = Date.now();

      await saveCustomWallpaper({
        ...prepared,
        DetectedTheme,
        createdAt: revision,
      });

      await updateSettings({
        wallpaper: 'custom',
        wallpaperRevision: revision,
        theme: 'auto',
      });
    } catch (reason) {
      console.error('Failed to save custom wallpaper:', reason);

      setError(
        reason instanceof Error && reason.message === 'Image is too large'
          ? t('appearance.customWallpaperTooLarge')
          : t('appearance.customWallpaperError'),
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="settings-section">
      <h3>{t('settings.groups.appearance')}</h3>

      <div className="setting-row">
        <label>{t('appearance.theme')}</label>

        <div className="segmented-control">
          {(['auto', 'light', 'dark'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`segmented-btn ${
                settings.theme === mode ? 'active' : ''
              }`}
              onClick={() =>
                updateSettings({
                  theme: mode,
                })
              }
            >
              {t(`appearance.themes.${mode}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-block">
        <div className="setting-block__title">
          {t('appearance.wallpaper')}
        </div>

        <div className="wallpaper-grid">
          {BUILTIN_WALLPAPERS.map((wallpaper) => (
            <button
              key={wallpaper.id}
              type="button"
              className={`wallpaper-thumbnail ${
                settings.wallpaper === wallpaper.id ? 'selected' : ''
              }`}
              onClick={() =>
                updateSettings({
                  wallpaper: wallpaper.id,
                  theme: 'auto',
                })
              }
            >
              <span className="wallpaper-preview">
                <img
                  src={wallpaper.thumbnail}
                  alt=""
                  className="wallpaper-preview-image"
                  loading="lazy"
                  draggable={false}
                />

                {settings.wallpaper === wallpaper.id && (
                  <span className="wallpaper-check">
                    <Icon name="check" size={16} />
                  </span>
                )}
              </span>

              <span className="wallpaper-name">{t(wallpaper.labelKey)}</span>
            </button>
          ))}

          <button
            type="button"
            className={`wallpaper-thumbnail custom ${
              settings.wallpaper === 'custom' ? 'selected' : ''
            }`}
            onClick={chooseCustomWallpaper}
            disabled={processing}
          >
            <span className="wallpaper-preview wallpaper-preview--custom">
              {processing ? (
                <span className="custom-wallpaper-status">
                  {t('appearance.processing')}
                </span>
              ) : (
                <Icon name="upload" size={22} />
              )}

              {settings.wallpaper === 'custom' && !processing && (
                <span className="wallpaper-check">
                  <Icon name="check" size={16} />
                </span>
              )}
            </span>

            <span className="wallpaper-name">{t('appearance.customWallpaper')}</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          className="wallpaper-file-input"
          type="file"
          accept="image/*"
          onChange={(event) => void onCustomWallpaperSelected(event)}
          style={{ display: 'none' }}
        />

        {error && <p className="settings-error">{error}</p>}
      </div>

      <div className="setting-row">
        <label>{t('appearance.wallpaperDimming')}</label>

        <div className="slider-container">
          <span className="slider-label">{t('appearance.none')}</span>

          <input
            type="range"
            min="0"
            max="100"
            value={settings.wallpaperDimming}
            onChange={(event) =>
              updateSettings({
                wallpaperDimming: Number(event.target.value),
              })
            }
            className="dimming-slider"
          />

          <span className="slider-label">{t('appearance.strong')}</span>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;