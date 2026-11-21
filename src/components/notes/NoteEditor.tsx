import React, { useEffect, useRef, useState } from 'react';
import { consumeNoteFocus, MAX_NOTE_LENGTH } from '@/services/noteSpace';

interface NoteEditorProps {
  id: string;
  text: string;
  label: string;
  placeholder: string;
  onSave: (text: string) => void;
}

const SAVE_DELAY_MS = 400;

const NoteEditor: React.FC<NoteEditorProps> = ({ id, text, label, placeholder, onSave }) => {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(text);
  const [dirty, setDirty] = useState(false);
  const [seenText, setSeenText] = useState(text);

  const pending = useRef({ value, dirty, onSave });
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    pending.current = { value, dirty, onSave };
  });

  if (text !== seenText) {
    setSeenText(text);
    if (!dirty && text !== value) setValue(text);
  }

  const flush = () => {
    window.clearTimeout(timer.current);

    if (pending.current.dirty) {
      pending.current.dirty = false;
      pending.current.onSave(pending.current.value);
      setDirty(false);
    }
  };

  useEffect(() => {
    if (consumeNoteFocus(id)) areaRef.current?.focus();
  }, [id]);

  useEffect(() => {
    const save = () => {
      window.clearTimeout(timer.current);
      const { value: latest, dirty: unsaved, onSave: saveText } = pending.current;
      if (unsaved) saveText(latest);
    };

    window.addEventListener('pagehide', save);

    return () => {
      window.removeEventListener('pagehide', save);
      save();
    };
  }, []);

  return (
    <textarea
      ref={areaRef}
      className="note-text"
      dir="auto"
      value={value}
      maxLength={MAX_NOTE_LENGTH}
      aria-label={label}
      placeholder={placeholder}
      onChange={(event) => {
        const next = event.target.value;
        pending.current = { value: next, dirty: true, onSave };
        setValue(next);
        setDirty(true);

        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
      }}
      onBlur={flush}
      onContextMenu={(event) => event.stopPropagation()}
    />
  );
};

export default NoteEditor;
