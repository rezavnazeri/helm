import React from 'react';
import Card from '@/components/cards/Card';
import CardGrid from '@/components/cards/CardGrid';
import { openAllItems, openLinkItems, renameItem } from '@/components/cards/menuItems';
import type { MenuRequest } from '@/components/cards/types';
import ContextMenu, { type ContextMenuItem } from '@/components/ContextMenu';
import SessionRow from '@/components/sessions/SessionRow';
import Icon from '@/components/Icon';
import { useCardStore } from '@/hooks/useCardStore';
import { useCardUi } from '@/hooks/useCardUi';
import { useI18n } from '@/i18n/useI18n';
import { BrowserService } from '@/services/browser';
import { SessionStore } from '@/services/sessionSpace';
import { lastOccupiedIndex } from '@/utils/cardGrid';

interface SessionsProps {
  /** Opens the dialog that saves the open tabs as a new session. */
  onAddSession: () => void;
  /** Opens the same dialog to add tabs to an existing session. */
  onAddTabs: (sessionId: string) => void;
}

const Sessions: React.FC<SessionsProps> = ({ onAddSession, onAddTabs }) => {
  const { t } = useI18n();
  const { loaded, cells } = useCardStore(SessionStore);
  const { menu, openMenu, closeMenu, renamingId, setRenamingId, cancelRename } = useCardUi();

  const sessionById = (id: string) => cells.find((cell) => cell?.id === id) ?? null;
  const sessionOfTab = (tabId: string) =>
    cells.find((cell) => cell?.tabs.some((tab) => tab.id === tabId)) ?? null;

  const commitRename = (id: string, title: string) => {
    const session = sessionById(id);
    const owner = session ?? sessionOfTab(id);

    if (owner) {
      void SessionStore.patch(owner.id, (card) =>
        session
          ? { ...card, name: title }
          : { ...card, tabs: card.tabs.map((tab) => (tab.id === id ? { ...tab, title } : tab)) },
      );
    }

    cancelRename(id);
  };

  const menuItems = (request: MenuRequest): ContextMenuItem[] | null => {
    if (request.kind === 'card') {
      const session = sessionById(request.id);
      if (!session) return null;

      return [
        ...openAllItems(t, session.tabs.map((tab) => tab.url), session.name),
        renameItem(t, true, () => setRenamingId(session.id)),
        {
          id: 'delete',
          label: t('sessions.delete'),
          icon: 'delete',
          danger: true,
          onSelect: () => void SessionStore.remove(session.id),
        },
      ];
    }

    const owner = sessionOfTab(request.id);
    const tab = owner?.tabs.find((item) => item.id === request.id);
    if (!owner || !tab) return null;

    return [
      ...openLinkItems(t, tab.url),
      renameItem(t, true, () => setRenamingId(tab.id)),
      {
        id: 'delete',
        label: t('cards.delete'),
        icon: 'delete',
        danger: true,
        onSelect: () =>
          void SessionStore.patch(owner.id, (card) => ({
            ...card,
            tabs: card.tabs.filter((item) => item.id !== tab.id),
          })),
      },
    ];
  };

  const items = menu ? menuItems(menu) : null;

  const notice =
    loaded && lastOccupiedIndex(cells) < 0 ? (
      <div className="card-empty">
        <p>{t('sessions.emptyTitle')}</p>
        <span>{t('sessions.emptyHint')}</span>
        <button type="button" className="primary-button" onClick={onAddSession}>
          {t('sessions.addSession')}
        </button>
      </div>
    ) : null;

  return (
    <>
      <CardGrid
        store={SessionStore}
        cells={cells}
        ready={loaded}
        notice={notice}
        renderCard={(session, host) => (
          <Card
            id={session.id}
            icon={session.icon}
            title={session.name}
            count={session.tabs.length}
            collapsed={session.collapsed}
            canRename
            renaming={renamingId === session.id}
            host={host}
            optionsLabel={t('sessions.options')}
            renameLabel={t('sessions.renameSession')}
            extraActions={
              <button
                type="button"
                className="card-icon-button"
                aria-label={t('sessions.addTabs')}
                title={t('sessions.addTabs')}
                onClick={() => onAddTabs(session.id)}
              >
                <Icon name="plus" size={18} />
              </button>
            }
            onOpenMenu={openMenu}
            onStartRename={() => setRenamingId(session.id)}
            onCommitRename={(name) => commitRename(session.id, name)}
            onCancelRename={() => cancelRename(session.id)}
          >
            {session.tabs.length === 0 ? (
              <p className="card-empty-list">{t('sessions.emptySession')}</p>
            ) : (
              session.tabs.map((tab) => (
                <SessionRow
                  key={tab.id}
                  id={tab.id}
                  title={tab.title}
                  url={tab.url}
                  renaming={renamingId === tab.id}
                  optionsLabel={t('sessions.tabOptions')}
                  renameLabel={t('sessions.renameTab')}
                  onOpen={(disposition) => void BrowserService.open(tab.url, disposition)}
                  onOpenMenu={openMenu}
                  onStartRename={() => setRenamingId(tab.id)}
                  onCommitRename={(title) => commitRename(tab.id, title)}
                  onCancelRename={() => cancelRename(tab.id)}
                />
              ))
            )}
          </Card>
        )}
      />

      {menu && items && (
        <ContextMenu
          ownerKey={menu.key}
          x={menu.x}
          y={menu.y}
          alignEnd={menu.alignEnd}
          label={menu.kind === 'card' ? t('sessions.options') : t('sessions.tabOptions')}
          items={items}
          onClose={closeMenu}
        />
      )}
    </>
  );
};

export default Sessions;
