import React, { useEffect, useRef } from 'react';
import { useI18n } from '@/i18n/useI18n';

interface AddDialogShellProps {
  title: string;
  description: string;
  submitLabel: string;
  canSubmit: boolean;
  onSubmit: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

/** Frame of every "add" dialog: backdrop, title, description and the two buttons. */
const AddDialogShell: React.FC<AddDialogShellProps> = ({
  title,
  description,
  submitLabel,
  canSubmit,
  onSubmit,
  onClose,
  children,
}) => {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="add-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-dialog-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="add-dialog-title">{title}</h2>
        <p className="add-dialog-description">{description}</p>

        {children}

        <div className="add-dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDialogShell;
