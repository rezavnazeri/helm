import { useEffect, useState } from 'react';
import { WeatherService, WeatherData } from '@/services/weather';
import { useSettings } from '@/context/useSettings';
import { useI18n } from '@/i18n/useI18n';

export const useWeather = () => {
  const { settings } = useSettings();
  const { locale } = useI18n();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCoordinates =
    settings.weatherLatitude != null &&
    settings.weatherLongitude != null;

  const hasLocation =
    settings.weatherLocation.trim().length > 0 ||
    hasCoordinates;

  useEffect(() => {
    if (!hasLocation) {
      return;
    }

    let cancelled = false;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = hasCoordinates
          ? await WeatherService.getWeatherByCoordinates(
              settings.weatherLatitude!,
              settings.weatherLongitude!,
              settings.weatherLocation,
              settings.temperatureUnit,
            )
          : await WeatherService.getWeather(
              settings.weatherLocation,
              settings.temperatureUnit,
              locale,
            );

        if (!cancelled) {
          setWeather(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'weather.fetchFailed',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchWeather();

    const interval = window.setInterval(
      fetchWeather,
      30 * 60 * 1000,
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    hasLocation,
    hasCoordinates,
    settings.weatherLocation,
    settings.weatherLatitude,
    settings.weatherLongitude,
    settings.temperatureUnit,
    locale,
  ]);

  return {
    weather: hasLocation ? weather : null,
    loading,
    error,
  };
};