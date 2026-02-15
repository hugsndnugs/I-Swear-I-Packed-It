# Pre-Flight Assistant

From hangar to hyperspace without the "oh no" moment. A mobile-first PWA that generates ship-specific pre-flight checklists for Star Citizen.

## Features

- **Ship-specific checklists** — Pick your ship and operation type; get a tailored checklist.
- **Crew readiness** — Add crew roles and see an "All Green" readiness summary per role.
- **Medical loadout** — Role-based pack list (medgun, refills, trauma meds, etc.) on the Pack List screen.
- **Presets** — Save and reuse ship + operation + crew configs.
- **Quick-start** — One-tap to repeat your last run.
- **Offline** — Works as a PWA with cached assets.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the URL shown). Use a mobile viewport or install the PWA for the best experience.

## Build

```bash
npm run build
npm run preview
```

The output is in `dist/`. Serve it over HTTPS to enable the service worker and install prompt.

## Tech stack

- Vite + React 18 + TypeScript
- React Router
- vite-plugin-pwa (Workbox) for offline and installability
- No backend; presets and last-run stored in `localStorage`

## Project structure

- `src/data/` — Ships, tasks, contexts, loadout definitions.
- `src/lib/` — `generateChecklist()`, preset and last-run persistence.
- `src/screens/` — Home, Generator, Checklist, PackList.
- `src/components/` — Layout, Nav, CollapsibleSection, ProgressBar.
