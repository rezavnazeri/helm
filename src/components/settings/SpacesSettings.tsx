import React, { useState } from 'react';
import { useSettings } from '@/context/useSettings';
import { useI18n } from '@/i18n/useI18n';
import Icon from '@/components/Icon';

const SpacesSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { t } = useI18n();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const spaces = settings.spaceOrder;

  const handleDragStart = (id: string) => setDraggedItem(id);
  const handleDragOver = (event: React.DragEvent, target: string) => {
    event.preventDefault();
    if (!draggedItem || draggedItem === target) return;
    const next = [...settings.spaceOrder];
    const from = next.indexOf(draggedItem);
    const to = next.indexOf(target);
    next.splice(from, 1);
    next.splice(to, 0, draggedItem);
    void updateSettings({ spaceOrder: next });
  };

  const toggle = (id: string) => {
    if (id === 'home') return;
    void updateSettings({ visibleSpaces: { ...settings.visibleSpaces, [id]: !settings.visibleSpaces[id] } });
  };

  return (
    <div className="settings-section">
      <h3>{t('settings.groups.spaces')}</h3>
      <div className="spaces-list">
        {spaces.map((id) => (
          <div key={id} className={`space-row ${draggedItem === id ? 'dragging' : ''}`} draggable onDragStart={() => handleDragStart(id)} onDragOver={(e) => handleDragOver(e, id)} onDragEnd={() => setDraggedItem(null)}>
            <span className="drag-handle" title={t('spaces.dragToReorder')}><Icon name="drag" size={16} /></span>
            <span className="space-label">{t(`common.${id}`)}</span>
            <button type="button" className={`toggle-switch ${settings.visibleSpaces[id] ? 'on' : 'off'}`} disabled={id === 'home'} onClick={() => toggle(id)} role="switch" aria-checked={settings.visibleSpaces[id]} aria-label={t(`common.${id}`)}>
              <span className="toggle-handle" />
            </button>
          </div>
        ))}
      </div>
      <p className="settings-help">{t('spaces.help')}</p>
    </div>
  );
};

export default SpacesSettings;
