/// <reference types="vite/client" />

interface Window {
    __helm?: {
    customWallpaper?: Promise<{ url: string; theme?: 'light' | 'dark'; revision: number } | null>;
  };
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}