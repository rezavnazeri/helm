import React, { useRef, useEffect, useState } from 'react';
import { Space } from '@/types/models';
import { SECTIONS, SECTION_LABELS, SECTION_ICONS } from '@/constants/sections';
import { useI18n } from '@/i18n/useI18n';
import { useSettings } from '@/context/useSettings';
import Icon from './Icon';
import AddMenu, { type AddMenuOption } from './AddMenu';

interface SideNavProps {
  activeSpace: Space;
  onSpaceChange: (space: Space) => void;
  onOpenSettings: () => void;
  addOptions: AddMenuOption[];
}

interface IndicatorStyle {
  top: number;
  left: number;
  width: number;
  height: number;
  opacity: number;
}

const SideNav: React.FC<SideNavProps> = ({
  activeSpace,
  onSpaceChange,
  onOpenSettings,
  addOptions,
}) => {
  const { t } = useI18n();
  const { settings } = useSettings();
  
  const visibleSections = settings.spaceOrder.filter(
    (space): space is Space => SECTIONS.includes(space as Space) && settings.visibleSpaces[space] !== false,
  );
  
  const activeIndex = visibleSections.indexOf(activeSpace);

  const navRef = useRef<HTMLElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);

  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  useEffect(() => {
    const updateIndicator = () => {
      requestAnimationFrame(() => {
        if (!navRef.current || !navItemsRef.current) return;

        const wrapper = navItemsRef.current.parentElement;
        if (!wrapper) return;

        const buttons = navItemsRef.current.querySelectorAll<HTMLButtonElement>('.nav-item');
        const activeButton = buttons[activeIndex];

        if (!activeButton) {
          setIndicatorStyle((previous) => ({ ...previous, opacity: 0 }));
          return;
        }

        const buttonRect = activeButton.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const isHorizontal = settings.sideNavPosition === 'top' || settings.sideNavPosition === 'bottom';

        if (isHorizontal) {
          const indicatorWidth = buttonRect.width * 0.5;
          setIndicatorStyle({
            left: buttonRect.left - wrapperRect.left + (buttonRect.width - indicatorWidth) / 2,
            top: wrapperRect.height + 6,
            width: indicatorWidth,
            height: 3,
            opacity: 1,
          });
          return;
        }

        const indicatorHeight = buttonRect.height * 0.5;
        setIndicatorStyle({
          left: settings.sideNavPosition === 'right' ? wrapperRect.width + 6 : - 9,
          top: buttonRect.top - wrapperRect.top + (buttonRect.height - indicatorHeight) / 2,
          width: 3,
          height: indicatorHeight,
          opacity: 1,
        });
      });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);

    const observer = new ResizeObserver(updateIndicator);
    if (navRef.current) observer.observe(navRef.current);
    if (navItemsRef.current) observer.observe(navItemsRef.current);

    return () => {
      window.removeEventListener('resize', updateIndicator);
      observer.disconnect();
    };
  }, [activeIndex, visibleSections.length, settings.sideNavPosition]);

  if (!settings.sideNavEnabled) return null;

  return (
    <nav ref={navRef} className={`side-nav side-nav-${settings.sideNavPosition}`}>
      <div className="nav-top">
        <div className="logo">
          <Icon name='helm' variant='line' size={24}/>
        </div>
      </div>

      <div className="nav-items-wrapper">
        <div className="nav-indicator" style={indicatorStyle} />
        <div className="nav-items" ref={navItemsRef}>
          {visibleSections.map((space) => {
            const isActive = activeSpace === space;

            return (
              <button
                key={space}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSpaceChange(space)}
                aria-label={t(SECTION_LABELS[space])}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  name={SECTION_ICONS[space]}
                  variant={isActive ? 'solid' : 'line'}
                  size={20}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="nav-space-title-wrapper">
          <div
            className="nav-space-title-slider"
            style={{
              transform: `translateX(-${activeIndex * 100}%)`,
            }}
          >
            {visibleSections.map((space) => (
              <div key={space} className="nav-space-title">
                {t(SECTION_LABELS[space])}
              </div>
            ))}
          </div>
        </div>

      <div className="nav-bottom">
        <AddMenu position={settings.sideNavPosition} options={addOptions} />

        <button
          type="button"
          className="nav-utility"
          aria-label={t('common.settings')}
          onClick={onOpenSettings}
        >
          <Icon name="settings" variant="line" size={18} />
        </button>
      </div>
    </nav>
  );
};

export default SideNav;