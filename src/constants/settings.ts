import { SettingsGroup } from '@/types/models';
import { IconName } from '@/components/Icon';
import { SideNavPosition } from '@/types/settings';


export const SETTINGS_GROUPS: SettingsGroup[] = [
  'general',
  'appearance',
  'weather',
  'spaces',
  'language',
  'behavior',
  'data',
  'about',
];

export const SETTINGS_GROUP_ICONS: Record<SettingsGroup, IconName> = {
  general: 'adjustments',
  appearance: 'palette',
  weather: 'cloud',
  spaces: 'layout',
  language: 'globe',
  behavior: 'settings',
  data: 'data',
  about: 'info',
};

export const SIDE_NAV_FLEX_DIRECTION: Record<
  SideNavPosition,
  React.CSSProperties['flexDirection']
> = {
  left: 'row',
  top: 'column',
  right: 'row-reverse',
  bottom: 'column-reverse',
};