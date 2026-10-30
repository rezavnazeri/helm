import React, { useEffect, useRef } from 'react';

interface InlineRenameProps {
  value: string;
  label: string;
  className?: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

const InlineRename: React.FC<InlineRenameProps> = ({
  value,
  label,
  className = '',
  onCommit,
  onCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.focus();
    input.select();
  }, []);

  const finish = (save: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    const next = inputRef.current?.value.trim() ?? '';

    if (save && next !== '' && next !== value) {
      onCommit(next);
    } else {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      dir="auto"
      className={`bm-rename-input ${className}`}
      defaultValue={value}
      aria-label={label}
      spellCheck={false}
      draggable={false}
      onBlur={() => finish(true)}
      onKeyDown={(event) => {
        event.stopPropagation();

        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault();
          finish(true);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          finish(false);
        }
      }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.stopPropagation()}
    />
  );
};

export default InlineRename;