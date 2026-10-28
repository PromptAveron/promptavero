insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view site assets" on storage.objects;
create policy "Public can view site assets" on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-assets');

drop policy if exists "Admins upload site assets" on storage.objects;
create policy "Admins upload site assets" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'site-assets'
    and public.is_promptavero_admin()
    and (storage.foldername(name))[1] = 'branding'
  );

drop policy if exists "Admins delete site assets" on storage.objects;
create policy "Admins delete site assets" on storage.objects
  for delete to authenticated using (
    bucket_id = 'site-assets'
    and public.is_promptavero_admin()
    and (storage.foldername(name))[1] = 'branding'
  );

create or replace function public.get_public_site_settings()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select jsonb_strip_nulls(jsonb_build_object(
        'site_name', value -> 'site_name',
        'tagline', value -> 'tagline',
        'logo_url', value -> 'logo_url',
        'favicon_url', value -> 'favicon_url',
        'google_analytics_id', value -> 'google_analytics_id',
        'google_search_console_verification', value -> 'google_search_console_verification',
        'bing_verification_code', value -> 'bing_verification_code',
        'adsense_enabled', value -> 'adsense_enabled',
        'adsense_publisher_id', value -> 'adsense_publisher_id',
        'listing_ad_slot_id', value -> 'listing_ad_slot_id',
        'prompt_ad_slot_id', value -> 'prompt_ad_slot_id',
        'ad_code_listing', value -> 'ad_code_listing',
        'ad_code_prompt_top', value -> 'ad_code_prompt_top',
        'ad_code_prompt_bottom', value -> 'ad_code_prompt_bottom'
      ))
      from public.site_settings
      where key = 'site'
      limit 1
    ),
    '{}'::jsonb
  );
$$;

revoke all on function public.get_public_site_settings() from public;
grant execute on function public.get_public_site_settings() to anon, authenticated;
