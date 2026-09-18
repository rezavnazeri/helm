export interface LocationSuggestion {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  code: number;
  icon: string;
  locationName: string;
}

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code <= 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌧️';
  return '⛈️';
}

export const WeatherService = {
  async searchLocations(query: string, language = 'en'): Promise<LocationSuggestion[]> {
    const url = new URL(GEO_URL);
    url.searchParams.set('name', query.trim());
    url.searchParams.set('count', '7');
    url.searchParams.set('language', language === 'fa' ? 'fa' : 'en');
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('weather.locationSearchFailed');
    const data = await response.json() as { results?: Array<LocationSuggestion> };
    return data.results ?? [];
  },

  async getWeatherByCoordinates(
    latitude: number,
    longitude: number,
    locationName: string,
    unit: 'celsius' | 'fahrenheit' = 'celsius',
  ): Promise<WeatherData> {
    const url = new URL(FORECAST_URL);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m');
    url.searchParams.set('temperature_unit', unit);
    url.searchParams.set('wind_speed_unit', unit === 'celsius' ? 'kmh' : 'mph');
    url.searchParams.set('timezone', 'auto');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('weather.fetchFailed');
    const data = await response.json() as { current: { temperature_2m: number; relative_humidity_2m: number; apparent_temperature: number; weather_code: number; wind_speed_10m: number } };
    const code = data.current.weather_code;

    return {
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      code,
      icon: getWeatherIcon(code),
      locationName,
    };
  },

  async getWeather(location: string, unit: 'celsius' | 'fahrenheit' = 'celsius', language = 'en'): Promise<WeatherData> {
    const results = await this.searchLocations(location, language);
    const first = results[0];
    if (!first) throw new Error('weather.locationNotFound');
    const label = [first.name, first.country].filter(Boolean).join(', ');
    return this.getWeatherByCoordinates(first.latitude, first.longitude, label, unit);
  },
};
