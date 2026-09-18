import React from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useClock } from '@/hooks/useClock';
import { useSettings } from '@/context/useSettings';
import { useWeather } from '@/hooks/useWeather';

const getGreetingKey = (hour: number) => {
  if (hour < 6) return `general.greetings.night.${hour}`;
  if (hour < 12) return `general.greetings.morning.${hour - 6}`;
  if (hour < 17) return `general.greetings.afternoon.${hour - 12}`;
  if (hour < 22) return `general.greetings.evening.${hour - 17}`;
  return `general.greetings.lateNight.${hour - 21}`;
};

const Header: React.FC = () => {
  const { t, locale } = useI18n();
  const { time } = useClock();
  const { settings } = useSettings();
  const { weather, loading, error } = useWeather();
  const localeCode = locale === 'fa' ? 'fa-IR' : 'en-US';

  const formatTime = () =>
    time.toLocaleTimeString(localeCode, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.clockFormat === '12h',
    });

  const formatDate = () => {
    switch (settings.dateFormat) {
      case 'local':
        return time.toLocaleDateString(localeCode);
      case 'medium':
        return time.toLocaleDateString(localeCode, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      case 'short':
        return time.toLocaleDateString(localeCode, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      case 'long':
      default:
        return time.toLocaleDateString(localeCode, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
    }
  };

  const greeting = `${t(getGreetingKey(time.getHours()))}${settings.userName ? `, ${settings.userName}` : ''}!`;

  return (
    <header className="app-header">
      {settings.showClock && <div className="header-clock">{formatTime()}</div>}
      {settings.showDate && <div className="header-date">{formatDate()}</div>}
      {settings.showGreeting && <div className="greeting-text">{greeting}</div>}

      {settings.showQuickWeather && (settings.weatherLocation || weather) && (
        <div className="weather-widget">
          {loading && <span className="weather-desc">{t('common.loading')}</span>}
          {!loading && error && <span className="weather-desc">{t(error)}</span>}
          {!loading && !error && weather && (
            <>
              <span className="weather-icon">{weather.icon}</span>
              <span className="weather-temp">{weather.temperature}°</span>
              <span className="weather-desc">{t(`weather.codes.${weather.code}`)}</span>
              {/*<span className="weather-location">{weather.locationName}</span>*/}
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
