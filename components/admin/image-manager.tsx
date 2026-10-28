'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { deletePromptImageAction, movePromptImageAction, refreshPromptPublicContentAction, setPrimaryImageAction, updateImageMetadataAction } from '@/app/admin/actions'

type PromptImageRow = {
  id: string
  storage_path: string
  alt_text: string
  caption: string | null
  sort_order: number
  is_primary: boolean
  mime_type: string
  file_size: number
}

export function ImageManager({ promptId }: { promptId: string }) {
  const router = useRouter()
  const [images, setImages] = useState<PromptImageRow[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')

  async function loadImages() {
    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.from('prompt_images').select('*').eq('prompt_id', promptId).order('sort_order')
    if (error) throw new Error(`Could not load images: ${error.message}`)
    setImages(data ?? [])
  }

  useEffect(() => {
    let active = true
    const supabase = createSupabaseBrowserClient()
    void supabase.from('prompt_images').select('*').eq('prompt_id', promptId).order('sort_order')
      .then(({ data, error }) => {
        if (!active) return
        if (error) setMessage(`Could not load images: ${error.message}`)
        else setImages(data ?? [])
      })
    return () => { active = false }
  }, [promptId])

  async function uploadFiles(selectedFiles: FileList | null) {
    const files = Array.from(selectedFiles ?? [])
    if (!files.length) return
    setMessage('')
    setMessageType('error')
    setBusy(true)
    const supabase = createSupabaseBrowserClient()
    try {
      const { data: current, error: queryError } = await supabase.from('prompt_images').select('id,is_primary,sort_order').eq('prompt_id', promptId).order('sort_order')
      if (queryError) throw new Error(queryError.message)
      let currentCount = current.length
      if (currentCount + files.length > 5) throw new Error(`Only ${5 - currentCount} image slot(s) remain.`)
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use a JPEG, PNG, or WebP image.')
        if (file.size > 5 * 1024 * 1024) throw new Error('Each image must be 5 MB or smaller.')
        const bitmap = await createImageBitmap(file)
        const { width, height } = bitmap
        bitmap.close()
        const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
        const storagePath = `${promptId}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage.from('prompt-images').upload(storagePath, file, { contentType: file.type, upsert: false })
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
        const { error: insertError } = await supabase.from('prompt_images').insert({
          prompt_id: promptId,
          storage_path: storagePath,
          alt_text: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          sort_order: currentCount,
          is_primary: currentCount === 0,
          mime_type: file.type,
          file_size: file.size,
          width,
          height,
        })
        if (insertError) {
          await supabase.storage.from('prompt-images').remove([storagePath])
          throw new Error(`Image was uploaded but could not be added to the prompt: ${insertError.message}`)
        }
        currentCount += 1
      }
      await loadImages()
      await refreshPromptPublicContentAction(promptId)
      setMessage(`${files.length} image${files.length === 1 ? '' : 's'} uploaded.`)
      setMessageType('success')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The upload could not be completed.')
      try { await loadImages() } catch (refreshError) {
        setMessage(`${error instanceof Error ? error.message : 'Upload failed.'} ${refreshError instanceof Error ? refreshError.message : ''}`)
      }
    } finally {
      setBusy(false)
    }
  }

  const publicUrl = (path: string) => createSupabaseBrowserClient().storage.from('prompt-images').getPublicUrl(path).data.publicUrl

  return (
    <section
      className="mb-4 rounded-lg border border-border bg-card p-5 sm:p-6"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        void uploadFiles(event.dataTransfer.files)
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-sm font-semibold">Example images</h2><p className="mt-1 text-xs text-muted-foreground">{images.length} of 5 images · JPEG, PNG, or WebP · 5 MB max each</p></div>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-xs font-medium hover:bg-background has-[:disabled]:opacity-50">
          <ImagePlus size={15} /> {busy ? 'Uploading…' : 'Add images'}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || images.length >= 5} onChange={(event) => { void uploadFiles(event.target.files); event.currentTarget.value = '' }} className="sr-only" />
        </label>
      </div>
      {message ? <p role={messageType === 'success' ? 'status' : 'alert'} className={`mt-3 text-xs ${messageType === 'success' ? 'text-success' : 'text-red-700'}`}>{message}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <article key={image.id} className="overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicUrl(image.storage_path)} alt={image.alt_text} className="h-36 w-full bg-muted object-cover" />
            <form action={updateImageMetadataAction} className="space-y-2 p-3">
              <input type="hidden" name="id" value={image.id} />
              <label className="block text-[11px] font-medium">Alt text<input name="alt_text" defaultValue={image.alt_text} className="mt-1 h-8 w-full rounded border border-border px-2 text-xs font-normal" /></label>
              <label className="block text-[11px] font-medium">Caption<input name="caption" defaultValue={image.caption ?? ''} className="mt-1 h-8 w-full rounded border border-border px-2 text-xs font-normal" /></label>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">{image.is_primary ? 'Primary image' : `${(image.file_size / 1024).toFixed(0)} KB`}</span>
                <div className="flex items-center gap-1">
                  <button formAction={movePromptImageAction} name="direction" value="up" formNoValidate aria-label="Move image up" disabled={!index} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button formAction={movePromptImageAction} name="direction" value="down" formNoValidate aria-label="Move image down" disabled={index === images.length - 1} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ArrowDown size={14} /></button>
                  {!image.is_primary ? <button formAction={setPrimaryImageAction} aria-label="Set as primary image" className="rounded p-1 hover:bg-muted"><Star size={14} /></button> : null}
                  <button formAction={deletePromptImageAction} formNoValidate aria-label="Delete image" className="rounded p-1 text-red-700 hover:bg-red-50"><Trash2 size={14} /></button>
                  <button className="rounded border border-border px-2 py-1 text-[10px] hover:bg-muted">Save</button>
                </div>
              </div>
            </form>
          </article>
        ))}
      </div>
    </section>
  )
}
