// Runs before the app bundle: puts the saved theme and wallpaper on <html> so the
// first painted frame already looks right. Everything here is synchronous except
// the custom-wallpaper read, which runs while the bundle is still downloading.
(() => {
  const BOOTSTRAP_KEY = 'helm-bootstrap-settings';
  const DEFAULT_WALLPAPER = '/wallpapers/default.webp';
  const root = document.documentElement;

  let settings = null;
  try {
    settings = JSON.parse(localStorage.getItem(BOOTSTRAP_KEY));
  } catch {
    // Startup cache is optional; React loads the authoritative settings.
  }
  if (!settings || typeof settings !== 'object') return;

  const setWallpaper = (url) => {
    root.style.setProperty('--wallpaper-url', `url("${url.replace(/"/g, '\\"')}")`);
  };

  const theme =
    settings.theme === 'light' || settings.theme === 'dark'
      ? settings.theme
      : settings.resolvedTheme === 'light' || settings.resolvedTheme === 'dark'
        ? settings.resolvedTheme
        : null;

  if (theme) {
    root.dataset.theme = theme;
    root.style.backgroundColor = theme === 'light' ? '#f0f4f8' : '#0a0e12';
  }

  const dimming = Number(settings.wallpaperDimming);
  if (Number.isFinite(dimming)) {
    root.style.setProperty('--wallpaper-dim-alpha', String(Math.min(100, Math.max(0, dimming)) / 100));
  }

  if (settings.wallpaper === 'custom') {
    // Same database as src/services/customWallpaper.ts. The app picks this result
    // up (window.__helm) instead of reading the image a second time.
    window.__helm = {
      customWallpaper: new Promise((resolve) => {
        try {
          const open = indexedDB.open('helm-wallpaper-db', 1);
          open.onupgradeneeded = () => open.result.createObjectStore('wallpapers', { keyPath: 'id' });
          open.onerror = () => resolve(null);
          open.onsuccess = () => {
            const get = open.result.transaction('wallpapers').objectStore('wallpapers').get('customWallpaper');
            get.onerror = () => resolve(null);
            get.onsuccess = () => {
              const record = get.result;
              if (!record || !record.blob) return resolve(null);
              const url = URL.createObjectURL(record.blob);
              setWallpaper(url);
              resolve({ url, theme: record.DetectedTheme, revision: settings.wallpaperRevision });
            };
          };
        } catch {
          resolve(null);
        }
      }),
    };
  } else {
    // The app saves the resolved URL of any built-in wallpaper; old caches only knew "default".
    setWallpaper(settings.wallpaperUrl || DEFAULT_WALLPAPER);
  }
})();
