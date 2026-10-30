# Helm

Helm is a calm, wallpaper-first new tab environment for Chrome. It provides a customizable visual starting point with quick-access shortcuts, personalization, weather, and lightweight browser utilities.

Helm is designed around a simple idea: **your new tab should be a useful workspace, not just a blank page.**

## Screenshots

<img width="1920" height="911" alt="Helm - Google Chrome 18-Sep-26 8_06_50 PM" src="https://github.com/user-attachments/assets/00efd8c1-bf6a-4aae-a6f8-6af7ca7e9a0c" />
<img width="1920" height="911" alt="Helm - Google Chrome 18-Sep-26 8_07_56 PM" src="https://github.com/user-attachments/assets/68cf2a00-3a12-415a-b6a9-496bf5ec2b71" />
<img width="1919" height="905" alt="Screenshot 2026-10-30 183436" src="https://github.com/user-attachments/assets/92f62e1d-fede-48df-83eb-dc980c4eab36" />
<img width="1920" height="911" alt="Helm - Google Chrome 18-Sep-26 8_07_27 PM" src="https://github.com/user-attachments/assets/efb3b575-6be5-4671-988e-aa91ceef2f30" />

## Features

### Currently Implemented

* Wallpaper-first new tab experience
* Built-in and custom wallpapers
* Light, dark, and automatic themes
* Adjustable wallpaper dimming
* Quick Access shortcuts with favicon buttons
* Cached Quick Access favicons, so new tabs do not re-download icons
* Drag-and-drop Quick Access reordering
* Scrollable spaces
* Weather with location search
* Celsius and Fahrenheit support
* English and Persian localization
* RTL support for Persian
* Repositionable SideNav and Quick Access
* Local application storage with no required account or backend
* Export and import of Chrome storage data

### Bookmarks

The Bookmarks space is a curated view of selected folders from your Chrome bookmark tree — not a copy of your bookmarks. Folders and their contents always come from Chrome, so changes made in Chrome's own bookmark manager appear in Helm immediately.

* Display selected folders from your Chrome bookmark tree
* Add folders to the space and remove them from it without modifying Chrome
* Expand and collapse folders
* Drag-and-drop folders into any cell of a responsive multi-column grid
* Manual layout with intentional empty cells, preserved across window resizing
* Inline rename for folders and bookmarks
* Open bookmarks in the current tab, a new tab, a background tab, or a new window
* Open an entire folder at once — in the current tab, in new tabs, or in a new window
* Context menus for folders and bookmarks, with full keyboard navigation
* Delete bookmarks from Chrome directly from Helm
* Native Chrome favicons via the `favicon` permission, so bookmark icons are not downloaded
* Layout stored locally and kept in sync with Chrome across all Helm tabs

### Planned

#### Sessions

A temporary workspace for unfinished browser work.

* Park individual tabs without losing them
* Park multiple tabs as a session
* Close parked tabs to remove them from the active browser window
* Restore sessions when you're ready to continue
* Preserve tab titles, URLs, favicons, and session metadata
* Manage and delete old sessions
* Optional session expiration and cleanup

Sessions are intended to solve a specific problem: **keeping tabs open simply because you aren't finished with them yet.**

#### Workspaces

Organize browser activity around projects and contexts rather than individual tabs.

* Create project-based workspaces
* Associate sessions and browser activity with a workspace
* Quickly switch between different contexts
* Resume previous work without rebuilding your browser environment

#### Saved Bookmarks

Extending the Bookmarks space beyond Chrome's bookmark tree.

* Bookmark previews and metadata
* Creating and editing individual bookmarks from inside Helm

#### Tasks, Notes & Reminders

Lightweight productivity tools built around browser activity rather than a full productivity suite.

* Simple tasks
* Contextual notes
* Reminders associated with browser work
* Quick capture from the new tab page

#### Browser Utilities

Additional tools intended to make Helm a useful browser workspace.

* Improved search across active and parked browser content
* Tab and session cleanup tools
* Duplicate tab detection
* Recently used and recently parked work
* Focus-oriented browsing features

> Planned features are subject to change as Helm evolves and user feedback is collected.

## Tech Stack

* React
* TypeScript
* Vite
* SCSS
* Chrome Extension Manifest V3

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

## Project Structure

* `src/components` — reusable UI and settings components
* `src/services` — Chrome storage, bookmarks, weather, wallpapers, and Quick Access logic
* `src/context` — application settings and shared state
* `src/i18n` — localized UI strings
* `src/spaces` — individual Helm spaces
* `src/styles` — SCSS design system and component styles
* `public/icons` — local SVG icons
* `public/wallpapers` — bundled wallpapers
* `public/boot.js` — startup bootstrap for reducing visual startup delay

## Privacy

Helm does not require an account or a backend. Application data is stored locally in Chrome storage and IndexedDB.

Weather requests use Open-Meteo when weather features are used. Quick Access favicons are downloaded once from Google's favicon service and then kept in local storage; they are refreshed in the background after 30 days.

The Bookmarks space reads and edits your Chrome bookmarks directly. Helm stores only which folders are displayed, their icon, their position and whether they are collapsed. Bookmark favicons come from Chrome's own favicon store (the `favicon` permission) and are not downloaded.

Custom wallpapers are currently stored in IndexedDB and are not included in the JSON backup.

Before publishing a production build, review the permissions and external hosts declared in `public/manifest.json`.

## Status

Helm is an active personal project and is currently under development.

The current release focuses on the new tab experience, personalization, Quick Access, the Bookmarks space, weather, localization, and local data management. Sessions, workspaces, and lightweight productivity features are planned for future releases.

APIs, UI details, and planned features may change as development continues.
