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

### Android Build

To build the Android app:

```bash
npm run build:android
```

This builds the web app and syncs it to Android. Then build the APK or AAB:

```bash
cd android
./gradlew assembleRelease  # For APK
./gradlew bundleRelease     # For AAB (Play Store)
```

Release builds (APK and AAB) are automatically created and attached to GitHub Releases when you push a version tag (e.g., `v1.0.0`). Download the latest Android app from the [Releases page](https://github.com/hugsndnugs/I-Swear-I-Packed-It/releases/latest) or use the download link on the Home screen.

## Testing

Run unit tests:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run end-to-end tests (requires dev server running):
```bash
npm run test:e2e
```

Run E2E tests with UI:
```bash
npm run test:e2e:ui
```

## Environment Variables

- `UEX_API_TOKEN` (optional) - API token for fetching top cargo routes from UEX. Create an app at uexcorp.space/api/apps to get a token. Used by `npm run fetch:top-routes`.

- **Ship data:** The app uses `src/data/ships.generated.ts` for the ship list. `npm run build` runs `fetch:ships` (API fetch) before building; CI uses `build:ci` (no fetch), so the deployed site uses whatever `ships.generated.ts` is committed. To refresh ships locally, run `npm run fetch:ships`. An optional scheduled workflow can refresh and commit ship data (see `.github/workflows/refresh-ships.yml`).
- **Best routes:** To refresh with the top 100 profitable cargo routes from UEX, set `UEX_API_TOKEN` (create an app at uexcorp.space/api/apps) and run `npm run fetch:top-routes`. Without a token (or if the API fails), the script uses existing `data/top-100-routes.json` if present and regenerates `src/data/routes.generated.ts`. The monthly workflow (`.github/workflows/update-routes.yml`) runs this and commits updates. For the legacy flow (curated list or `fetch:routes`), edit `data/best-routes.json` and run `npm run update:routes`.

## Tech stack

- Vite + React 18 + TypeScript
- React Router
- vite-plugin-pwa (Workbox) for offline and installability
- No backend; presets and last-run stored in `localStorage`

**Images:** The app uses the logo and PWA icons only; there are no ship or equipment image assets. If you add images later (e.g. ship icons), prefer WebP and use lazy loading (`loading="lazy"` or Intersection Observer) for below-the-fold content.

## Project structure

- `src/data/` — Ships, tasks, contexts, loadout definitions.
- `src/lib/` — `generateChecklist()`, preset and last-run persistence.
- `src/screens/` — Home, Generator, Checklist, PackList.
- `src/components/` — Layout, Nav, CollapsibleSection, ProgressBar.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to run tests, build, and submit a pull request. We follow the [Code of Conduct](CODE_OF_CONDUCT.md).
