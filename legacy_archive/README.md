# Legacy archive

This folder stores the deprecated pre-Next.js implementation that used a Vite + root-entry architecture.

Archived from repository root during refactor to make the production path explicit:
- `App.tsx`, `index.tsx`, `index.html`, `vite.config.ts`, `metadata.json`, `types.ts`
- `components/`, `views/`, `services/`, `utils/`

The active app now lives under `src/app` + `src/lib` (Next.js App Router).
