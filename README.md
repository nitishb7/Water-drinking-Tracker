# Hydra – Water Drinking Tracker

React + Vite + Tailwind app to log, visualize, and manage daily water intake. Includes circular progress, quick-add buttons, per‑day reset, reminders via browser notifications, and optional cloud persistence via InstantDB.

## Features

- Set a daily hydration goal (default 2000ml)
- Log intakes via quick buttons (250/500/750ml) or custom input
- Animated circular progress ring with percentage
- Reminder system (30/60/120 min) using Notifications API, optional sound
- Daily reset at midnight or on next app open
- Today’s intake history with remove/undo
- Dark mode toggle
- Local persistence with optional InstantDB sync

## Getting Started

1. Install deps:

   ```bash
   npm i
   ```

2. Start dev server:

   ```bash
   npm run dev
   ```

3. Open http://localhost:5173

## InstantDB (optional cloud persistence)

This project defaults to localStorage. If an InstantDB client is available as `window.instant` with `save(appId, key, value)` and `load(appId, key)`, the app will sync best‑effort using the public app id.

- Public App ID: `55d5bab8-4201-4383-998f-0f38bce893de`
- You can override via `.env`:

  ```bash
  VITE_INSTANT_APP_ID=55d5bab8-4201-4383-998f-0f38bce893de
  ```

### Example: attach a simple client

Add a small script to your `index.html` before the main script to define `window.instant` using your preferred InstantDB SDK. The app will then automatically attempt to `load` once on startup and `save` after changes.

```html
<!-- Pseudo example; replace with real InstantDB SDK usage -->
<script>
  window.instant = {
    async save(appId, key, value) {
      // implement using InstantDB SDK
    },
    async load(appId, key) {
      // implement using InstantDB SDK
      return null
    },
  }
<\/script>
```

> Note: The app still works fully offline with localStorage.

## Notifications

- Reminders use the standard Browser Notifications API.
- When you enable reminders, you’ll be prompted for permission.
- If permission is denied, sound reminders can still play in‑page when the tab is open.

## Structure

- `src/App.tsx` – main app composition and state
- `src/components/*` – UI components
- `src/hooks/*` – localStorage, daily reset, reminders
- `src/db/instant.ts` – optional InstantDB sync wrapper
- `src/utils/date.ts` – date helpers

## Notes

- Daily logs are per‑day; previous days aren’t stored (can be extended).
- Reset occurs automatically on date change and can be triggered manually.
- Styling uses Tailwind with light blue tones and dark mode.

