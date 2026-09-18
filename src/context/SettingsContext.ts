import { createContext } from 'react';
import type { Settings } from '@/types/settings';

export interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
}

export const SettingsContext =
  createContext<SettingsContextType | undefined>(undefined);