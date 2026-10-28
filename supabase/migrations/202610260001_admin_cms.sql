create extension if not exists pgcrypto;

create or replace function public.is_promptavero_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  seo_title text,
  meta_description text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  prompt_text text not null,
  negative_prompt text,
  instructions text,
  personalization_tips text,
  expected_result text,
  category_id uuid not null references public.categories(id) on delete restrict,
  tags text[] not null default '{}',
  model_name text,
  art_style text,
  aspect_ratio text,
  resolution text,
  use_case text,
  difficulty text,
  language text not null default 'en',
  seo_title text,
  meta_description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image_url text,
  indexing_preference text not null default 'index' check (indexing_preference in ('index', 'noindex')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived', 'trashed')),
  is_featured boolean not null default false,
  published_at timestamptz,
  scheduled_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.prompt_images (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  caption text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size integer not null check (file_size > 0 and file_size <= 5242880),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now()
);

create unique index if not exists prompt_images_one_primary_per_prompt
  on public.prompt_images(prompt_id) where is_primary;
create index if not exists prompts_status_updated_idx on public.prompts(status, updated_at desc);
create index if not exists prompts_category_id_idx on public.prompts(category_id);
create index if not exists prompts_published_at_idx on public.prompts(published_at desc);
create index if not exists prompt_images_prompt_order_idx on public.prompt_images(prompt_id, sort_order);
create index if not exists categories_published_order_idx on public.categories(is_published, sort_order);

create or replace function public.enforce_prompt_image_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.prompt_id::text, 0));
  if tg_op = 'INSERT' then
    select count(*) into current_count from public.prompt_images where prompt_id = new.prompt_id;
    if current_count >= 5 then
      raise exception 'A prompt can have no more than five images.' using errcode = 'check_violation';
    end if;
  elsif old.prompt_id is distinct from new.prompt_id then
    select count(*) into current_count from public.prompt_images where prompt_id = new.prompt_id;
    if current_count >= 5 then
      raise exception 'A prompt can have no more than five images.' using errcode = 'check_violation';
    end if;
  end if;
  if new.is_primary then
    update public.prompt_images set is_primary = false
      where prompt_id = new.prompt_id and is_primary and id <> coalesce(new.id, gen_random_uuid());
  end if;
  return new;
end;
$$;

drop trigger if exists prompt_images_limit_trigger on public.prompt_images;
create trigger prompt_images_limit_trigger
  before insert or update of prompt_id, is_primary on public.prompt_images
  for each row execute function public.enforce_prompt_image_limit();

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.categories enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_images enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Public can read published categories" on public.categories;
create policy "Public can read published categories" on public.categories
  for select to anon, authenticated using (is_published or public.is_promptavero_admin());
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories
  for all to authenticated using (public.is_promptavero_admin()) with check (public.is_promptavero_admin());

drop policy if exists "Public can read published prompts" on public.prompts;
create policy "Public can read published prompts" on public.prompts
  for select to anon, authenticated
  using ((status = 'published' and deleted_at is null) or public.is_promptavero_admin());
drop policy if exists "Admins manage prompts" on public.prompts;
create policy "Admins manage prompts" on public.prompts
  for all to authenticated using (public.is_promptavero_admin()) with check (public.is_promptavero_admin());

drop policy if exists "Public can read images for public prompts" on public.prompt_images;
create policy "Public can read images for public prompts" on public.prompt_images
  for select to anon, authenticated using (
    public.is_promptavero_admin()
    or exists (select 1 from public.prompts p where p.id = prompt_id and p.status = 'published' and p.deleted_at is null)
  );
drop policy if exists "Admins manage prompt images" on public.prompt_images;
create policy "Admins manage prompt images" on public.prompt_images
  for all to authenticated using (public.is_promptavero_admin()) with check (public.is_promptavero_admin());

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings
  for all to authenticated using (public.is_promptavero_admin()) with check (public.is_promptavero_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prompt-images', 'prompt-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view prompt images" on storage.objects;
create policy "Public can view prompt images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'prompt-images');
drop policy if exists "Admins upload prompt images" on storage.objects;
create policy "Admins upload prompt images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'prompt-images' and public.is_promptavero_admin()
  );
drop policy if exists "Admins update prompt images" on storage.objects;
create policy "Admins update prompt images" on storage.objects
  for update to authenticated using (bucket_id = 'prompt-images' and public.is_promptavero_admin())
  with check (bucket_id = 'prompt-images' and public.is_promptavero_admin());
drop policy if exists "Admins delete prompt images" on storage.objects;
create policy "Admins delete prompt images" on storage.objects
  for delete to authenticated using (bucket_id = 'prompt-images' and public.is_promptavero_admin());
