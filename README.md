# Jue N-Back

Offline-first dual n-back trainer built as a bilingual PWA.

## Stack

- Vite + React + TypeScript
- IndexedDB via Dexie
- Zustand for session state
- i18next for Chinese/English UI
- Lightweight SVG/CSS statistics charts
- Web Audio API + SpeechSynthesis API
- Vitest + Playwright
- GitHub Pages deployment through GitHub Actions

## Scripts

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm test:e2e
```

If Playwright browsers are not installed:

```bash
pnpm exec playwright install chromium
```

## Deployment

The workflow in `.github/workflows/deploy.yml` builds the app and deploys `dist/` to GitHub Pages on pushes to `main`.

The app is fully static and has no backend. Training history is stored in the browser's IndexedDB. Use the JSON export/import screen for backup or cross-device migration.
