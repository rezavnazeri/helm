import React, { useMemo, useState } from 'react';
import AddDialogShell from '@/components/dialog/AddDialogShell';
import IconPicker from '@/components/dialog/IconPicker';
import Favicon from '@/components/Favicon';
import Icon from '@/components/Icon';
import { useCardStore } from '@/hooks/useCardStore';
import { useOpenTabs } from '@/hooks/useOpenTabs';
import { useI18n } from '@/i18n/useI18n';
import { createSessionTab, SessionStore } from '@/services/sessionSpace';
import type { OpenGroup, OpenTab } from '@/services/tabs';
import { NO_GROUP } from '@/services/tabs';
import type { CardIcon } from '@/types/cards';

interface AddSessionDialogProps {
  isOpen: boolean;
  /** Add tabs to this session instead of creating a new one. */
  sessionId?: string;
  onClose: () => void;
  onSaved: () => void;
}

type CheckState = 'none' | 'some' | 'all';

type TreeItem =
  | { kind: 'tab'; tab: OpenTab }
  | { kind: 'group'; group: OpenGroup; tabs: OpenTab[] };

const stateOf = (ids: number[], selected: ReadonlySet<number>): CheckState => {
  const count = ids.filter((id) => selected.has(id)).length;
  if (count === 0) return 'none';
  return count === ids.length ? 'all' : 'some';
};

/** Tabs in tab order; the tabs of a group are gathered under one group node. */
const buildTree = (tabs: OpenTab[], groups: OpenGroup[]): TreeItem[] => {
  const known = new Map(groups.map((group) => [group.id, group]));
  const nodes = new Map<number, Extract<TreeItem, { kind: 'group' }>>();
  const items: TreeItem[] = [];

  for (const tab of tabs) {
    const group = tab.groupId === NO_GROUP ? undefined : known.get(tab.groupId);

    if (!group) {
      items.push({ kind: 'tab', tab });
      continue;
    }

    let node = nodes.get(group.id);
    if (!node) {
      node = { kind: 'group', group, tabs: [] };
      nodes.set(group.id, node);
      items.push(node);
    }
    node.tabs.push(tab);
  }

  return items;
};

const Check: React.FC<{ state: CheckState }> = ({ state }) => (
  <span className={`tree-check is-${state}`} aria-hidden="true">
    {state === 'all' && <Icon name="check" size={12} />}
    {state === 'some' && <span className="tree-check-dash" />}
  </span>
);

interface RowsProps {
  selected: ReadonlySet<number>;
  onToggle: (ids: number[]) => void;
}

const TabRow: React.FC<RowsProps & { tab: OpenTab; depth: number }> = ({
  tab,
  depth,
  selected,
  onToggle,
}) => {
  const checked = selected.has(tab.id);

  return (
    <li>
      <div
        className={`tree-row${checked ? ' is-selected' : ''}`}
        style={{ paddingInlineStart: 6 + depth * 18 }}
      >
        <span className="tree-toggle-spacer" />
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          className="tree-select"
          onClick={() => onToggle([tab.id])}
        >
          <Check state={checked ? 'all' : 'none'} />
          <Favicon url={tab.url} className="tree-favicon" />
          <span className="tree-name">{tab.title}</span>
        </button>
      </div>
    </li>
  );
};

