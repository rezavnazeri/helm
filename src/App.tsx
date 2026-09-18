import React, { useState, useCallback, useEffect } from 'react';
import { I18nProvider } from './i18n/I18nProvider';
import { useI18n } from '@/i18n/useI18n';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { useSettings } from './context/useSettings';
import { useSwipe } from './hooks/useSwipe';
import { useWallpaper } from './hooks/useWallpaper';
import { Space } from './types/models';
import { SECTIONS } from './constants/sections';
import { SIDE_NAV_FLEX_DIRECTION } from './constants/settings';

import SideNav from './components/SideNav';
import Header from './components/Header';
import Home from './spaces/Home';
import Bookmarks from './spaces/Bookmarks';
import SettingsDialog from './components/settings/SettingsDialog';
import QuickAccess from './components/QuickAccess';

import './styles/index.scss';
import Icon from './components/Icon';

const MainApp: React.FC = () => {
  const { settings } = useSettings();
  const { t, dir } = useI18n();

  const [activeSpace, setActiveSpace] = useState<Space>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const settingsButtonSide =
    settings.quickAccessPosition === 'left' ? 'right' : 'left';

  // Apply wallpaper
  useWallpaper();

  // Apply language direction
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', settings.language);
    root.setAttribute('dir', dir);
  }, [settings.language, dir]);

  // Apply reduced motion
  useEffect(() => {
    const root = document.documentElement;

    if (settings.reducedMotion) {
      root.style.setProperty('--transition-speed', '0s');
    } else {
      root.style.setProperty('--transition-speed', '0.4s');
    }
  }, [settings.reducedMotion]);

  // Filter visible spaces
  const visibleSections = settings.spaceOrder.filter(
    (space): space is Space =>
      SECTIONS.includes(space as Space) &&
      settings.visibleSpaces[space] !== false,
  );

  // Keep the currently displayed space valid without synchronizing state
  // inside an effect.
  const safeActiveSpace = visibleSections.includes(activeSpace)
    ? activeSpace
    : 'home';

  const activeIndex = Math.max(
    0,
    visibleSections.indexOf(safeActiveSpace),
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const idx = visibleSections.indexOf(safeActiveSpace);

      if (e.key === 'ArrowRight' && idx < visibleSections.length - 1) {
        setActiveSpace(visibleSections[idx + 1]);
      }

      if (e.key === 'ArrowLeft' && idx > 0) {
        setActiveSpace(visibleSections[idx - 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [safeActiveSpace, visibleSections]);

  // Swipe navigation
  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!settings.swipeNavigation) return;

      const idx = visibleSections.indexOf(safeActiveSpace);

      if (
        direction === 'left' &&
        idx < visibleSections.length - 1
      ) {
        setActiveSpace(visibleSections[idx + 1]);
      }

      if (direction === 'right' && idx > 0) {
        setActiveSpace(visibleSections[idx - 1]);
      }
    },
    [
      safeActiveSpace,
      settings.swipeNavigation,
      visibleSections,
    ],
  );

  useSwipe(handleSwipe);

  const handleSpaceChange = useCallback((space: Space) => {
    setActiveSpace(space);
  }, []);

  const renderSpace = () => {
    switch (safeActiveSpace) {
      case 'home':
        return <Home />;

      case 'bookmarks':
        return <Bookmarks />;

      default:
        return (
          <div className="placeholder-space">
            {t(`common.${safeActiveSpace}`)}
          </div>
        );
    }
  };

  const appFlexDirection =
    SIDE_NAV_FLEX_DIRECTION[settings.sideNavPosition];

  const quickAccessPosition = settings.quickAccessPosition;

  const quickAccessFlexDirection =
    quickAccessPosition === 'below-header'
      ? 'column'
      : SIDE_NAV_FLEX_DIRECTION[quickAccessPosition];

  const sideNav = (
    <SideNav
      activeSpace={safeActiveSpace}
      onSpaceChange={handleSpaceChange}
      onOpenSettings={handleOpenSettings}
    />
  );

  return (
    <div
      className={`app side-nav-layout-${settings.sideNavPosition}`}
      style={{ flexDirection: appFlexDirection }}
    >
      {settings.sideNavEnabled && sideNav}

      {!settings.sideNavEnabled && (
        <button
          type="button"
          className={`settings-button ${settingsButtonSide}`}
          aria-label={t('common.settings')}
          onClick={handleOpenSettings}
        >
          <Icon name="settings" size={20} />
        </button>
      )}

      <div
        className={`app-main-shell app-main-shell--${quickAccessPosition}`}
        style={{ flexDirection: quickAccessFlexDirection }}
      >
        {settings.quickAccessEnabled &&
          quickAccessPosition !== 'below-header' && (
            <QuickAccess position={quickAccessPosition} />
          )}

        <div className="app-main">
          <Header />

          {settings.quickAccessEnabled &&
            quickAccessPosition === 'below-header' && (
              <QuickAccess position="below-header" />
            )}

          <div className="app-content-track">
            <div
              className="app-content-slider"
              style={{
                transform: `translateX(-${activeIndex * 100}%)`,
              }}
            >
              {visibleSections.map((space) => (
                <div
                  key={space}
                  className="app-content-space"
                >
                  {space === safeActiveSpace
                    ? renderSpace()
                    : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => (
  <SettingsProvider>
    <I18nProvider>
      <MainApp />
    </I18nProvider>
  </SettingsProvider>
);

export default App;