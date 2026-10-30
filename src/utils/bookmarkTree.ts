import type { BookmarkNode } from '@/types/bookmarks';
import { remoteFaviconUrl } from '@/services/faviconCache';

export const indexTree = (roots: BookmarkNode[]): Map<string, BookmarkNode> => {
  const index = new Map<string, BookmarkNode>();
  const stack = [...roots];

  while (stack.length > 0) {
    const node = stack.pop() as BookmarkNode;
    index.set(node.id, node);
    if (node.children) stack.push(...node.children);
  }

  return index;
};

export const isFolder = (node: BookmarkNode): boolean =>
  typeof node.url !== 'string';

export const bookmarksOf = (folder: BookmarkNode): BookmarkNode[] =>
  (folder.children ?? []).filter((child) => typeof child.url === 'string');

export const canModifyNode = (node: BookmarkNode): boolean =>
  Boolean(node.parentId) &&
  node.parentId !== '0' &&
  node.unmodifiable !== 'managed';

export const renameNode = (
  nodes: BookmarkNode[],
  id: string,
  title: string,
): BookmarkNode[] => {
  let changed = false;

  const next = nodes.map((node) => {
    if (node.id === id) {
      changed = true;
      return { ...node, title };
    }

    if (node.children) {
      const children = renameNode(node.children, id, title);
      if (children !== node.children) {
        changed = true;
        return { ...node, children };
      }
    }

    return node;
  });

  return changed ? next : nodes;
};

export const removeNode = (nodes: BookmarkNode[], id: string): BookmarkNode[] => {
  let changed = false;
  const next: BookmarkNode[] = [];

  for (const node of nodes) {
    if (node.id === id) {
      changed = true;
      continue;
    }

    if (node.children) {
      const children = removeNode(node.children, id);
      if (children !== node.children) {
        changed = true;
        next.push({ ...node, children });
        continue;
      }
    }

    next.push(node);
  }

  return changed ? next : nodes;
};

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