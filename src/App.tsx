import React, { useState, useCallback, useEffect } from 'react';
import { I18nProvider } from './i18n/I18nProvider';
import { useI18n } from '@/i18n/useI18n';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { useSettings } from './context/useSettings';
import { useSwipe } from './hooks/useSwipe';
import { useWallpaper } from './hooks/useWallpaper';
import { Space } from './types/models';
import { SIDE_NAV_FLEX_DIRECTION } from './constants/settings';

import SideNav from './components/SideNav';
import Header from './components/Header';
import Home from './spaces/Home';
import Bookmarks from './spaces/Bookmarks';
import Sessions from './spaces/Sessions';
import SettingsDialog from './components/settings/SettingsDialog';
import AddBookmarkDialog from './components/bookmarks/AddBookmarkDialog';
import AddSessionDialog from './components/sessions/AddSessionDialog';
import SpaceViewport from './components/SpaceViewport';
import QuickAccess from './components/QuickAccess';
import AddMenu, { type AddMenuOption } from './components/AddMenu';
import { SECTION_ICONS, SECTIONS } from './constants/sections';

import '@fontsource-variable/hanken-grotesk';
import './styles/index.scss';
import Icon from './components/Icon';

const LAST_SPACE_KEY = 'helm-last-space';

const readLastSpace = (): Space | undefined => {
  try {
    const value = localStorage.getItem(LAST_SPACE_KEY) as Space | null;
    return value && SECTIONS.includes(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

const writeLastSpace = (space: Space) => {
  try {
    localStorage.setItem(LAST_SPACE_KEY, space);
  } catch {
    // Remembering the last space is optional.
  }
};

type AddDialogState =
  | { kind: 'bookmark' }
  | { kind: 'session'; sessionId?: string }
  | null;

const MainApp: React.FC = () => {
  const { settings } = useSettings();
  const { t, dir } = useI18n();

  const [activeSpace, setActiveSpace] = useState<Space>(
    () => (settings.rememberLastSpace ? readLastSpace() : undefined) ?? 'home',
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addDialog, setAddDialog] = useState<AddDialogState>(null);
  const addOpen = addDialog !== null;

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const handleOpenAddBookmark = useCallback(() => {
    setAddDialog({ kind: 'bookmark' });
  }, []);

  const handleOpenAddSession = useCallback(() => {
    setAddDialog({ kind: 'session' });
  }, []);

  const handleOpenAddTabs = useCallback((sessionId: string) => {
    setAddDialog({ kind: 'session', sessionId });
  }, []);

  const handleCloseAdd = useCallback(() => {
    setAddDialog(null);
  }, []);

  const settingsButtonSide =
    settings.quickAccessPosition === 'left' ? 'right' : 'left';

  useWallpaper();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', settings.language);
    root.setAttribute('dir', dir);
  }, [settings.language, dir]);

  useEffect(() => {
    const root = document.documentElement;

    if (settings.reducedMotion) {
      root.style.setProperty('--transition-speed', '0s');
    } else {
      root.style.setProperty('--transition-speed', '0.4s');
    }
  }, [settings.reducedMotion]);

  const visibleSections = settings.spaceOrder.filter(
    (space): space is Space =>
      SECTIONS.includes(space as Space) &&
      settings.visibleSpaces[space] !== false,
  );

  const safeActiveSpace = visibleSections.includes(activeSpace)
    ? activeSpace
    : 'home';

  const activeIndex = Math.max(
    0,
    visibleSections.indexOf(safeActiveSpace),
  );

  useEffect(() => {
    if (settings.rememberLastSpace) {
      writeLastSpace(safeActiveSpace);
    }
  }, [settings.rememberLastSpace, safeActiveSpace]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (settingsOpen || addOpen) return;

      const target = e.target;
      if (
        target instanceof Element &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

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
  }, [safeActiveSpace, visibleSections, settingsOpen, addOpen]);

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

  // Show the space that just received something new.
  const showSpace = useCallback(
    (space: Space) => {
      if (visibleSections.includes(space)) setActiveSpace(space);
    },
    [visibleSections],
  );

  const handleFolderAdded = useCallback(() => showSpace('bookmarks'), [showSpace]);
  const handleSessionSaved = useCallback(() => showSpace('sessions'), [showSpace]);

  // Everything the "+" menu can add. Spaces that gain adding contribute an entry here.
  const addOptions: AddMenuOption[] = [
    {
      id: 'bookmark',
      icon: SECTION_ICONS.bookmarks,
      label: t('navigation.newBookmark'),
      onSelect: handleOpenAddBookmark,
    },
    {
      id: 'session',
      icon: SECTION_ICONS.sessions,
      label: t('navigation.newSession'),
      onSelect: handleOpenAddSession,
    },
  ];

  const renderSpace = () => {
    switch (safeActiveSpace) {
      case 'home':
        return <Home />;

      case 'bookmarks':
        return <Bookmarks onAddFolder={handleOpenAddBookmark} />;

      case 'sessions':
        return <Sessions onAddSession={handleOpenAddSession} onAddTabs={handleOpenAddTabs} />;

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
      addOptions={addOptions}
    />
  );

  return (
    <div
      className={`app side-nav-layout-${settings.sideNavPosition}`}
      style={{ flexDirection: appFlexDirection }}
    >
      {settings.sideNavEnabled && sideNav}

      {!settings.sideNavEnabled && (
        <div className={`floating-utilities ${settingsButtonSide}`}>
          <AddMenu position={settingsButtonSide} options={addOptions} floating />

          <button
            type="button"
            className="floating-utility"
            aria-label={t('common.settings')}
            onClick={handleOpenSettings}
          >
            <Icon name="settings" size={20} />
          </button>
        </div>
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
                  <SpaceViewport>
                    {space === safeActiveSpace
                      ? renderSpace()
                      : null}
                  </SpaceViewport>
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

      <AddBookmarkDialog
        isOpen={addDialog?.kind === 'bookmark'}
        onClose={handleCloseAdd}
        onFolderAdded={handleFolderAdded}
      />

      <AddSessionDialog
        isOpen={addDialog?.kind === 'session'}
        sessionId={addDialog?.kind === 'session' ? addDialog.sessionId : undefined}
        onClose={handleCloseAdd}
        onSaved={handleSessionSaved}
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