export type theme = 'auto' | 'light' | 'dark';
export type ClockFormat = '24h' | '12h';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type FirstDayOfWeek = 'monday' | 'sunday' | 'saturday';
export type DateFormat = 'local' | 'long' | 'medium' | 'short';
export type TextDirection = 'auto' | 'ltr' | 'rtl';
export type SideNavPosition = 'left' | 'top' | 'right' | 'bottom';
export type QuickAccessPosition = 'left' | 'top' | 'right' | 'bottom' | 'below-header';

export interface Settings {
  theme: theme;
  wallpaper: string;
  wallpaperRevision: number;
  wallpaperDimming: number;
  showClock: boolean;
  clockFormat: ClockFormat;
  showDate: boolean;
  showGreeting: boolean;
  userName: string;
  showQuickWeather: boolean;
  sideNavEnabled: boolean;
  sideNavPosition: SideNavPosition;
  quickAccessEnabled: boolean;
  quickAccessPosition: QuickAccessPosition;
  weatherLocation: string;
  weatherLatitude?: number;
  weatherLongitude?: number;
  weatherTimezone?: string;
  temperatureUnit: TemperatureUnit;
  visibleSpaces: Record<string, boolean>;
  spaceOrder: string[];
  language: string;
  dateFormat: DateFormat;
  textDirection: TextDirection;
  firstDayOfWeek: FirstDayOfWeek;
  rememberLastSpace: boolean;
  swipeNavigation: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  wallpaper: 'default',
  wallpaperRevision: 0,
  wallpaperDimming: 0,
  showClock: true,
  clockFormat: '24h',
  showDate: true,
  showGreeting: true,
  userName: '',
  showQuickWeather: true,
  sideNavEnabled: false,
  sideNavPosition: 'left',
  quickAccessEnabled: true,
  quickAccessPosition: 'below-header',
  weatherLocation: '',
  temperatureUnit: 'celsius',
  visibleSpaces: { home: true, bookmarks: true, tasks: true, notes: true, reminders: true },
  spaceOrder: ['home', 'bookmarks', 'tasks', 'notes', 'reminders'],
  language: 'en',
  dateFormat: 'long',
  textDirection: 'auto',
  firstDayOfWeek: 'monday',
  rememberLastSpace: false,
  swipeNavigation: true,
  reducedMotion: false,
};
