import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { QuickAccessPosition } from '@/types/settings';
import { useSettings } from '@/context/useSettings';
import Icon from '@/components/Icon';
import { QuickAccessService } from '@/services/quickAccess';
import { useCachedFavicons } from '@/hooks/useCachedFavicons';
import { MAX_QUICK_ACCESS_SHORTCUTS, QuickAccessShortcut } from '@/types/quickAccess';

interface QuickAccessProps {
  position?: QuickAccessPosition;
}

interface ShortcutDialogProps {
  shortcut?: QuickAccessShortcut;
  onClose: () => void;
  onSaved: () => void;
}

interface ContextMenuState {
  id: string;
  x: number;
  y: number;
}

interface ContextMenuPosition {
  left: number;
  top: number;
  visibility: 'hidden' | 'visible';
}

const CONTEXT_MENU_MARGIN = 8;

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return Boolean(url.hostname) && (url.protocol === 'http:' || url.protocol === 'https:');
  } catch {
    return false;
  }
};

interface ShortcutFaviconProps {
  src?: string;
  fallbackSrc: string;
  failed: boolean;
}

const ShortcutFavicon: React.FC<ShortcutFaviconProps> = ({ src, fallbackSrc, failed }) => {
  const [broken, setBroken] = useState(false);
  const imageSrc = src ?? (failed ? fallbackSrc : undefined);

  if (broken) return <Icon name="globe" size={18} />;
  if (!imageSrc) return null;

  return (
    <img
      src={imageSrc}
      alt=""
      draggable={false}
      onError={() => setBroken(true)}
    />
  );
};

