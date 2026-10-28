import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createSupabasePublicClient, hasSupabaseConfig } from '@/lib/supabase/server'
import { withFallback } from '@/lib/with-fallback'

export interface PublicSiteSettings {
  site_name?: string
  tagline?: string
  logo_url?: string
  favicon_url?: string
  google_analytics_id?: string
  google_search_console_verification?: string
  bing_verification_code?: string
  adsense_enabled?: boolean
  adsense_publisher_id?: string
  listing_ad_slot_id?: string
  prompt_ad_slot_id?: string
  ad_code_listing?: string
  ad_code_prompt_top?: string
  ad_code_prompt_bottom?: string
}

const getCachedPublicSiteSettings = unstable_cache(
  async (): Promise<PublicSiteSettings> => {
    const supabase = createSupabasePublicClient()
    const { data, error } = await supabase.rpc('get_public_site_settings')
    if (error) throw new Error(`Could not load public site settings: ${error.message}`)
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
    return data as PublicSiteSettings
  },
  ['public-site-settings-v1'],
  { tags: ['public-site-settings'], revalidate: 300 },
)

export const getPublicSiteSettings = cache(async (): Promise<PublicSiteSettings> => {
  if (!hasSupabaseConfig()) return {}
  return withFallback(getCachedPublicSiteSettings(), {})
})
