import React from 'react';

export type IconName =
  | 'helm'
  | 'home'
  | 'bookmark'
  | 'folder'
  | 'tasks'
  | 'notes'
  | 'reminders'
  | 'palette'
  | 'cloud-sun'
  | 'layout'
  | 'globe'
  | 'settings'
  | 'data'
  | 'info'
  | 'close'
  | 'log-out'
  | 'sun'
  | 'moon'
  | 'edit'
  | 'user'
  | 'check'
  | 'upload'
  | 'weather'
  | 'adjustments'
  | 'search'
  | 'plus'
  | 'delete'
  | 'more-menu'
  | 'chevron-down'
  | 'chevron-up'
  | 'external-link'
  | 'download'
  | 'alert'
  | 'drag'
  | 'cloud';

interface IconProps {
  name: IconName;
  variant?: 'line' | 'solid';
  size?: number;
  color?: string;
  className?: string;
}

const ICON_PATHS: Record<string, { line: string; solid?: string }> = {
  helm: { line: '/icons/helm.svg' },
  home: { line: '/icons/home-line.svg', solid: '/icons/home-solid.svg' },
  bookmark: { line: '/icons/bookmark-line.svg', solid: '/icons/bookmark-solid.svg' },
  folder: { line: '/icons/folder-line.svg', solid: '/icons/folder-line.svg' },
  tasks: { line: '/icons/list-box-line.svg', solid: '/icons/list-box-solid.svg' },
  notes: { line: '/icons/noteblock-text-line.svg', solid: '/icons/noteblock-text-solid.svg' },
  reminders: { line: '/icons/bell-line.svg', solid: '/icons/bell-solid.svg' },
  settings: { line: '/icons/settings-cog-line.svg', solid: '/icons/settings-cog-line.svg' },
  sun: { line: '/icons/sun-outline.svg', solid: '/icons/sun-outline.svg' },
  moon: { line: '/icons/moon-line.svg', solid: '/icons/moon-line.svg' },
  edit: { line: '/icons/edit-pen-2-line.svg', solid: '/icons/edit-pen-2-solid.svg' },

  adjustments: { line: '/icons/adjustments-horizontal.svg' },
  palette: { line: '/icons/palette-outline.svg' },
  weather: {line: '/icons/cloud-sun-line.svg' },
  globe: { line: '/icons/globe-grid-line.svg' },
  layout: { line: '/icons/layout-line.svg', solid: '/icons/layout-line.svg' },
  data: { line: '/icons/data-line.svg' },
  user: { line: '/icons/user-line.svg' },
  info: { line: '/icons/info-circle-line.svg' },
  'log-out': { line: '/icons/logout-line.svg', solid: '/icons/logout-line.svg' },
  'more-menu': { line: '/icons/more-menu-line.svg', solid: '/icons/more-menu-line.svg' },
  'chevron-down': { line: '/icons/chevron-down-line.svg', solid: '/icons/chevron-down-line.svg' },
  'chevron-up': { line: '/icons/chevron-up-line.svg', solid: '/icons/chevron-up-line.svg' },
  plus: { line: '/icons/plus-line.svg', solid: '/icons/plus-line.svg' },
  close: { line: '/icons/close-line.svg', solid: '/icons/close-line.svg' },
  check: { line: '/icons/check-line.svg', solid: '/icons/check-line.svg' },
  drag: { line: '/icons/drag-line.svg', solid: '/icons/drag-line.svg' },
  search: { line: '/icons/search-line.svg', solid: '/icons/search-line.svg' },
  download: { line: '/icons/download-line.svg', solid: '/icons/download-line.svg' },
  upload: { line: '/icons/upload-line.svg', solid: '/icons/upload-line.svg' },
  alert: { line: '/icons/alert-line.svg', solid: '/icons/alert-line.svg' },
  'external-link': { line: '/icons/external-link-line.svg', solid: '/icons/external-link-line.svg' },
  delete: {line: '/icons/delete-bin-line.svg'},
  cloud: {line: '/icons/cloud-line.svg'}
};

const Icon: React.FC<IconProps> = ({ name, variant = 'line', size = 20, color = 'currentColor', className = '' }) => {
  const icon = ICON_PATHS[name];
  if (!icon) return null;
  const iconPath = icon[variant] ?? icon.line;
  const iconColor = color === 'currentColor' ? 'var(--icon-color, currentColor)' : color;
  return (
    <span
      className={`icon-wrapper ${className}`}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        background: iconColor,
        WebkitMaskImage: `url(${iconPath})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskImage: `url(${iconPath})`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
        flexShrink: 0,
      }}
    />
  );
};

export default Icon;
