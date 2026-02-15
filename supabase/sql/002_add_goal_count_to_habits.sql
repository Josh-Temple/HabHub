-- Fix for legacy projects created before `goal_count` existed.
-- `001_schema_rls.sql` uses `create table if not exists`, which does not add missing columns
-- when `public.habits` already exists.

alter table public.habits
  add column if not exists goal_count integer not null default 1;

-- Ensure PostgREST sees the updated schema immediately.
notify pgrst, 'reload schema';
