import { remoteFaviconUrl } from '@/services/faviconCache';

export const shortAddress = (url: string): string => {
  try {
    const parsed = new URL(url);

    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.hostname.replace(/^www\./i, '') || url;
    }

    if (parsed.protocol === 'file:') {
      const name = decodeURIComponent(parsed.pathname).split('/').filter(Boolean).pop();
      return name ?? url;
    }

    if (!parsed.host) return url;

    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/$/, '');
  } catch {
    return url;
  }
};

export const bookmarkFaviconUrl = (pageUrl: string, size = 32): string => {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    const url = new URL(chrome.runtime.getURL('/_favicon/'));
    url.searchParams.set('pageUrl', pageUrl);
    url.searchParams.set('size', String(size));
    return url.toString();
  }

  return remoteFaviconUrl(pageUrl);
};