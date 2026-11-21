import React, { lazy, Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { I18nProvider } from './i18n/I18nProvider';
import { useI18n } from '@/i18n/useI18n';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { useSettings } from './context/useSettings';
import { useSpaceDrag } from './hooks/useSpaceDrag';
import { useWallpaper } from './hooks/useWallpaper';
import { Space } from './types/models';
import { SIDE_NAV_FLEX_DIRECTION } from './constants/settings';

import SideNav from './components/SideNav';
import Header from './components/Header';
import Home from './spaces/Home';
import Bookmarks from './spaces/Bookmarks';
import Sessions from './spaces/Sessions';
import Notes from './spaces/Notes';
import { createNote } from './services/noteSpace';
import SpaceViewport from './components/SpaceViewport';
import QuickAccess from './components/QuickAccess';
import AddMenu, { type AddMenuOption } from './components/AddMenu';
import { SECTION_ICONS, SECTIONS } from './constants/sections';

import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/vazirmatn';
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

// Dialogs are separate chunks: they are rarely opened, so the new tab does not parse their code.
const loadSettingsDialog = () => import('./components/settings/SettingsDialog');
const loadAddBookmarkDialog = () => import('./components/bookmarks/AddBookmarkDialog');
const loadAddSessionDialog = () => import('./components/sessions/AddSessionDialog');

const SettingsDialog = lazy(loadSettingsDialog);
const AddBookmarkDialog = lazy(loadAddBookmarkDialog);
const AddSessionDialog = lazy(loadAddSessionDialog);

const MainApp: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { t, dir } = useI18n();

  const [activeSpace, setActiveSpace] = useState<Space>(
    () => (settings.rememberLastSpace ? readLastSpace() : undefined) ?? 'home',
  );
  const [leavingSpace, setLeavingSpace] = useState<Space | null>(null);
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

  // Fetch the dialog chunks once the page is idle, so opening one is still instant.
  useEffect(() => {
    const warm = () => {
      void loadSettingsDialog();
      void loadAddBookmarkDialog();
      void loadAddSessionDialog();
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(warm, 1500);
    return () => window.clearTimeout(timer);
  }, []);

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

  // Empty-area dragging and horizontal touchpad gestures move the space track.
    const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [peeking, setPeeking] = useState(false);

  useSpaceDrag({
    trackRef,
    sliderRef,
    index: activeIndex,
    count: visibleSections.length,
    enabled: settings.swipeNavigation && !settingsOpen && !addOpen,
    onStart: () => setPeeking(true),
    onSettle: () => setPeeking(false),
    onChange: (delta) =>
      flushSync(() => setActiveSpace(visibleSections[activeIndex + delta])),
  });

  const handleSpaceChange = useCallback((space: Space) => {
    setActiveSpace(space);
  }, []);

  const showSpace = useCallback(
    (space: Space) => {
      if (settings.visibleSpaces[space] === false) {
        void updateSettings({
          visibleSpaces: { ...settings.visibleSpaces, [space]: true },
        });
      }

      setActiveSpace(space);
    },
    [settings.visibleSpaces, updateSettings],
  );

  const handleNewNote = useCallback(() => {
    const nameFor = (number: number) =>
      number === 0 ? t('notes.defaultName') : t('notes.defaultNumberedName', { number });

    void createNote(nameFor).then((id) => {
      if (id) showSpace('notes');
    });
  }, [showSpace, t]);

  const handleFolderAdded = useCallback(() => showSpace('bookmarks'), [showSpace]);
  const handleSessionSaved = useCallback(() => showSpace('sessions'), [showSpace]);

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
    {
      id: 'note',
      icon: SECTION_ICONS.notes,
      label: t('navigation.newNote'),
      onSelect: handleNewNote,
    },
  ];

  const renderSpace = (space: Space) => {
    switch (space) {
      case 'home':      return <Home />;
      case 'bookmarks': return <Bookmarks onAddFolder={handleOpenAddBookmark} />;
      case 'sessions':  return <Sessions onAddSession={handleOpenAddSession} onAddTabs={handleOpenAddTabs} />;
      case 'notes':     return <Notes onAddNote={handleNewNote} />;
      default:
        return <div className="placeholder-space">{t(`common.${space}`)}</div>;
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

  const previousSpaceRef = useRef<Space>(safeActiveSpace);

  useEffect(() => {
    const previous = previousSpaceRef.current;
    previousSpaceRef.current = safeActiveSpace;

    if (previous === safeActiveSpace) return;
    if (settings.reducedMotion) return;

    setLeavingSpace(previous);
  }, [safeActiveSpace, settings.reducedMotion]);

  useEffect(() => {
    if (!leavingSpace) return;
    const timer = window.setTimeout(() => setLeavingSpace(null), 400);
    return () => window.clearTimeout(timer);
  }, [leavingSpace]);

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

          <div ref={trackRef} className="app-content-track">
            <div
              ref={sliderRef}
              className="app-content-slider"
              style={{
                transform: `translateX(calc(-${activeIndex * 100}% + var(--drag-offset, 0px)))`,
              }}
            >
              {visibleSections.map((space, spaceIndex) => (
                <div key={space} className="app-content-space">
                  <SpaceViewport>
                    {space === safeActiveSpace ||
                    space === leavingSpace ||
                    (peeking && Math.abs(spaceIndex - activeIndex) === 1)
                      ? renderSpace(space)
                      : null}
                  </SpaceViewport>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {settingsOpen && (
          <SettingsDialog isOpen onClose={() => setSettingsOpen(false)} />
        )}

        {addDialog?.kind === 'bookmark' && (
          <AddBookmarkDialog
            isOpen
            onClose={handleCloseAdd}
            onFolderAdded={handleFolderAdded}
          />
        )}

        {addDialog?.kind === 'session' && (
          <AddSessionDialog
            isOpen
            sessionId={addDialog.sessionId}
            onClose={handleCloseAdd}
            onSaved={handleSessionSaved}
          />
        )}
      </Suspense>
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