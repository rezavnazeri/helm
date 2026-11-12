/**
 * Helpers for opening links from the new tab page. Falls back to window.open
 * when running outside of the extension (e.g. in the Vite dev server).
 */

const hasTabsApi = (): boolean =>
  typeof chrome !== 'undefined' && Boolean(chrome.tabs?.create);

/** Bookmarklets and empty URLs cannot be opened in a tab. */
export const isOpenableUrl = (url: string | undefined): url is string =>
  typeof url === 'string' && url.trim() !== '' && !/^javascript:/i.test(url.trim());

const openableUrls = (urls: Array<string | undefined>): string[] =>
  urls.filter(isOpenableUrl);

export type OpenDisposition = 'current' | 'tab' | 'background-tab' | 'window';

export const BrowserService = {
  /** Opens one link the way the user asked for. */
  open: (url: string, disposition: OpenDisposition): Promise<void> => {
    if (disposition === 'tab') return BrowserService.openInNewTab(url, true);
    if (disposition === 'background-tab') return BrowserService.openInNewTab(url, false);
    if (disposition === 'window') return BrowserService.openInNewWindow([url]);
    return BrowserService.openInCurrentTab(url);
  },

  /** Replaces the current (Helm) tab. */
  openInCurrentTab: async (url: string): Promise<void> => {
    if (!isOpenableUrl(url)) return;

    if (!hasTabsApi()) {
      window.open(url, '_self');
      return;
    }

    const current = await chrome.tabs.getCurrent();
    if (current?.id !== undefined) {
      await chrome.tabs.update(current.id, { url });
    } else {
      await chrome.tabs.update({ url });
    }
  },

  openInNewTab: async (url: string, active = true): Promise<void> => {
    if (!isOpenableUrl(url)) return;

    if (!hasTabsApi()) {
      window.open(url, '_blank');
      return;
    }

    const current = await chrome.tabs.getCurrent();
    await chrome.tabs.create({
      url,
      active,
      index: current ? current.index + 1 : undefined,
      windowId: current?.windowId,
    });
  },

  openInNewWindow: async (urls: Array<string | undefined>): Promise<void> => {
    const list = openableUrls(urls);
    if (list.length === 0) return;

    if (!hasTabsApi()) {
      window.open(list[0], '_blank');
      return;
    }

    await chrome.windows.create({ url: list, focused: true });
  },

  /**
   * Opens every URL as a new tab right next to the current one. The first
   * tab is activated.
   */
  openAllInNewTabs: async (urls: Array<string | undefined>): Promise<void> => {
    const list = openableUrls(urls);
    if (list.length === 0) return;

    if (!hasTabsApi()) {
      list.forEach((url) => window.open(url, '_blank'));
      return;
    }

    const current = await chrome.tabs.getCurrent();
    const baseIndex = current ? current.index + 1 : undefined;

    for (const [offset, url] of list.entries()) {
      await chrome.tabs.create({
        url,
        active: offset === 0,
        index: baseIndex === undefined ? undefined : baseIndex + offset,
        windowId: current?.windowId,
      });
    }
  },

  /**
   * "Open all": the first URL replaces the current tab, the rest open in new
   * tabs next to it. The extra tabs are created first because navigating the
   * current tab unloads this page.
   */
  openAll: async (urls: Array<string | undefined>): Promise<void> => {
    const list = openableUrls(urls);
    if (list.length === 0) return;

    if (!hasTabsApi()) {
      window.open(list[0], '_self');
      list.slice(1).forEach((url) => window.open(url, '_blank'));
      return;
    }

    const [first, ...rest] = list;
    const current = await chrome.tabs.getCurrent();
    const baseIndex = current ? current.index + 1 : undefined;

    for (const [offset, url] of rest.entries()) {
      await chrome.tabs.create({
        url,
        active: false,
        index: baseIndex === undefined ? undefined : baseIndex + offset,
        windowId: current?.windowId,
      });
    }

    if (current?.id !== undefined) {
      await chrome.tabs.update(current.id, { url: first });
    } else {
      await chrome.tabs.update({ url: first });
    }
  },

  /**
   * Opens every URL as new tabs next to the current one and puts them in one
   * tab group named `title`. The first tab is activated.
   */
  openAsGroup: async (urls: Array<string | undefined>, title: string): Promise<void> => {
    const list = openableUrls(urls);
    if (list.length === 0) return;

    if (!hasTabsApi() || !chrome.tabGroups) {
      await BrowserService.openAllInNewTabs(list);
      return;
    }

    const current = await chrome.tabs.getCurrent();
    const baseIndex = current ? current.index + 1 : undefined;
    const tabIds: number[] = [];

    for (const [offset, url] of list.entries()) {
      const tab = await chrome.tabs.create({
        url,
        active: false,
        index: baseIndex === undefined ? undefined : baseIndex + offset,
        windowId: current?.windowId,
      });
      if (tab.id !== undefined) tabIds.push(tab.id);
    }

    if (tabIds.length === 0) return;

    const groupId = await chrome.tabs.group({
      tabIds: tabIds as [number, ...number[]],
      createProperties: current ? { windowId: current.windowId } : undefined,
    });
    await chrome.tabGroups.update(groupId, { title: title.trim() });
    await chrome.tabs.update(tabIds[0], { active: true });
  },
};
