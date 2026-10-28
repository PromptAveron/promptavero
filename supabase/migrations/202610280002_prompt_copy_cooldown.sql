create table if not exists public.prompt_copy_events (
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  visitor_id uuid not null,
  last_copied_at timestamptz not null default now(),
  primary key (prompt_id, visitor_id)
);

alter table public.prompt_copy_events enable row level security;
revoke all on table public.prompt_copy_events from public, anon, authenticated;

drop function if exists public.record_prompt_copy(uuid);

create or replace function public.record_prompt_copy(p_prompt_id uuid, p_visitor_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_recorded boolean;
  current_copy_count integer;
begin
  if p_prompt_id is null or p_visitor_id is null then
    raise exception 'Prompt and visitor identifiers are required.';
  end if;

  insert into public.prompt_copy_events (prompt_id, visitor_id, last_copied_at)
  values (p_prompt_id, p_visitor_id, clock_timestamp())
  on conflict (prompt_id, visitor_id) do update
    set last_copied_at = excluded.last_copied_at
    where public.prompt_copy_events.last_copied_at <= clock_timestamp() - interval '30 seconds'
  returning true into event_recorded;

  if event_recorded then
    update public.prompts p
    set copy_count = p.copy_count + 1
    where p.id = p_prompt_id
      and p.status = 'published'
      and p.deleted_at is null
      and exists (
        select 1
        from public.categories c
        where c.id = p.category_id and c.is_published
      )
    returning p.copy_count into current_copy_count;

    if not found then
      raise exception 'Prompt is not publicly available.';
    end if;
  else
    select p.copy_count into current_copy_count
    from public.prompts p
    join public.categories c on c.id = p.category_id and c.is_published
    where p.id = p_prompt_id and p.status = 'published' and p.deleted_at is null;

    if not found then
      raise exception 'Prompt is not publicly available.';
    end if;
  end if;

  return current_copy_count;
end;
$$;

revoke all on function public.record_prompt_copy(uuid, uuid) from public;
grant execute on function public.record_prompt_copy(uuid, uuid) to anon, authenticated;
