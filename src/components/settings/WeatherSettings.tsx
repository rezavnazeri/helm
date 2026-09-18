import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSettings } from '@/context/useSettings';
import { useI18n } from '@/i18n/useI18n';
import {
  LocationSuggestion,
  WeatherService,
} from '@/services/weather';
import Icon from '@/components/Icon';

const WeatherSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { t, locale } = useI18n();

  const [locationQuery, setLocationQuery] = useState(
    settings.weatherLocation,
  );
  const [suggestions, setSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [searching, setSearching] = useState(false);

  const savedLocationRef = useRef(settings.weatherLocation);

  const isEditing =
    locationQuery !== settings.weatherLocation;

  const showSuggestions =
    isEditing &&
    locationQuery.trim().length >= 2 &&
    suggestions.length > 0;

  useEffect(() => {
    savedLocationRef.current = settings.weatherLocation;
  }, [settings.weatherLocation]);

  useEffect(() => {
    const query = locationQuery.trim();

    if (
      query.length < 2 ||
      query === savedLocationRef.current
    ) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setSearching(true);

      try {
        const results =
          await WeatherService.searchLocations(
            query,
            locale,
          );

        if (!cancelled) {
          setSuggestions(results);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [locationQuery, locale]);

  const chooseLocation = (
    location: LocationSuggestion,
  ) => {
    const full = [
      location.name,
      location.admin1,
      location.country,
    ]
      .filter(Boolean)
      .join(', ');

    savedLocationRef.current = full;

    void updateSettings({
      weatherLocation: full,
      weatherLatitude: location.latitude,
      weatherLongitude: location.longitude,
      weatherTimezone: location.timezone,
    });

    setLocationQuery(full);
    setSuggestions([]);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const locationName = t(
          'weather.currentLocation',
        );

        savedLocationRef.current = locationName;

        void updateSettings({
          weatherLocation: locationName,
          weatherLatitude: coords.latitude,
          weatherLongitude: coords.longitude,
        });

        setLocationQuery(locationName);
        setSuggestions([]);
      },
      (error) => {
        console.error(
          'Geolocation failed:',
          error,
        );
      },
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 8000,
      },
    );
  };

  return (
    <div className="settings-section">
      <h3>{t('settings.groups.weather')}</h3>

      <div className="setting-row">
        <label>{t('weather.location')}</label>

        <div className="setting-row group">
          <div className="location-search">
            <Icon
              name="search"
              size={16}
              className="search-icon"
            />

            <input
              type="text"
              className="text-input"
              placeholder={t(
                'weather.locationPlaceholder',
              )}
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                setSuggestions([]);
              }}
            />

            {searching && (
              <span className="location-search-status">
                {t('common.loading')}
              </span>
            )}

            {showSuggestions && (
              <div className="location-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.id}-${suggestion.latitude}`}
                    type="button"
                    className="suggestion-item"
                    onClick={() =>
                      chooseLocation(suggestion)
                    }
                  >
                    <strong>
                      {suggestion.name}
                    </strong>

                    <span>
                      {[
                        suggestion.admin1,
                        suggestion.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="action-button"
            onClick={useCurrentLocation}
          >
            {t('weather.useCurrentLocation')}
          </button>
        </div>
      </div>

      <div className="setting-row">
        <label>{t('weather.units')}</label>

        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-btn ${
              settings.temperatureUnit === 'celsius'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              updateSettings({
                temperatureUnit: 'celsius',
              })
            }
          >
            °C
          </button>

          <button
            type="button"
            className={`segmented-btn ${
              settings.temperatureUnit === 'fahrenheit'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              updateSettings({
                temperatureUnit: 'fahrenheit',
              })
            }
          >
            °F
          </button>
        </div>
      </div>

      <p className="settings-help">
        {t('weather.serviceHelp')}
      </p>
    </div>
  );
};

export default WeatherSettings;