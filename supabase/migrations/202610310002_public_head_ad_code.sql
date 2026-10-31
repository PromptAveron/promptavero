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
        'ad_code_prompt_bottom', value -> 'ad_code_prompt_bottom',
        'ad_code_head', value -> 'ad_code_head'
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

notify pgrst, 'reload schema';
