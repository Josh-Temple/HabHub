-- Compatibility migration for projects where `public.habits.title` still exists and is required.
-- This keeps old clients working while allowing new clients to write `name` only.
do $$
declare
  has_name boolean;
  has_title boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habits'
      and column_name = 'name'
  ) into has_name;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habits'
      and column_name = 'title'
  ) into has_title;

  if not has_name then
    alter table public.habits add column name text;
  end if;

  if has_title then
    update public.habits set name = title where name is null;
    update public.habits set title = name where title is null;

    alter table public.habits alter column title drop not null;
  end if;

  alter table public.habits alter column name set not null;
end $$;

create or replace function public.habits_name_title_sync()
returns trigger
language plpgsql
as $$
begin
  if new.name is null and new.title is not null then
    new.name := new.title;
  elsif new.title is null and new.name is not null then
    new.title := new.name;
  end if;

  return new;
end;
$$;

drop trigger if exists habits_name_title_sync on public.habits;
create trigger habits_name_title_sync
before insert or update on public.habits
for each row
execute function public.habits_name_title_sync();
