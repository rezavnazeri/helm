# Helm

Helm is a calm, wallpaper-first new tab environment for Chrome. It puts your spaces, shortcuts, bookmarks, weather, and lightweight productivity tools over a customizable visual background.

## Features

- Wallpaper-first new tab experience
- Built-in and custom wallpapers
- Light, dark, and automatic themes
- Adjustable wallpaper dimming
- Quick Access shortcuts with favicon buttons
- Drag-and-drop Quick Access reordering
- Visual bookmark space using Chrome bookmarks
- Weather with location search and Celsius/Fahrenheit support
- Lightweight tasks, notes, and reminders spaces
- Swipe and keyboard navigation between spaces
- English and Persian localization with RTL support
- Repositionable SideNav and Quick Access
- Local storage with no required account or backend
- Export/import of Chrome storage data

## Tech stack

- React
- TypeScript
- Vite
- SCSS
- Chrome Extension Manifest V3

## Development

Install dependencies:

```bash
npm install
```

Run the Vite development server:

```bash
npm run dev
```

Run linting:

```bash
npm run lint
```

Build the extension:

```bash
npm run build
```

### Load Helm in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the generated `dist` directory.
6. Open a new tab to use Helm.

## Project structure

- `src/components` — reusable UI and settings components
- `src/spaces` — individual Helm spaces
- `src/services` — Chrome storage, bookmarks, weather, wallpapers, and Quick Access logic
- `src/context` — application settings state
- `src/i18n` — localized UI strings
- `src/styles` — SCSS design system and component styles
- `public/icons` — local SVG icons
- `public/wallpapers` — bundled wallpapers
- `public/boot.js` — startup bootstrap for reducing visual startup delay

## Privacy

Helm does not require an account or a backend. Application data is stored locally in Chrome storage and IndexedDB. Weather requests use Open-Meteo when weather features are used, and Quick Access favicon images currently use Google's favicon service.

Custom wallpapers are currently stored in IndexedDB and are not included in the JSON backup. Review the permissions and external hosts in `public/manifest.json` before publishing a production build.

## Status

Helm is an active personal project and is still under development. APIs, UI details, and features may change between releases.
