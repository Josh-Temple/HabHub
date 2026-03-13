-- Atomic reorder for habits list.
create or replace function public.reorder_habits(p_updates jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  expected_count int;
  updated_count int;
begin
  if p_updates is null or jsonb_typeof(p_updates) <> 'array' then
    raise exception 'p_updates must be a JSON array';
  end if;

  select count(*) into expected_count from jsonb_array_elements(p_updates);

  if expected_count = 0 then
    raise exception 'p_updates must include at least one item';
  end if;

  with updates as (
    select
      (item->>'id')::uuid as id,
      (item->>'sort_order')::int as sort_order
    from jsonb_array_elements(p_updates) as item
  ), applied as (
    update habits h
    set sort_order = u.sort_order
    from updates u
    where h.id = u.id
      and h.user_id = auth.uid()
    returning h.id
  )
  select count(*) into updated_count from applied;

  if updated_count <> expected_count then
    raise exception 'reorder failed: expected %, updated %', expected_count, updated_count;
  end if;
end;
$$;
