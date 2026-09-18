export interface I18nContextType {
  locale: string;
  t: (
    key: string,
    params?: Record<string, string | number>,
  ) => string;
  dir: 'ltr' | 'rtl';
}