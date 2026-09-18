export interface WallpaperDefinition {
  id: string;
  labelKey: string;
  src: string;
  thumbnail: string;
  DetectedTheme: 'light' | 'dark';
}

export const BUILTIN_WALLPAPERS: WallpaperDefinition[] = [
  {
    id: 'default',
    labelKey: 'appearance.wallpapers.default',
    src: '/wallpapers/default.webp',
    thumbnail: '/wallpapers/default.thumb.webp',
    DetectedTheme: 'dark',
  },
  {
    id: 'dune-night',
    labelKey: 'appearance.wallpapers.duneNight',
    src: '/wallpapers/dune-dark.webp',
    thumbnail: '/wallpapers/dune-dark.thumb.webp',
    DetectedTheme: 'dark',
  },
  {
    id: 'desert-day',
    labelKey: 'appearance.wallpapers.duneDay',
    src: '/wallpapers/dune-light.webp',
    thumbnail: '/wallpapers/dune-light.thumb.webp',
    DetectedTheme: 'light',
  },
  {
    id: 'alpenglow',
    labelKey: 'appearance.wallpapers.alpenglow',
    src: '/wallpapers/alpenglow.webp',
    thumbnail: '/wallpapers/alpenglow.thumb.webp',
    DetectedTheme: 'light',
  },
  {
    id: 'bmw',
    labelKey: 'appearance.wallpapers.bmw',
    src: '/wallpapers/bmw.webp',
    thumbnail: '/wallpapers/bmw.thumb.webp',
    DetectedTheme: 'dark',
  },
  {
    id: 'coast',
    labelKey: 'appearance.wallpapers.coast',
    src: '/wallpapers/coast.webp',
    thumbnail: '/wallpapers/coast.thumb.webp',
    DetectedTheme: 'dark',
  },
  {
    id: 'colorful',
    labelKey: 'appearance.wallpapers.colorful',
    src: '/wallpapers/colorful.webp',
    thumbnail: '/wallpapers/colorful.thumb.webp',
    DetectedTheme: 'light',
  },
  {
    id: 'forest',
    labelKey: 'appearance.wallpapers.forest',
    src: '/wallpapers/forest.webp',
    thumbnail: '/wallpapers/forest.thumb.webp',
    DetectedTheme: 'dark',
  },
  {
    id: 'iceberg',
    labelKey: 'appearance.wallpapers.iceberg',
    src: '/wallpapers/iceberg.webp',
    thumbnail: '/wallpapers/iceberg.thumb.webp',
    DetectedTheme: 'dark',
  },
  {
    id: 'minimal',
    labelKey: 'appearance.wallpapers.minimal',
    src: '/wallpapers/minimal.webp',
    thumbnail: '/wallpapers/minimal.thumb.webp',
    DetectedTheme: 'dark',
  },
  {
    id: 'nebula',
    labelKey: 'appearance.wallpapers.nebula',
    src: '/wallpapers/nebula.webp',
    thumbnail: '/wallpapers/nebula.thumb.webp',
    DetectedTheme: 'dark',
  },
  {
    id: 'porsche',
    labelKey: 'appearance.wallpapers.porsche',
    src: '/wallpapers/porsche.webp',
    thumbnail: '/wallpapers/porsche.thumb.webp',
    DetectedTheme: 'dark',
  },
];

export const WALLPAPER_MAP: Record<string, WallpaperDefinition> =
  Object.fromEntries(
    BUILTIN_WALLPAPERS.map((wp) => [wp.id, wp]),
  );