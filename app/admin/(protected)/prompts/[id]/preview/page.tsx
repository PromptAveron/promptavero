import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/admin'

export const metadata = { robots: { index: false, follow: false } }

export default async function AdminPromptPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await requireAdmin()
  const [promptResult, imageResult] = await Promise.all([
    supabase.from('prompts').select('*').eq('id', id).single(),
    supabase.from('prompt_images').select('*').eq('prompt_id', id).order('sort_order'),
  ])
  if (promptResult.error?.code === 'PGRST116') notFound()
  if (promptResult.error) throw new Error(`Could not load preview: ${promptResult.error.message}`)
  if (imageResult.error) throw new Error(`Could not load preview images: ${imageResult.error.message}`)
  const { data: category, error: categoryError } = await supabase.from('categories').select('name').eq('id', promptResult.data.category_id).maybeSingle()
  if (categoryError) throw new Error(`Could not load preview category: ${categoryError.message}`)
  return (
    <article className="mx-auto max-w-4xl pt-10 md:pt-0">
      <div className="rounded-lg border border-dashed border-[#d8d8d0] bg-card px-4 py-3 text-xs text-muted-foreground">Private preview · Only authenticated administrators can access this page.</div>
      <p className="mt-7 text-xs font-medium text-muted-foreground">{category?.name ?? 'Uncategorized'} · {promptResult.data.status}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{promptResult.data.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{promptResult.data.excerpt}</p>
      {imageResult.data?.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{imageResult.data.map((image) => {
        const imageUrl = image.image_url
        return <div key={image.id} className="overflow-hidden rounded-lg border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={image.alt_text} className="aspect-[3/4] w-full object-cover" />
          {image.caption ? <p className="p-2 text-xs text-muted-foreground">{image.caption}</p> : null}
        </div>
      })}</div> : <p className="mt-6 rounded-lg bg-card p-5 text-sm text-muted-foreground">No example images are attached.</p>}
      <section className="mt-7 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Prompt text</h2><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{promptResult.data.prompt_text}</pre>
      </section>
    </article>
  )
}
