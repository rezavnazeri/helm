import type { ContextMenuItem } from '@/components/ContextMenu';
import { BrowserService, isOpenableUrl, type OpenDisposition } from '@/services/browser';

type Translate = (key: string) => string;

export const openAllItems = (
  t: Translate,
  urls: Array<string | undefined>,
  groupTitle: string,
): ContextMenuItem[] => {
  const disabled = !urls.some(isOpenableUrl);

  return [
    {
      id: 'open-all',
      label: t('cards.openAll'),
      icon: 'open',
      disabled,
      onSelect: () => void BrowserService.openAll(urls),
    },
    {
      id: 'open-all-tabs',
      label: t('cards.openAllNewTabs'),
      disabled,
      onSelect: () => void BrowserService.openAllInNewTabs(urls),
    },
    {
      id: 'open-all-window',
      label: t('cards.openAllNewWindow'),
      disabled,
      onSelect: () => void BrowserService.openInNewWindow(urls),
    },
    {
      id: 'open-group',
      label: t('cards.openAsGroup'),
      disabled,
      onSelect: () => void BrowserService.openAsGroup(urls, groupTitle),
    },
  ];
};

export const openLinkItems = (t: Translate, url: string): ContextMenuItem[] => {
  const open = (disposition: OpenDisposition) => () => void BrowserService.open(url, disposition);

  return [
    { id: 'open', label: t('cards.open'), icon: 'open', onSelect: open('current') },
    { id: 'open-tab', label: t('cards.openNewTab'), onSelect: open('tab') },
    { id: 'open-window', label: t('cards.openNewWindow'), onSelect: open('window') },
  ];
};

export const renameItem = (
  t: Translate,
  enabled: boolean,
  onSelect: () => void,
): ContextMenuItem => ({
  id: 'rename',
  label: t('cards.rename'),
  icon: 'edit',
  separatorBefore: true,
  disabled: !enabled,
  onSelect,
});
