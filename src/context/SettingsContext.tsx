import React, { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, Settings } from '../types/settings';
import { StorageService } from '../services/storage';
import { SettingsContext } from './SettingsContext';

const BOOTSTRAP_KEY = 'helm-bootstrap-settings';

const readBootstrapSettings = (): Partial<Settings> | undefined => {
  try {
    const raw = localStorage.getItem(BOOTSTRAP_KEY);

    if (!raw) {
      return undefined;
    }

    return JSON.parse(raw) as Partial<Settings>;
  } catch (error) {
    console.warn(
      'Failed to read bootstrap settings:',
      error,
    );

    return undefined;
  }
};

const writeBootstrapSettings = (settings: Settings) => {
  try {
    localStorage.setItem(
      BOOTSTRAP_KEY,
      JSON.stringify(settings),
    );
  } catch (error) {
    console.warn(
      'Failed to update bootstrap settings:',
      error,
    );
  }
};

const normalizeSettings = (
  stored?: Partial<Settings>,
): Settings => {
  const source: Partial<Settings> & {
    appearance?: unknown;
    showQuote?: unknown;
    quoteFrequency?: unknown;
  } = { ...(stored ?? {}) };

  const legacyAppearance = source.appearance;
  let themeValue = source.theme;

  if (
    !themeValue &&
    (
      legacyAppearance === 'auto' ||
      legacyAppearance === 'light' ||
      legacyAppearance === 'dark'
    )
  ) {
    themeValue = legacyAppearance;
  }

  if (!themeValue) {
    themeValue = 'auto';
  }

  const cleanSource = { ...source };

  delete cleanSource.appearance;
  delete cleanSource.showQuote;
  delete cleanSource.quoteFrequency;

  const merged = {
    ...DEFAULT_SETTINGS,
    ...cleanSource,
    theme: themeValue,
  } as Settings;

  merged.visibleSpaces = {
    ...DEFAULT_SETTINGS.visibleSpaces,
    ...(stored?.visibleSpaces ?? {}),
  };

  const candidateOrder = Array.isArray(stored?.spaceOrder)
    ? stored.spaceOrder
    : DEFAULT_SETTINGS.spaceOrder;

  merged.spaceOrder = Array.from(
    new Set([
      'home',
      ...candidateOrder,
      ...DEFAULT_SETTINGS.spaceOrder,
    ]),
  );

  merged.visibleSpaces.home = true;

  if (
    typeof merged.wallpaper === 'string' &&
    merged.wallpaper.startsWith('custom:')
  ) {
    merged.wallpaper = 'default';
  }

  return merged;
};

export const SettingsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() =>
    normalizeSettings(readBootstrapSettings()),
  );

  useEffect(() => {
    void (async () => {
      try {
        const stored =
          await StorageService.get<Partial<Settings>>(
            'settings',
          );

        const normalized = normalizeSettings(stored);

        setSettings(normalized);
        writeBootstrapSettings(normalized);
      } catch (error) {
        console.error(
          'Failed to load settings:',
          error,
        );
      }
    })();
  }, []);

  const updateSettings = async (
    updates: Partial<Settings>,
  ) => {
    const newSettings = normalizeSettings({
      ...settings,
      ...updates,
    });

    setSettings(newSettings);
    writeBootstrapSettings(newSettings);

    try {
      await StorageService.set(
        'settings',
        newSettings,
      );
    } catch (error) {
      console.error(
        'Failed to save settings:',
        error,
      );
    }
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    writeBootstrapSettings(DEFAULT_SETTINGS);

    try {
      await StorageService.set(
        'settings',
        DEFAULT_SETTINGS,
      );
    } catch (error) {
      console.error(
        'Failed to reset settings:',
        error,
      );
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};