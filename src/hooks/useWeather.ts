import { useEffect, useMemo, useState } from 'react';
import { WeatherService, WeatherData } from '@/services/weather';
import { useSettings } from '@/context/useSettings';
import { useI18n } from '@/i18n/useI18n';

const CACHE_KEY = 'helm-weather-cache';
const CACHE_TTL_MS = 30 * 60 * 1000;

interface CachedWeather {
  key: string;
  savedAt: number;
  data: WeatherData;
}

const readCache = (key: string): CachedWeather | null => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as CachedWeather | null;
    return cached && cached.key === key ? cached : null;
  } catch {
    return null;
  }
};

const writeCache = (key: string, data: WeatherData) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ key, savedAt: Date.now(), data }));
  } catch {

  }
};

export const useWeather = () => {
  const { settings } = useSettings();
  const { locale } = useI18n();

  const cacheKey = [
    settings.weatherLatitude,
    settings.weatherLongitude,
    settings.weatherLocation.trim().toLowerCase(),
    settings.temperatureUnit,
    locale,
  ].join('|');

  const [fetched, setFetched] = useState<{ key: string; data: WeatherData } | null>(null);
  const cachedData = useMemo(() => readCache(cacheKey)?.data ?? null, [cacheKey]);
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

    const cached = readCache(cacheKey);
    const isFresh = cached !== null && Date.now() - cached.savedAt < CACHE_TTL_MS;

    const fetchWeather = async (background: boolean) => {
      if (!background) setLoading(true);
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

        writeCache(cacheKey, data);

        if (!cancelled) {
          setFetched({ key: cacheKey, data });
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

    if (!isFresh) void fetchWeather(cached !== null);

    const interval = window.setInterval(() => void fetchWeather(true), CACHE_TTL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    cacheKey,
    hasLocation,
    hasCoordinates,
    settings.weatherLocation,
    settings.weatherLatitude,
    settings.weatherLongitude,
    settings.temperatureUnit,
    locale,
  ]);

  return {
    weather: hasLocation ? (fetched?.key === cacheKey ? fetched.data : cachedData) : null,
    loading,
    error,
  };
};