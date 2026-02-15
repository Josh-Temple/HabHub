-- Compatibility migration for older schemas that used `title` instead of `name` on `public.habits`.
do $$
declare
  has_name boolean;
  has_title boolean;
  null_name_count bigint;
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
    update public.habits
    set name = title
    where name is null;
  end if;

  select count(*) from public.habits where name is null into null_name_count;

  if null_name_count = 0 then
    alter table public.habits alter column name set not null;
  end if;
end $$;
