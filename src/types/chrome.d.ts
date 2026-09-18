/// <reference types="chrome"/>

declare namespace chrome {
  export namespace bookmarks {
    export function getTree(callback: (results: BookmarkTreeNode[]) => void): void;
    export function get(id: string, callback: (results: BookmarkTreeNode[]) => void): void;
    export function create(bookmark: CreateDetails, callback?: (result: BookmarkTreeNode) => void): void;
    export function remove(id: string, callback?: () => void): void;
  }
}