'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePlus } from 'lucide-react'
import { saveBrandAssetAction } from '@/app/admin/actions'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function BrandAssetUpload({
  asset,
  currentUrl,
}: {
  asset: 'logo' | 'favicon'
  currentUrl?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const label = asset === 'logo' ? 'Site logo' : 'Favicon'

  async function upload(file?: File) {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const acceptedTypes = asset === 'logo'
        ? ['image/png', 'image/jpeg', 'image/webp']
        : ['image/png', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
      if (!acceptedTypes.includes(file.type)) {
        throw new Error(asset === 'logo'
          ? 'Choose a PNG, JPEG, or WebP logo.'
          : 'Choose a PNG, WebP, or ICO favicon.')
      }
      if (file.size > 2 * 1024 * 1024) throw new Error('File must be 2 MB or smaller.')
      const supabase = createSupabaseBrowserClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Your session expired. Sign in again and retry.')
      const extension = asset === 'favicon' && file.type.includes('icon')
        ? 'ico'
        : file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
      const path = `branding/${user.id}/${asset}-${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('site-assets').upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      await saveBrandAssetAction(asset, path)
      router.refresh()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload the file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt={`${label} preview`} className="max-h-full max-w-full object-contain" />
          ) : <ImagePlus size={18} className="text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">{label}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {asset === 'logo' ? 'PNG, JPEG, or WebP · up to 2 MB' : 'PNG, WebP, or ICO · up to 2 MB'}
          </p>
          <label className="mt-2 inline-flex h-8 cursor-pointer items-center rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted has-[:disabled]:opacity-60">
            {busy ? 'Uploading…' : currentUrl ? 'Replace file' : `Upload ${asset}`}
            <input
              type="file"
              accept={asset === 'logo' ? 'image/png,image/jpeg,image/webp' : 'image/png,image/webp,image/x-icon,.ico'}
              disabled={busy}
              onChange={(event) => {
                void upload(event.currentTarget.files?.[0])
                event.currentTarget.value = ''
              }}
              className="sr-only"
            />
          </label>
        </div>
      </div>
      {error ? <p role="alert" className="mt-3 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
