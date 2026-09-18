import React, { useState, useEffect } from 'react';
import { StorageService } from '@/services/storage';
import { QuickBookmarkGroup } from '@/types/models';
import { useI18n } from '@/i18n/useI18n';
import Icon from '@/components/Icon';

const Bookmarks: React.FC = () => {
  const { t } = useI18n();
  const [groups, setGroups] = useState<QuickBookmarkGroup[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  useEffect(() => {
    const loadGroups = async () => {
      const stored = await StorageService.get<QuickBookmarkGroup[]>('bookmarkGroups');
      if (stored) {
        setGroups(stored.sort((a, b) => a.order - b.order));
        // Auto-expand the first group by default
        if (stored.length > 0) setExpandedGroupId(stored[0].id);
      }
    };
    loadGroups();
  }, []);

  const toggleGroup = async (groupId: string) => {
    // Auto-collapse rule: Only one expanded per column
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null); // Collapse if clicking the same one
    } else {
      setExpandedGroupId(groupId); // Expand new, collapse previous
    }
  };

  return (
    <div className="space-bookmarks">
      <div className="bookmark-grid">
        {groups.map((group) => (
          <div key={group.id} className="bookmark-card glass">
            {/* 1. Header Bar */}
            <div className="bookmark-header" onClick={() => toggleGroup(group.id)}>
              <div className="header-left">
                <div className="group-icon-wrapper">
                  <Icon name="bookmark" size={16} />
                </div>
                <span className="group-title">{group.title}</span>
                <span className="group-count">{group.bookmarkIds.length}</span>
              </div>
              <div className="header-right">
                <button className="group-options" onClick={(e) => e.stopPropagation()}>
                  <Icon name="more-menu" size={16} />
                </button>
                <div className="group-collapse">
                  {expandedGroupId === group.id ? (
                    <Icon name="chevron-up" size={16} />
                  ) : (
                    <Icon name="chevron-down" size={16} />
                  )}
                </div>
              </div>
            </div>

            {/* 2. Bookmark Bars (Only if expanded) */}
            {expandedGroupId === group.id && (
              <div className="bookmark-list-wrapper">
                <div className="bookmark-list">
                  {group.bookmarkIds.map((id) => (
                    <div key={id} className="bookmark-row">
                      <div className="bm-icon">⚡</div>
                      <div className="bm-info">
                        <span className="bm-title">GitHub</span>
                        <span className="bm-domain">github.com</span>
                      </div>
                      <button className="bm-options"><Icon name="more-menu" size={14} /></button>
                    </div>
                  ))}
                </div>

                {/* 3. Add Bar */}
                <button className="bookmark-add-bar">
                  <Icon name="plus" size={16} />
                  <span>{t('bookmarks.add')}</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bookmarks;