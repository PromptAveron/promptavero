alter table public.prompts
  add column if not exists like_count integer not null default 0 check (like_count >= 0),
  add column if not exists copy_count integer not null default 0 check (copy_count >= 0);

create table if not exists public.prompt_likes (
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (prompt_id, visitor_id)
);

alter table public.prompt_likes enable row level security;
revoke all on table public.prompt_likes from public, anon, authenticated;

create or replace function public.add_prompt_like(p_prompt_id uuid, p_visitor_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
  current_like_count integer;
begin
  if p_prompt_id is null or p_visitor_id is null then
    raise exception 'Prompt and visitor identifiers are required.';
  end if;

  perform 1
  from public.prompts p
  join public.categories c on c.id = p.category_id and c.is_published
  where p.id = p_prompt_id and p.status = 'published' and p.deleted_at is null
  for update of p;

  if not found then
    raise exception 'Prompt is not publicly available.';
  end if;

  insert into public.prompt_likes (prompt_id, visitor_id)
  values (p_prompt_id, p_visitor_id)
  on conflict (prompt_id, visitor_id) do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count = 1 then
    update public.prompts p
    set like_count = p.like_count + 1
    where p.id = p_prompt_id
    returning p.like_count into current_like_count;
  else
    select p.like_count into current_like_count
    from public.prompts p
    where p.id = p_prompt_id;
  end if;

  return current_like_count;
end;
$$;

create or replace function public.record_prompt_copy(p_prompt_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_copy_count integer;
begin
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

  return current_copy_count;
end;
$$;

revoke all on function public.add_prompt_like(uuid, uuid) from public;
revoke all on function public.record_prompt_copy(uuid) from public;
grant execute on function public.add_prompt_like(uuid, uuid) to anon, authenticated;
grant execute on function public.record_prompt_copy(uuid) to anon, authenticated;
