import { saveSettingsAction } from '@/app/admin/actions'
import { BrandAssetUpload } from '@/components/admin/brand-asset-upload'
import { DEFAULT_HEAD_AD_CODE, getPromptPageAdCodes } from '@/lib/ad-code'
import { requireAdmin } from '@/lib/supabase/admin'

function getSettings(value: unknown): Record<string, string | boolean | number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, string | boolean | number>
}

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'site').maybeSingle()
  if (error) throw new Error(`Could not load site settings: ${error.message}`)
  const settings = getSettings(data?.value)
  const promptPageAds = getPromptPageAdCodes({
    ad_code_prompt_top: typeof settings.ad_code_prompt_top === 'string' ? settings.ad_code_prompt_top : undefined,
    ad_code_prompt_bottom: typeof settings.ad_code_prompt_bottom === 'string' ? settings.ad_code_prompt_bottom : undefined,
  })
  const inputClass = 'mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-sm font-normal outline-none focus:border-primary'
  return (
    <div className="mx-auto max-w-4xl pt-10 md:pt-0">
      <header><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Configuration</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Site settings</h1><p className="mt-2 text-sm text-muted-foreground">Manage general site details and the public contact and social information.</p></header>
      {saved ? <p role="status" className="mt-4 rounded-md bg-green-50 px-3 py-2 text-xs text-green-800">Settings saved.</p> : null}
      <form action={saveSettingsAction} className="mt-6 space-y-4">
        <input type="hidden" name="key" value="site" />
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Brand and general</h2><p className="mt-1 text-xs text-muted-foreground">Basic public site identity and contact details.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium">Site name<input name="site_name" defaultValue={String(settings.site_name ?? 'PromptAvero')} className={inputClass} /></label>
            <label className="text-xs font-medium">Tagline<input name="tagline" defaultValue={String(settings.tagline ?? '')} className={inputClass} /></label>
            <label className="text-xs font-medium">Public site URL<input name="site_url" type="url" defaultValue={String(settings.site_url ?? process.env.NEXT_PUBLIC_SITE_URL ?? '')} className={inputClass} /></label>
            <label className="text-xs font-medium">Contact email<input name="contact_email" type="email" defaultValue={String(settings.contact_email ?? '')} className={inputClass} /></label>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <BrandAssetUpload asset="logo" currentUrl={typeof settings.logo_url === 'string' ? settings.logo_url : undefined} />
            <BrandAssetUpload asset="favicon" currentUrl={typeof settings.favicon_url === 'string' ? settings.favicon_url : undefined} />
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Analytics and verification</h2>
          <p className="mt-1 text-xs text-muted-foreground">Analytics loads automatically on public pages. Verification values are added to the public page metadata.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium">Google Analytics measurement ID<input name="google_analytics_id" placeholder="G-XXXXXXXXXX" defaultValue={String(settings.google_analytics_id ?? '')} className={inputClass} /><span className="mt-1 block text-[10px] font-normal text-muted-foreground">Loaded automatically on public pages.</span></label>
            <label className="text-xs font-medium">Google Search Console verification code<input name="google_search_console_verification" defaultValue={String(settings.google_search_console_verification ?? '')} className={inputClass} /><span className="mt-1 block text-[10px] font-normal text-muted-foreground">Enter the content value of the google-site-verification meta tag.</span></label>
            <label className="text-xs font-medium sm:col-span-2">Bing Webmaster verification code<input name="bing_verification_code" defaultValue={String(settings.bing_verification_code ?? '')} className={inputClass} /><span className="mt-1 block text-[10px] font-normal text-muted-foreground">Enter the content value of the msvalidate.01 meta tag.</span></label>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Advertising</h2>
          <p className="mt-1 text-xs text-muted-foreground">Head code runs on public pages only. Placement ad code runs in an isolated frame. Ads are never loaded in the admin. Only paste code from ad networks you trust.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-xs font-medium sm:col-span-2"><input name="adsense_enabled" type="checkbox" defaultChecked={settings.adsense_enabled === true} className="size-4 accent-primary" />Enable ad placements</label>
            <label className="text-xs font-medium sm:col-span-2">Global head ad code<textarea name="ad_code_head" rows={6} defaultValue={String(settings.ad_code_head ?? DEFAULT_HEAD_AD_CODE)} placeholder="Paste the ad network code, including its script tags" className={`${inputClass} h-auto py-2 font-mono text-xs`} /><span className="mt-1 block text-[10px] font-normal text-muted-foreground">Added to the document head on public pages. Clear this field to disable the global ad code.</span></label>
            <label className="text-xs font-medium sm:col-span-2">Listing page ad code<textarea name="ad_code_listing" rows={5} defaultValue={String(settings.ad_code_listing ?? '')} placeholder="Paste an ad unit code snippet" className={`${inputClass} h-auto py-2 font-mono text-xs`} /></label>
            <label className="text-xs font-medium sm:col-span-2">Below the prompt text<textarea name="ad_code_prompt_top" rows={5} defaultValue={promptPageAds.belowPrompt} placeholder="Paste an ad unit code snippet" className={`${inputClass} h-auto py-2 font-mono text-xs`} /></label>
            <label className="text-xs font-medium sm:col-span-2">Below the prompt image<textarea name="ad_code_prompt_bottom" rows={7} defaultValue={promptPageAds.belowImage} placeholder="Paste an ad unit code snippet" className={`${inputClass} h-auto py-2 font-mono text-xs`} /></label>
            <p className="text-[10px] text-muted-foreground sm:col-span-2">These codes are the defaults for prompt pages. Use the advertising switch above to enable or disable ad placements.</p>
            <p className="text-[10px] text-muted-foreground sm:col-span-2">Each snippet is limited to 20,000 characters. Review applicable privacy requirements before enabling third-party ads or analytics.</p>
            <details className="text-xs text-muted-foreground sm:col-span-2">
              <summary className="cursor-pointer font-medium text-foreground">Legacy Google AdSense settings</summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-medium">Publisher ID<input name="adsense_publisher_id" placeholder="ca-pub-0000000000000000" defaultValue={String(settings.adsense_publisher_id ?? '')} className={inputClass} /></label>
                <label className="text-xs font-medium">Listing page slot ID<input name="listing_ad_slot_id" inputMode="numeric" defaultValue={String(settings.listing_ad_slot_id ?? '')} className={inputClass} /></label>
                <label className="text-xs font-medium">Prompt page slot ID (placement 2)<input name="prompt_ad_slot_id" inputMode="numeric" defaultValue={String(settings.prompt_ad_slot_id ?? '')} className={inputClass} /></label>
              </div>
            </details>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Social profiles</h2><p className="mt-1 text-xs text-muted-foreground">Only configured links should be shown publicly.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ['social_x', 'X profile URL'], ['social_instagram', 'Instagram profile URL'], ['social_youtube', 'YouTube channel URL'],
              ['social_pinterest', 'Pinterest profile URL'], ['social_facebook', 'Facebook page URL'],
            ].map(([name, label]) => <label key={name} className="text-xs font-medium">{label}<input type="url" name={name} defaultValue={String(settings[name] ?? '')} className={inputClass} /></label>)}
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Content defaults</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium">Maximum example images<input name="max_images" type="number" min="1" max="5" value="5" readOnly className={`${inputClass} bg-background`} /><span className="mt-1 block text-[10px] font-normal text-muted-foreground">The platform enforces a hard limit of five.</span></label>
            <label className="text-xs font-medium">Maximum image size<input value="5 MB" readOnly className={`${inputClass} bg-background`} /><span className="mt-1 block text-[10px] font-normal text-muted-foreground">File limit currently enforced by Storage policy.</span></label>
          </div>
        </section>
        <div className="sticky bottom-0 flex justify-end border-t border-border bg-background/95 py-3 backdrop-blur"><button className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-white">Save settings</button></div>
      </form>
    </div>
  )
}
