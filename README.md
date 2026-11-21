# Helm

Helm is a calm, wallpaper-first new tab environment for Chrome. It turns your blank new tab into a customizable workspace with quick access to your favorite websites, bookmarks, saved sessions, notes, weather, and more.

**Your new tab should be a useful workspace, not just a blank page.**

## Screenshots

<img width="1920" height="911" alt="Helm" src="https://github.com/user-attachments/assets/00efd8c1-bf6a-4aae-a6f8-6af7ca7e9a0c" />
<img width="1920" height="911" alt="Helm" src="https://github.com/user-attachments/assets/68cf2a00-3a12-415a-b6a9-496bf5ec2b71" />
<img width="1919" height="905" alt="Helm" src="https://github.com/user-attachments/assets/92f62e1d-fede-48df-83eb-dc980c4eab36" />
<img width="1920" height="911" alt="Helm" src="https://github.com/user-attachments/assets/efb3b575-6be5-4671-988e-aa91ceef2f30" />

## Features

### Customizable New Tab

- Built-in and custom wallpapers
- Light, dark, and automatic themes
- Adjustable wallpaper dimming
- Customizable Quick Access shortcuts
- Repositionable SideNav and Quick Access
- Flexible, responsive spaces and cards

### Bookmarks

A curated view of your Chrome bookmark folders, seamlessly integrated with your existing bookmarks.

- Add and organize selected Chrome bookmark folders
- Expand, collapse, and rearrange folders
- Rename and manage bookmarks directly from Helm
- Open individual bookmarks or entire folders in different ways
- Changes stay synchronized with Chrome's bookmark manager

### Sessions

Save tabs for later without adding them to your bookmarks.

- Save open tabs and entire tab groups as sessions
- Search and select individual tabs or groups
- Add tabs to existing sessions
- Restore individual tabs or entire sessions
- Open sessions in new tabs, windows, or tab groups
- Rename and manage saved tabs and sessions

### Notes

Keep lightweight notes right alongside your bookmarks and sessions.

- Create plain-text notes with automatic saving
- Rename, copy, and delete notes
- Organize notes using the same flexible card layout as other spaces

### Other Features

- Weather with location search
- English and Persian localization with RTL support
- Local data storage and backup import/export

## Roadmap

Helm is actively evolving. The following features are planned for future releases:

**Workspaces**
- Organize browsing around projects and contexts
- Associate sessions and browser activity with workspaces
- Quickly switch between workspaces

**Productivity**
- Lightweight task management
- Reminders associated with browser activity
- Quick capture from the new tab page

## Tech Stack

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

Start the development server:

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

### Install in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the generated `dist` directory.

## Privacy

Helm does not require an account or backend. Application data is stored locally using Chrome storage and IndexedDB.

- **Bookmarks:** Helm accesses your Chrome bookmarks directly and stores your selected folders and layout preferences.
- **Sessions:** Saved session information, including tab titles and URLs, is stored locally.
- **Notes:** Notes are saved automatically.
- **Wallpapers:** Custom wallpapers are stored locally in IndexedDB.
- **Weather:** Weather data is retrieved from Open-Meteo when the feature is used.
- **Quick Access:** Favicons are retrieved from Google's favicon service and cached locally.

Custom wallpapers are not currently included in JSON backups.

## License

Helm is licensed under the MIT License.
See [LICENSE](LICENSE) for details.