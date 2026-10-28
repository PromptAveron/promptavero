import { saveSettingsAction } from '@/app/admin/actions'
import { requireAdmin } from '@/lib/supabase/admin'

function getSettings(value: unknown): Record<string, string | boolean | number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, string | boolean | number>
}

export default async function AdminSeoPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'seo').maybeSingle()
  if (error) throw new Error(`Could not load SEO settings: ${error.message}`)
  const settings = getSettings(data?.value)
  const inputClass = 'mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-sm font-normal outline-none focus:border-primary'
  return (
    <div className="mx-auto max-w-4xl pt-10 md:pt-0">
      <header><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Search visibility</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">SEO settings</h1><p className="mt-2 text-sm text-muted-foreground">Global defaults used when individual pages do not define their own metadata.</p></header>
      {saved ? <p role="status" className="mt-4 rounded-md bg-green-50 px-3 py-2 text-xs text-green-800">SEO settings saved.</p> : null}
      <form action={saveSettingsAction} className="mt-6 space-y-4">
        <input type="hidden" name="key" value="seo" />
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Default metadata</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-xs font-medium">Default SEO title<input name="default_seo_title" defaultValue={String(settings.default_seo_title ?? '')} maxLength={70} className={inputClass} /><span className="mt-1 block text-[10px] font-normal text-muted-foreground">Recommended: around 50–60 characters.</span></label>
            <label className="block text-xs font-medium">Default meta description<textarea name="default_meta_description" rows={3} maxLength={180} defaultValue={String(settings.default_meta_description ?? '')} className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-normal outline-none focus:border-primary" /><span className="mt-1 block text-[10px] font-normal text-muted-foreground">Recommended: around 150–160 characters.</span></label>
            <label className="block text-xs font-medium">Default social-sharing image URL<input type="url" name="default_og_image" defaultValue={String(settings.default_og_image ?? '')} className={inputClass} /></label>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Search engine visibility</h2>
          <p className="mt-1 text-xs text-muted-foreground">These values are saved as settings; application-wide sitemap and robots behavior remains governed by the deployed site configuration.</p>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="indexing_enabled" defaultChecked={settings.indexing_enabled !== false} className="size-4 accent-primary" />Allow public indexing by default</label>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="sitemap_enabled" defaultChecked={settings.sitemap_enabled !== false} className="size-4 accent-primary" />Enable sitemap</label>
          </div>
        </section>
        <div className="sticky bottom-0 flex justify-end border-t border-border bg-background/95 py-3 backdrop-blur"><button className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-white">Save SEO settings</button></div>
      </form>
    </div>
  )
}
