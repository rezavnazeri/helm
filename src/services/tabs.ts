import { isOpenableUrl } from '@/services/browser';

export const NO_GROUP = -1;

export interface OpenTab {
  id: number;
  title: string;
  url: string;
  /** Id of the tab group, or NO_GROUP. */
  groupId: number;
}

export interface OpenGroup {
  id: number;
  title: string;
  color: string;
}

export interface WindowTabs {
  tabs: OpenTab[];
  groups: OpenGroup[];
}

export const TabsService = {
  isAvailable: (): boolean =>
    typeof chrome !== 'undefined' && Boolean(chrome.tabs?.query),

  /** Open tabs (and tab groups) of the window Helm is in, in tab order. */
  getWindowTabs: async (): Promise<WindowTabs> => {
    const [rawTabs, rawGroups] = await Promise.all([
      chrome.tabs.query({ currentWindow: true }),
      chrome.tabGroups
        ? chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT })
        : Promise.resolve([]),
    ]);

    // Helm's own tabs are not worth saving.
    const own = chrome.runtime.getURL('/');
    const tabs: OpenTab[] = [];

    for (const tab of [...rawTabs].sort((a, b) => a.index - b.index)) {
      const url = tab.url || tab.pendingUrl || '';
      if (tab.id === undefined || !isOpenableUrl(url) || url.startsWith(own)) continue;

      tabs.push({
        id: tab.id,
        title: tab.title?.trim() || url,
        url,
        groupId: tab.groupId ?? NO_GROUP,
      });
    }

    const groups = rawGroups.map((group) => ({
      id: group.id,
      title: group.title?.trim() ?? '',
      color: group.color,
    }));

    return { tabs, groups };
  },
};