const ShortcutDialog: React.FC<ShortcutDialogProps> = ({ shortcut, onClose, onSaved }) => {
  const { t } = useI18n();
  const [name, setName] = useState(shortcut?.name ?? '');
  const [url, setUrl] = useState(shortcut?.url ?? '');
  const [error, setError] = useState('');

  const save = async () => {
    const cleanName = name.trim();
    const cleanUrl = normalizeUrl(url);

    if (!cleanUrl || !isValidUrl(cleanUrl)) {
      setError(t('quickAccess.invalid'));
      return;
    }

    try {
      if (shortcut) {
        await QuickAccessService.update(shortcut.id, cleanName, cleanUrl);
      } else {
        await QuickAccessService.add(cleanName, cleanUrl);
      }
      onSaved();
      onClose();
    } catch {
      setError(t('quickAccess.limit'));
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="quick-access-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>{shortcut ? t('quickAccess.editTitle') : t('quickAccess.addTitle')}</h2>
        <label className="quick-access-field">
          <span>{t('quickAccess.url')}</span>
          <input
            autoFocus
            className="text-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com"
          />
        </label>
        <label className="quick-access-field">
          <span>{t('quickAccess.name')}</span>
          <input
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('quickAccess.nameHint')}
          />
        </label>
        {error && <p className="quick-access-error">{error}</p>}
        <div className="quick-access-dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="primary-button" onClick={() => void save()}>{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
};

const QuickAccess: React.FC<QuickAccessProps> = ({ position }) => {
  const { settings } = useSettings();
  const { t } = useI18n();
  const [shortcuts, setShortcuts] = useState<QuickAccessShortcut[]>([]);
  const [shortcutsLoaded, setShortcutsLoaded] = useState(false);
  const [dialogShortcut, setDialogShortcut] = useState<QuickAccessShortcut | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [menuPosition, setMenuPosition] = useState<ContextMenuPosition>({
    left: 0,
    top: 0,
    visibility: 'hidden',
  });
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const suppressClickRef = useRef(false);
  const actualPosition = position ?? settings.quickAccessPosition;

  const favicons = useCachedFavicons(shortcuts, shortcutsLoaded);

  const load = async () => {
    setShortcuts(await QuickAccessService.getAll());
    setShortcutsLoaded(true);
  };

  useEffect(() => {
    let cancelled = false;

    const loadShortcuts = async () => {
      try {
        const shortcuts = await QuickAccessService.getAll();

        if (!cancelled) {
          setShortcuts(shortcuts);
          setShortcutsLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load Quick Access:', error);
      }
    };

    void loadShortcuts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, []);

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - CONTEXT_MENU_MARGIN;
    const maxTop = window.innerHeight - rect.height - CONTEXT_MENU_MARGIN;

    setMenuPosition({
      left: Math.max(CONTEXT_MENU_MARGIN, Math.min(menu.x, maxLeft)),
      top: Math.max(CONTEXT_MENU_MARGIN, Math.min(menu.y, maxTop)),
      visibility: 'visible',
    });
  }, [menu]);

  if (!settings.quickAccessEnabled) return null;

  const openShortcut = (url: string) => {
    window.open(url, '_self');
  };

  const editShortcut = () => {
    const shortcut = shortcuts.find((item) => item.id === menu?.id);
    setMenu(null);
    if (shortcut) {
      setDialogShortcut(shortcut);
      setDialogOpen(true);
    }
  };

  const removeShortcut = async () => {
    const id = menu?.id;
    setMenu(null);
    if (!id) return;
    await QuickAccessService.remove(id);
    await load();
  };

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>, id: string) => {
    suppressClickRef.current = true;
    setDraggedId(id);
    setDragOverId(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>, id: string) => {
    if (!draggedId || draggedId === id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) setDragOverId(id);
  };

  const handleDrop = async (event: React.DragEvent<HTMLButtonElement>, targetId: string) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain') || draggedId;

    setDraggedId(null);
    setDragOverId(null);

    if (!sourceId || sourceId === targetId) return;

    const reordered = await QuickAccessService.reorder(sourceId, targetId);
    setShortcuts(reordered);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  return (
    <>
      <div className={`quick-access quick-access--${actualPosition}`}>
        <div className="quick-access-items">
          {shortcuts.map((shortcut) => {
            const icon = favicons.resolve(shortcut);

            return (
              <button
                key={shortcut.id}
                type="button"
                className={`quick-access-button${draggedId === shortcut.id ? ' is-dragging' : ''}${dragOverId === shortcut.id ? ' is-drag-over' : ''}`}
                aria-label={shortcut.name}
                data-tooltip={shortcut.name}
                draggable
                onClick={() => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  openShortcut(shortcut.url);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({ id: shortcut.id, x: e.clientX, y: e.clientY });
                }}
                onDragStart={(e) => handleDragStart(e, shortcut.id)}
                onDragOver={(e) => handleDragOver(e, shortcut.id)}
                onDrop={(e) => void handleDrop(e, shortcut.id)}
                onDragEnd={handleDragEnd}
                onDragLeave={() => {
                  if (dragOverId === shortcut.id) setDragOverId(null);
                }}
              >
                {favicons.ready && (
                  <ShortcutFavicon
                    key={icon.src ?? 'remote'}
                    src={icon.src}
                    fallbackSrc={shortcut.favicon}
                    failed={icon.failed}
                  />
                )}
              </button>
            );
          })}

          {shortcuts.length < MAX_QUICK_ACCESS_SHORTCUTS && (
            <button
              type="button"
              className="quick-access-button quick-access-add"
              aria-label={t('quickAccess.add')}
              data-tooltip={t('quickAccess.add')}
              onClick={() => {
                setDialogShortcut(null);
                setDialogOpen(true);
              }}
            >
              <Icon name="plus" size={20} />
            </button>
          )}
        </div>
      </div>

      {menu && (
        <div
          ref={menuRef}
          className="quick-access-context-menu"
          style={{
            left: menuPosition.left,
            top: menuPosition.top,
            visibility: menuPosition.visibility,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={editShortcut}>
            <Icon name="edit" size={16} className="context-icon" />
            {t('quickAccess.edit')}
          </button>
          <button type="button" onClick={() => void removeShortcut()}>
            <Icon name="delete" size={16} className="context-icon" />
            {t('common.remove')}
          </button>
        </div>
      )}

      {dialogOpen && (
        <ShortcutDialog
          shortcut={dialogShortcut ?? undefined}
          onClose={() => setDialogOpen(false)}
          onSaved={() => void load()}
        />
      )}
    </>
  );
};

export default QuickAccess;