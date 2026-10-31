create table if not exists public.admin_login_rate_limits (
  ip_hash text primary key check (ip_hash ~ '^[0-9a-f]{64}$'),
  failed_attempts smallint not null default 0 check (failed_attempts between 0 and 3),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists admin_login_rate_limits_updated_at_idx
  on public.admin_login_rate_limits(updated_at);

alter table public.admin_login_rate_limits enable row level security;
revoke all on table public.admin_login_rate_limits from public, anon, authenticated;

create table if not exists public.admin_login_rate_limit_config (
  id boolean primary key default true check (id),
  server_secret text not null check (length(server_secret) >= 32)
);

alter table public.admin_login_rate_limit_config enable row level security;
revoke all on table public.admin_login_rate_limit_config from public, anon, authenticated;

create or replace function public.reserve_admin_login_attempt(p_ip_hash text, p_server_secret text)
returns table (allowed boolean, retry_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_attempts smallint;
  v_window_started_at timestamptz;
  v_locked_until timestamptz;
begin
  if p_server_secret is null or not exists (
    select 1
    from public.admin_login_rate_limit_config as config
    where config.id and config.server_secret = p_server_secret
  ) then
    raise exception 'Invalid server authorization for the admin sign-in rate limit.';
  end if;

  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'A valid login rate-limit key is required.';
  end if;

  delete from public.admin_login_rate_limits
  where updated_at < v_now - interval '48 hours';

  insert into public.admin_login_rate_limits (ip_hash)
  values (p_ip_hash)
  on conflict (ip_hash) do nothing;

  select limits.failed_attempts, limits.window_started_at, limits.locked_until
    into v_attempts, v_window_started_at, v_locked_until
  from public.admin_login_rate_limits as limits
  where limits.ip_hash = p_ip_hash
  for update;

  if v_locked_until is not null and v_locked_until > v_now then
    return query select false, v_locked_until;
    return;
  end if;

  if v_locked_until is not null or v_window_started_at <= v_now - interval '24 hours' then
    v_attempts := 0;
    v_window_started_at := v_now;
  end if;

  if v_attempts >= 3 then
    v_locked_until := v_now + interval '24 hours';
    update public.admin_login_rate_limits as limits
    set locked_until = v_locked_until, updated_at = v_now
    where limits.ip_hash = p_ip_hash;
    return query select false, v_locked_until;
    return;
  end if;

  v_attempts := v_attempts + 1;
  v_locked_until := case
    when v_attempts = 3 then v_now + interval '24 hours'
    else null
  end;
  update public.admin_login_rate_limits as limits
  set failed_attempts = v_attempts,
      window_started_at = v_window_started_at,
      locked_until = v_locked_until,
      updated_at = v_now
  where limits.ip_hash = p_ip_hash;

  return query select true, null::timestamptz;
end;
$$;

create or replace function public.clear_admin_login_attempts(p_ip_hash text, p_server_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_server_secret is null or not exists (
    select 1
    from public.admin_login_rate_limit_config as config
    where config.id and config.server_secret = p_server_secret
  ) then
    raise exception 'Invalid server authorization for the admin sign-in rate limit.';
  end if;

  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'A valid login rate-limit key is required.';
  end if;

  delete from public.admin_login_rate_limits as limits
  where limits.ip_hash = p_ip_hash;
end;
$$;

revoke all on function public.reserve_admin_login_attempt(text, text) from public;
revoke all on function public.clear_admin_login_attempts(text, text) from public;
grant execute on function public.reserve_admin_login_attempt(text, text) to anon, authenticated;
grant execute on function public.clear_admin_login_attempts(text, text) to anon, authenticated;
