# HabHub (Next.js + Supabase + Vercel)

HabHub is a habit tracker with Supabase Auth, RLS-protected data isolation, due-logic filtering, and simple analysis.

## Tech stack
- Next.js (App Router) + TypeScript + Tailwind
- Supabase Auth (Magic Link / OTP)
- Supabase Postgres + RLS
- Vitest for domain logic tests

## Environment variables
1. Copy `.env.example` to `.env.local`
2. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase setup (SQL)
Run the following SQL in Supabase SQL editor:

- `supabase/sql/001_schema_rls.sql`
- `supabase/sql/002_add_goal_count_to_habits.sql` (safe to run on existing projects; backfills missing `goal_count`)
- `supabase/sql/003_add_name_column_compat.sql` (for legacy schemas that still have `title` instead of `name`)
- `supabase/sql/004_make_title_compatible.sql` (if `title` is still NOT NULL; keeps `name`/`title` in sync during transition)

This creates:
- `user_settings`
- `habits`
- `entries` (`(user_id, habit_id, date_key)` PK for idempotent upsert)
- RLS enabled on all tables with `auth.uid() = user_id` policies.

## Local development
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Routes
- `/login`
- `/app/today`
- `/app/habits`
- `/app/habits/new`
- `/app/habits/[id]`
- `/app/analysis`
- `/app/settings`

`/app/*` requires login and redirects to `/login` when unauthenticated (enforced in `src/middleware.ts`).

## Feature notes
- Login uses Supabase Magic Link callback route `/auth/callback` and then redirects to `/app/today`.
- Today page shows habits due for today via pure function `isHabitDue`.
- Entry updates are done with upsert conflict key `user_id,habit_id,date_key`.
- Settings supports JSON export/import (cloud ⇄ JSON).
- Initial migration flow in Settings allows importing legacy localStorage-like JSON and marking `migration_done`.

## RLS quick check
1. Create two users in Supabase Auth.
2. Login as user A and create habits/entries.
3. Login as user B and verify A's rows are not returned in app UI.
4. In SQL editor with anon key context, verify queries only return own rows under RLS policies.

## Tests
```bash
npm test
```
Includes 20+ fixed cases for `isHabitDue` in `src/lib/domain/isHabitDue.test.ts`.
