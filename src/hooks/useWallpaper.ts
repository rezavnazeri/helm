import { useEffect } from 'react';
import { useSettings } from '@/context/useSettings';
import { getCustomWallpaper } from '@/services/customWallpaper';
import { WALLPAPER_MAP } from '@/constants/wallpapers';

const toCssUrl = (value: string) =>
  `url("${value.replace(/"/g, '\\"')}")`;

async function blobToObjectUrl(blob: Blob): Promise<string> {
  return URL.createObjectURL(blob);
}

export const useWallpaper = () => {
  const { settings } = useSettings();

  useEffect(() => {
    let cancelled = false;
    let createdObjectUrl: string | null = null;

    const apply = async () => {
      try {
        let source = WALLPAPER_MAP.default.src;
        let detected: 'light' | 'dark' =
          WALLPAPER_MAP.default.DetectedTheme;

        if (settings.wallpaper === 'custom') {
          const custom = await getCustomWallpaper();

          if (cancelled) {
            return;
          }

          if (custom?.blob) {
            source = await blobToObjectUrl(custom.blob);
            createdObjectUrl = source;
            detected = custom.DetectedTheme;
          } else {
            source = WALLPAPER_MAP.default.src;
            detected =
              WALLPAPER_MAP.default.DetectedTheme;
          }
        } else if (WALLPAPER_MAP[settings.wallpaper]) {
          source =
            WALLPAPER_MAP[settings.wallpaper].src;

          detected =
            WALLPAPER_MAP[settings.wallpaper]
              .DetectedTheme;
        }

        if (settings.theme !== 'auto') {
          detected = settings.theme;
        }

        if (cancelled) {
          return;
        }

        const root = document.documentElement;

        root.setAttribute(
          'data-theme',
          detected,
        );

        root.style.setProperty(
          '--wallpaper-url',
          toCssUrl(source),
        );

        root.style.setProperty(
          '--wallpaper-dim-alpha',
          String(
            Math.min(
              100,
              Math.max(
                0,
                settings.wallpaperDimming,
              ),
            ) / 100,
          ),
        );

        try {
          const raw = localStorage.getItem('helm-bootstrap-settings');
          const cached = raw ? JSON.parse(raw) : {};
          localStorage.setItem(
            'helm-bootstrap-settings',
            JSON.stringify({
              ...cached,
              theme: settings.theme,
              wallpaper: settings.wallpaper,
              wallpaperRevision: settings.wallpaperRevision,
              wallpaperDimming: settings.wallpaperDimming,
              resolvedTheme: detected,
            }),
          );
        } catch {
          // Startup cache is optional.
        }
      } catch (error) {
        console.error(
          'Failed to apply wallpaper:',
          error,
        );
      }
    };

    void apply();

    return () => {
      cancelled = true;

      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
        createdObjectUrl = null;
      }
    };
  }, [
    settings.wallpaper,
    settings.wallpaperRevision,
    settings.theme,
    settings.wallpaperDimming,
  ]);

  return null;
};