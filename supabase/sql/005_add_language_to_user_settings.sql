alter table public.user_settings
  add column if not exists language text not null default 'en' check (language in ('en','ja'));
