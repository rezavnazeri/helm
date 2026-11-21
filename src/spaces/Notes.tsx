import React, { useRef, useState } from 'react';
import Card from '@/components/cards/Card';
import CardGrid from '@/components/cards/CardGrid';
import { renameItem } from '@/components/cards/menuItems';
import ContextMenu, { type ContextMenuItem } from '@/components/ContextMenu';
import Icon from '@/components/Icon';
import NoteEditor from '@/components/notes/NoteEditor';
import { SECTION_ICONS } from '@/constants/sections';
import { useCardStore } from '@/hooks/useCardStore';
import { useCardUi } from '@/hooks/useCardUi';
import { useI18n } from '@/i18n/useI18n';
import { NoteStore } from '@/services/noteSpace';
import { lastOccupiedIndex } from '@/utils/cardGrid';
import { copyText } from '@/utils/clipboard';

const COPIED_MESSAGE_MS = 1600;

interface NotesProps {
    onAddNote: () => void;
}

const Notes: React.FC<NotesProps> = ({ onAddNote }) => {
  const { t } = useI18n();
  const { loaded, cells } = useCardStore(NoteStore);
  const { menu, openMenu, closeMenu, renamingId, setRenamingId, cancelRename } = useCardUi();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copiedTimer = useRef<number | undefined>(undefined);

  const copyNote = async (id: string) => {
    // Read from the store so text typed a moment ago is included.
    const note = NoteStore.getSnapshot().cells.find((cell) => cell?.id === id);
    if (!note?.text || !(await copyText(note.text))) return;

    setCopiedId(id);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopiedId(null), COPIED_MESSAGE_MS);
  };

  const menuItems = (id: string): ContextMenuItem[] | null => {
    const note = cells.find((cell) => cell?.id === id);
    if (!note) return null;

    return [
      {
        id: 'copy',
        label: t('notes.copy'),
        icon: 'copy',
        disabled: note.text === '',
        onSelect: () => void copyNote(note.id),
      },
      renameItem(t, true, () => setRenamingId(note.id)),
      {
        id: 'delete',
        label: t('notes.delete'),
        icon: 'delete',
        danger: true,
        onSelect: () => void NoteStore.remove(note.id),
      },
    ];
  };

  const items = menu ? menuItems(menu.id) : null;

  const notice =
    loaded && lastOccupiedIndex(cells) < 0 ? (
      <div className="card-empty">
        <p>{t('notes.emptyTitle')}</p>
        <span>{t('notes.emptyHint')}</span>
        <button type="button" className="primary-button" onClick={onAddNote}>
          {t('notes.addNote')}
        </button>
      </div>
    ) : null;

  return (
    <>
      <CardGrid
        store={NoteStore}
        cells={cells}
        ready={loaded}
        notice={notice}
        renderCard={(note, host) => (
          <Card
            id={note.id}
            icon={SECTION_ICONS.notes}
            title={note.name}
            collapsed={note.collapsed}
            canRename
            renaming={renamingId === note.id}
            host={host}
            optionsLabel={t('notes.options')}
            renameLabel={t('notes.renameNote')}
            extraActions={
              <span className="note-copy">
                <button
                  type="button"
                  className="card-icon-button"
                  aria-label={t('notes.copy')}
                  title={t('notes.copy')}
                  disabled={note.text === ''}
                  onClick={() => void copyNote(note.id)}
                >
                  <Icon name="copy" size={16} />
                </button>
                {copiedId === note.id && (
                  <span className="note-copied" role="status">
                    {t('notes.copied')}
                  </span>
                )}
              </span>
            }
            onOpenMenu={openMenu}
            onStartRename={() => setRenamingId(note.id)}
            onCommitRename={(name) => {
              void NoteStore.patch(note.id, (card) => ({ ...card, name }));
              cancelRename(note.id);
            }}
            onCancelRename={() => cancelRename(note.id)}
          >
            <NoteEditor
              id={note.id}
              text={note.text}
              label={t('notes.textLabel')}
              placeholder={t('notes.placeholder')}
              onSave={(text) => void NoteStore.patch(note.id, (card) => ({ ...card, text }))}
            />
          </Card>
        )}
      />

      {menu && items && (
        <ContextMenu
          ownerKey={menu.key}
          x={menu.x}
          y={menu.y}
          alignEnd={menu.alignEnd}
          label={t('notes.options')}
          items={items}
          onClose={closeMenu}
        />
      )}
    </>
  );
};

export default Notes;
