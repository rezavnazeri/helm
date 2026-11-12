(() => {
  const BOOTSTRAP_KEY = 'helm-bootstrap-settings';
  const wallpaperMap = {
    default: '/wallpapers/default.webp'
  };

  const root = document.documentElement;
  root.classList.add('helm-boot');

  const apply = (settings) => {
    if (!settings || typeof settings !== 'object') return;

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

    const wallpaper = settings.wallpaper;
    if (wallpaper && wallpaper !== 'custom' && wallpaperMap[wallpaper]) {
      root.style.setProperty(
        '--wallpaper-url',
        `url("${wallpaperMap[wallpaper]}")`,
      );
    }

    const dimming = Number(settings.wallpaperDimming);
    if (Number.isFinite(dimming)) {
      const alpha = Math.min(100, Math.max(0, dimming)) / 100;
      root.style.setProperty('--wallpaper-dim-alpha', String(alpha));
    }
  };

  const finish = () => {
    requestAnimationFrame(() => {
      root.classList.remove('helm-boot');
    });
  };

  try {
    const cached = localStorage.getItem(BOOTSTRAP_KEY);
    if (cached) apply(JSON.parse(cached));
  } catch {
    // Startup cache is optional; React will load authoritative settings.
  }

  let finished = false;
  const complete = () => {
    if (finished) return;
    finished = true;
    finish();
  };

  // Never leave the root hidden indefinitely if the extension storage API is slow.
  const timeout = setTimeout(complete, 1000);

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      chrome.storage.local.get('settings', (result) => {
        clearTimeout(timeout);
        try {
          if (result?.settings) apply(result.settings);
        } finally {
          complete();
        }
      });
    } catch {
      clearTimeout(timeout);
      complete();
    }
  } else {
    clearTimeout(timeout);
    complete();
  }
})();