const GroupRow: React.FC<RowsProps & { group: OpenGroup; tabs: OpenTab[] }> = ({
  group,
  tabs,
  selected,
  onToggle,
}) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(true);

  const ids = tabs.map((tab) => tab.id);
  const state = stateOf(ids, selected);

  return (
    <li>
      <div className={`tree-row${state === 'all' ? ' is-selected' : ''}`}>
        <button
          type="button"
          className={`tree-toggle${open ? '' : ' is-collapsed'}`}
          aria-label={open ? t('cards.collapse') : t('cards.expand')}
          aria-expanded={open}
          onClick={() => setOpen((previous) => !previous)}
        >
          <Icon name="chevron-down" size={14} />
        </button>

        <button
          type="button"
          role="checkbox"
          aria-checked={state === 'some' ? 'mixed' : state === 'all'}
          className="tree-select"
          onClick={() => onToggle(ids)}
        >
          <Check state={state} />
          <span className="tree-group-dot" data-color={group.color} />
          <span className="tree-name">{group.title || t('sessionDialog.untitledGroup')}</span>
          <span className="tree-meta">{tabs.length}</span>
        </button>
      </div>

      {open && (
        <ul role="group">
          {tabs.map((tab) => (
            <TabRow key={tab.id} tab={tab} depth={1} selected={selected} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  );
};

const Content: React.FC<Omit<AddSessionDialogProps, 'isOpen'>> = ({
  sessionId,
  onClose,
  onSaved,
}) => {
  const { t } = useI18n();
  const { status, data } = useOpenTabs();

  // The session being extended, if any (read once when the dialog opens).
  const [existing] = useState(() =>
    sessionId
      ? SessionStore.getSnapshot().cells.find((cell) => cell?.id === sessionId) ?? null
      : null,
  );
  const { cells } = useCardStore(SessionStore);
  const target = existing && cells.some((cell) => cell?.id === existing.id) ? existing : null;

  const [name, setName] = useState(existing?.name || t('sessions.defaultName'));
  const [icon, setIcon] = useState<CardIcon>(existing?.icon ?? 'layers');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [busy, setBusy] = useState(false);

  // Tabs that are already in the session are not offered again.
  const available = useMemo(() => {
    const taken = new Set(target?.tabs.map((tab) => tab.url));
    return data.tabs.filter((tab) => !taken.has(tab.url));
  }, [data.tabs, target]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return available;

    return available.filter(
      (tab) =>
        tab.title.toLowerCase().includes(needle) || tab.url.toLowerCase().includes(needle),
    );
  }, [available, query]);

  const tree = useMemo(() => buildTree(visible, data.groups), [visible, data.groups]);
  const visibleIds = useMemo(() => visible.map((tab) => tab.id), [visible]);

  const chosen = available.filter((tab) => selected.has(tab.id));

  const toggle = (ids: number[]) =>
    setSelected((previous) => {
      const next = new Set(previous);
      const all = ids.every((id) => next.has(id));
      for (const id of ids) {
        if (all) next.delete(id);
        else next.add(id);
      }
      return next;
    });

  const save = async () => {
    if (chosen.length === 0 || busy) return;
    setBusy(true);

    const tabs = chosen.map((tab) => createSessionTab(tab.title, tab.url));
    const finalName = name.trim() || t('sessions.defaultName');

    try {
      if (target) {
        await SessionStore.patch(target.id, (card) => ({
          ...card,
          name: finalName,
          icon,
          tabs: [...card.tabs, ...tabs],
        }));
      } else {
        await SessionStore.add({
          id: crypto.randomUUID(),
          icon,
          collapsed: false,
          name: finalName,
          tabs,
        });
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error('Failed to save session:', error);
      setBusy(false);
    }
  };

  const selectAllState = stateOf(visibleIds, selected);

  return (
    <AddDialogShell
      title={target ? t('sessionDialog.titleAddTabs') : t('sessionDialog.title')}
      description={t('sessionDialog.description')}
      submitLabel={target ? t('sessionDialog.submitTabs') : t('sessionDialog.submit')}
      canSubmit={chosen.length > 0 && !busy}
      onSubmit={() => void save()}
      onClose={onClose}
    >
      <div className="add-dialog-field add-dialog-field--first">
        <label className="add-dialog-label" htmlFor="session-name">
          {t('sessionDialog.name')}
        </label>
        <input
          id="session-name"
          type="text"
          className="text-input"
          dir="auto"
          value={name}
          maxLength={200}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="search-box">
        <Icon name="search" size={16} />
        <input
          type="text"
          dir="auto"
          value={query}
          placeholder={t('sessionDialog.search')}
          aria-label={t('sessionDialog.search')}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query !== '' && (
          <button
            type="button"
            className="search-clear"
            aria-label={t('sessionDialog.clearSearch')}
            onClick={() => setQuery('')}
          >
            <Icon name="close" size={14} />
          </button>
        )}
      </div>

      <div className="dialog-tree">
        {status === 'loading' && <p className="add-dialog-message">{t('common.loading')}</p>}

        {status === 'unavailable' && (
          <p className="add-dialog-message">{t('sessionDialog.unavailable')}</p>
        )}

        {status === 'ready' && available.length === 0 && (
          <p className="add-dialog-message">{t('sessionDialog.noTabs')}</p>
        )}

        {status === 'ready' && available.length > 0 && visible.length === 0 && (
          <p className="add-dialog-message">{t('sessionDialog.noMatches')}</p>
        )}

        {status === 'ready' && visible.length > 0 && (
          <ul role="tree" aria-label={t('sessionDialog.title')} aria-multiselectable="true">
            <li>
              <div className="tree-row tree-row--all">
                <span className="tree-toggle-spacer" />
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selectAllState === 'some' ? 'mixed' : selectAllState === 'all'}
                  className="tree-select"
                  onClick={() => toggle(visibleIds)}
                >
                  <Check state={selectAllState} />
                  <span className="tree-name">{t('sessionDialog.selectAll')}</span>
                  <span className="tree-meta">
                    {t('sessionDialog.selected', { count: chosen.length })}
                  </span>
                </button>
              </div>
            </li>

            {tree.map((item) =>
              item.kind === 'tab' ? (
                <TabRow
                  key={`tab:${item.tab.id}`}
                  tab={item.tab}
                  depth={0}
                  selected={selected}
                  onToggle={toggle}
                />
              ) : (
                <GroupRow
                  key={`group:${item.group.id}`}
                  group={item.group}
                  tabs={item.tabs}
                  selected={selected}
                  onToggle={toggle}
                />
              ),
            )}
          </ul>
        )}
      </div>

      <IconPicker value={icon} onChange={setIcon} />
    </AddDialogShell>
  );
};

const AddSessionDialog: React.FC<AddSessionDialogProps> = ({
  isOpen,
  sessionId,
  onClose,
  onSaved,
}) => (isOpen ? <Content sessionId={sessionId} onClose={onClose} onSaved={onSaved} /> : null);

export default AddSessionDialog;
