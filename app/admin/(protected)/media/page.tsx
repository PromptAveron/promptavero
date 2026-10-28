import { deletePromptImageAction, updateImageMetadataAction } from '@/app/admin/actions'
import { ConfirmSubmit } from '@/components/admin/confirm-submit'
import { requireAdmin } from '@/lib/supabase/admin'

export default async function AdminMediaPage() {
  const { supabase } = await requireAdmin()
  const { data: images, error } = await supabase.from('prompt_images').select('*').order('created_at', { ascending: false }).limit(100)
  if (error) throw new Error(`Could not load media: ${error.message}`)
  const promptIds = [...new Set((images ?? []).map((image) => image.prompt_id))]
  const promptsResult = promptIds.length ? await supabase.from('prompts').select('id,title,slug').in('id', promptIds) : { data: [], error: null }
  if (promptsResult.error) throw new Error(`Could not load image associations: ${promptsResult.error.message}`)
  const prompts = new Map((promptsResult.data ?? []).map((prompt) => [prompt.id, prompt]))
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) throw new Error('Supabase public URL is not configured.')

  return (
    <div className="mx-auto max-w-6xl pt-10 md:pt-0">
      <header><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Assets</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Media library</h1><p className="mt-2 text-sm text-muted-foreground">Latest 100 prompt images.</p></header>
      {!images?.length ? <div className="mt-6 rounded-lg border border-border bg-card px-5 py-14 text-center text-sm text-muted-foreground">No uploaded media yet. Images appear here when added to a prompt.</div> : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => {
            const prompt = prompts.get(image.prompt_id)
            const url = `${supabaseUrl}/storage/v1/object/public/prompt-images/${image.storage_path.split('/').map(encodeURIComponent).join('/')}`
            return (
              <article key={image.id} className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="h-48 bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={image.alt_text} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="truncate text-xs font-medium">{prompt?.title ?? 'Unassigned prompt'}{image.is_primary ? ' · Primary' : ''}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{image.mime_type} · {(image.file_size / 1024).toFixed(0)} KB · {new Date(image.created_at).toLocaleDateString()}</p>
                  {prompt ? <a href={`/prompts/${prompt.slug}/`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[10px] underline underline-offset-2">View public prompt</a> : null}
                  <div className="mt-3 space-y-2">
                  <form action={updateImageMetadataAction} className="space-y-2">
                    <input type="hidden" name="id" value={image.id} />
                    <label className="block text-[10px] font-medium">Alt text<input name="alt_text" defaultValue={image.alt_text} className="mt-1 h-8 w-full rounded border border-border px-2 text-xs font-normal" /></label>
                    <label className="block text-[10px] font-medium">Caption<input name="caption" defaultValue={image.caption ?? ''} className="mt-1 h-8 w-full rounded border border-border px-2 text-xs font-normal" /></label>
                    <button className="text-[10px] font-medium underline underline-offset-2">Save details</button>
                  </form>
                  <div className="mt-2 flex justify-end"><ConfirmSubmit action={deletePromptImageAction} fields={{ id: image.id }} label="Delete" confirmation="Remove this image from its prompt and delete its stored file?" className="text-[10px] text-red-700 underline underline-offset-2" /></div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
