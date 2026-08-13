# HabHub

Minimal habit tracker built with Next.js + Supabase.

## Deployment
- Production: https://hab-hub.vercel.app/

## Current architecture
- **Frontend:** Next.js App Router (`src/app`) + TypeScript + Tailwind CSS.
- **Data/Auth:** Supabase Auth + Postgres + RLS.
- **Domain logic:** Pure helpers in `src/lib/domain` (due logic, progress logic, analysis logic).
- **Compatibility layers:** write fallbacks for legacy Supabase schemas (`src/lib/supabase`).

## Repository structure
- `src/app`: route UI (login, today, habits, analysis, settings).
- `src/components`: shared app components used by App Router pages.
- `src/lib`: domain logic, settings import validation, Supabase helpers.
- `src/types`: domain types.
- `supabase/sql`: schema and migration SQL files.
- `legacy_archive`: archived legacy Vite/root-entry implementation kept for reference.

## Routes
- `/login`
- `/auth/callback`
- `/app/today`
- `/app/habits`
- `/app/habits/new`
- `/app/habits/[id]`
- `/app/analysis`
- `/app/settings`

`/app/*` auth protection is currently handled in `src/app/app/layout.tsx` by checking Supabase session on the client and redirecting to `/login` when missing.

## Environment variables
1. Copy `.env.example` to `.env.local`
2. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase setup (SQL)
Run in order:
1. `supabase/sql/001_schema_rls.sql`
2. `supabase/sql/002_add_goal_count_to_habits.sql`
3. `supabase/sql/003_add_name_column_compat.sql`
4. `supabase/sql/004_make_title_compatible.sql`
5. `supabase/sql/005_add_language_to_user_settings.sql`
6. `supabase/sql/006_reorder_habits_rpc.sql`

## Key behavior
- Today page uses pure due-logic (`isHabitDue`) and progress helpers.
- Habit reorder uses a validated plan + atomic Supabase RPC (`reorder_habits`).
- Settings supports:
  - full restore JSON import/export
  - legacy migration JSON import (old local schema normalization)
  - preflight validation with warnings/errors and explicit per-section result summary

## Development
```bash
npm install
npm run dev
```

## Checks
```bash
npm run lint
npm test
npm run build
```
