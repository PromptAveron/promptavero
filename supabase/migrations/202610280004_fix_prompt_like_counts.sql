update public.prompts p
set like_count = (
  select count(*)::integer
  from public.prompt_likes pl
  where pl.prompt_id = p.id
);

create or replace function public.toggle_prompt_like(p_prompt_id uuid, p_visitor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
  inserted_count integer;
  visitor_liked boolean;
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

  delete from public.prompt_likes
  where prompt_id = p_prompt_id and visitor_id = p_visitor_id;
  get diagnostics deleted_count = row_count;

  if deleted_count = 1 then
    visitor_liked := false;
    update public.prompts p
    set like_count = greatest(p.like_count - 1, 0)
    where p.id = p_prompt_id
    returning p.like_count into current_like_count;
  else
    insert into public.prompt_likes (prompt_id, visitor_id)
    values (p_prompt_id, p_visitor_id)
    on conflict (prompt_id, visitor_id) do nothing;
    get diagnostics inserted_count = row_count;

    if inserted_count = 1 then
      visitor_liked := true;
      update public.prompts p
      set like_count = p.like_count + 1
      where p.id = p_prompt_id
      returning p.like_count into current_like_count;
    else
      select exists (
        select 1
        from public.prompt_likes pl
        where pl.prompt_id = p_prompt_id and pl.visitor_id = p_visitor_id
      ), p.like_count
      into visitor_liked, current_like_count
      from public.prompts p
      where p.id = p_prompt_id;
    end if;
  end if;

  return jsonb_build_object('liked', visitor_liked, 'likeCount', current_like_count);
end;
$$;

revoke all on function public.toggle_prompt_like(uuid, uuid) from public;
grant execute on function public.toggle_prompt_like(uuid, uuid) to anon, authenticated;
