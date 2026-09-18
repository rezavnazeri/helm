import React, { useMemo } from 'react';
import { useSettings } from '@/context/useSettings';
import { I18nContext } from './I18nContext';

import en from './locales/en.json';
import fa from './locales/fa.json';

type TranslationValue =
  | string
  | string[]
  | { [key: string]: TranslationValue };

const TRANSLATIONS: Record<string, TranslationValue> = {
  en,
  fa,
};

export const I18nProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { settings } = useSettings();

  const locale = settings.language || 'en';

  const translations =
    TRANSLATIONS[locale] ?? TRANSLATIONS.en;

  const languageDirection: 'ltr' | 'rtl' =
    locale === 'fa' ? 'rtl' : 'ltr';

  const dir: 'ltr' | 'rtl' =
    settings.textDirection === 'auto'
      ? languageDirection
      : settings.textDirection;

  const t = useMemo(
    () =>
      (
        key: string,
        params?: Record<string, string | number>,
      ): string => {
        const keys = key.split('.');
        let value: TranslationValue = translations;

        for (const k of keys) {
          if (
            value !== null &&
            typeof value === 'object'
          ) {
            if (Array.isArray(value)) {
              const idx = Number(k);

              if (
                Number.isInteger(idx) &&
                idx >= 0 &&
                idx < value.length
              ) {
                value = value[idx];
                continue;
              }
            } else if (k in value) {
              value = value[k];
              continue;
            }
          }

          return key;
        }

        if (
          params &&
          typeof value === 'string'
        ) {
          for (const [name, param] of Object.entries(
            params,
          )) {
            value = value
              .split(`{{${name}}}`)
              .join(String(param));
          }
        }

        return typeof value === 'string'
          ? value
          : key;
      },
    [translations],
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        t,
        dir,
      }}
    >
      <div dir={dir}>{children}</div>
    </I18nContext.Provider>
  );
};