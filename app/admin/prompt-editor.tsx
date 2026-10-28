'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ImageManager } from '@/components/admin/image-manager'
import type { Database } from '@/types/database'

type PromptRecord = Database['public']['Tables']['prompts']['Row']
type CategoryRecord = Database['public']['Tables']['categories']['Row']

const AI_MODELS = [
  'Midjourney',
  'ChatGPT/DALL-E',
  'Gemini/Nanobanana',
  'Adobe Firefly',
  'Ideogram',
  'Recraft',
  'Stable Diffusion',
  'FLUX',
] as const

const ART_STYLES = [
  'Oil Painting',
  'Watercolor',
  'Gouache',
  'Impressionism',
  'Surrealism',
  'Cubism',
  'Art Nouveau',
  'Art Deco',
  'Pencil Drawing',
  'Charcoal Sketch',
  'Ink Illustration',
  'Comic Book',
  'Vintage Propaganda Poster',
  'Pixel Art',
  'Anime',
  'Chibi',
  'Cel-Shaded 2D',
  'Studio Ghibli-Inspired',
  'Cyberpunk',
  'Synthwave',
  'Steampunk',
  'Retro-Futurism',
  '3D Render',
  'Photorealistic',
  'Cinematic Film Still',
  'Black and White',
  'Macro',
] as const

const USE_CASES = [
  'Social Media Content',
  'Marketing & Advertising',
  'Branding & Identity',
  'E-commerce & Product Listings',
  'Website & Blog Visuals',
  'Editorial & Publishing',
  'Portrait & Lifestyle Photography',
  'Fashion & Beauty',
  'Concept Art & Game Design',
  'Book & Album Covers',
  'Film & Storyboards',
  'Presentations & Education',
  'Print & Merchandise',
  'Interior & Architecture',
  'Personal Art & Inspiration',
] as const

function SaveButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending} className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-60">{pending ? 'Saving…' : 'Save prompt'}</button>
}

function Field({ label, name, defaultValue = '', required = false, hint, type = 'text' }: {
  label: string
  name: string
  defaultValue?: string | null
  required?: boolean
  hint?: string
  type?: string
}) {
  return (
    <label className="block text-xs font-medium text-foreground">
      {label}{required ? ' *' : ''}
      <input type={type} name={name} required={required} defaultValue={defaultValue ?? ''} className="mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-sm font-normal text-foreground outline-none focus:border-primary" />
      {hint ? <span className="mt-1 block text-[11px] font-normal text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

function TextField({ label, name, defaultValue = '', rows = 4, required = false }: {
  label: string
  name: string
  defaultValue?: string | null
  rows?: number
  required?: boolean
}) {
  const [count, setCount] = useState((defaultValue ?? '').length)
  return (
    <label className="block text-xs font-medium text-foreground">
      {label}{required ? ' *' : ''}
      <textarea name={name} required={required} rows={rows} defaultValue={defaultValue ?? ''} onChange={(event) => setCount(event.target.value.length)} className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm font-normal leading-relaxed text-foreground outline-none focus:border-primary" />
      {name === 'prompt_text' ? <span className="mt-1 block text-right text-[11px] font-normal text-muted-foreground">{count.toLocaleString()} characters</span> : null}
    </label>
  )
}

export function PromptEditor({ prompt, categories, saveAction, saved = false }: {
  prompt?: PromptRecord
  categories: CategoryRecord[]
  saveAction: (formData: FormData) => void | Promise<void>
  saved?: boolean
}) {
  const [slug, setSlug] = useState(prompt?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(prompt?.slug))
  const [title, setTitle] = useState(prompt?.title ?? '')
  const [status, setStatus] = useState(prompt?.status === 'published' ? 'published' : 'draft')
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    if (!dirty) return
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeave)
    return () => window.removeEventListener('beforeunload', warnBeforeLeave)
  }, [dirty])
  function updateTitle(nextTitle: string) {
    setTitle(nextTitle)
    if (!slugTouched) setSlug(nextTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }
  return (
    <div className="mx-auto max-w-5xl">
      {prompt ? <ImageManager promptId={prompt.id} /> : (
        <p className="mb-5 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground">Save the prompt first. You can then upload up to five example images in its editor.</p>
      )}
      {saved ? <p role="status" className="mb-4 rounded-md bg-green-50 px-3 py-2 text-xs text-green-800">Prompt saved.</p> : null}
      <form action={saveAction} onChange={() => setDirty(true)}>
      <input type="hidden" name="id" value={prompt?.id ?? ''} />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="pt-10 md:pt-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Prompt library</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{prompt ? 'Edit prompt' : 'New prompt'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {prompt ? <Link href={`/admin/prompts/${prompt.id}/preview/`} className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-xs font-medium">Preview</Link> : null}
          <select name="status" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Publication status" className="h-9 rounded-md border border-border bg-card px-3 text-xs">
            <option value="draft">Draft</option><option value="published">Published</option>
          </select>
          <SaveButton />
        </div>
      </header>
      <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Basic information</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-foreground sm:col-span-2">Title *
            <input name="title" required value={title} onChange={(event) => updateTitle(event.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-sm font-normal outline-none focus:border-primary" />
          </label>
          <label className="block text-xs font-medium text-foreground">URL slug *
            <input name="slug" required value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value) }} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 font-mono text-sm font-normal outline-none focus:border-primary" />
          </label>
          <label className="block text-xs font-medium text-foreground">Primary category *
            <select name="category_id" required defaultValue={prompt?.category_id ?? ''} className="mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-sm font-normal">
              <option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <TextField label="Short description *" name="excerpt" rows={2} required defaultValue={prompt?.excerpt} />
          <Field label="Tags" name="tags" defaultValue={prompt?.tags.join(', ')} hint="Comma-separated, e.g. portrait, editorial" />
          <div className="sm:col-span-2"><TextField label="Full prompt text *" name="prompt_text" rows={9} required defaultValue={prompt?.prompt_text} /></div>
          <div className="sm:col-span-2"><TextField label="Generation instructions" name="instructions" defaultValue={prompt?.instructions} /></div>
          <div className="sm:col-span-2"><TextField label="Personalization tips" name="personalization_tips" defaultValue={prompt?.personalization_tips} /></div>
          <div className="sm:col-span-2"><TextField label="Expected result" name="expected_result" rows={2} defaultValue={prompt?.expected_result} /></div>
        </div>
      </section>
      {prompt ? <p className="mt-4 text-[11px] text-muted-foreground">Created {new Date(prompt.created_at).toLocaleDateString()} · Last updated {new Date(prompt.updated_at).toLocaleDateString()}</p> : null}
      <section className="mt-4 rounded-lg border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Prompt metadata</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs font-medium text-foreground">AI Model
            <select name="model_name" defaultValue={prompt?.model_name ?? ''} className="mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-sm font-normal">
              <option value="">Select an AI model</option>
              {prompt?.model_name && !AI_MODELS.includes(prompt.model_name as (typeof AI_MODELS)[number])
                ? <option value={prompt.model_name}>{prompt.model_name} (existing)</option>
                : null}
              {AI_MODELS.map((model) => <option key={model} value={model}>{model}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-foreground">Art style
            <select name="art_style" defaultValue={prompt?.art_style ?? ''} className="mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-sm font-normal">
              <option value="">Select an art style</option>
              {prompt?.art_style && !ART_STYLES.includes(prompt.art_style as (typeof ART_STYLES)[number])
                ? <option value={prompt.art_style}>{prompt.art_style} (existing)</option>
                : null}
              {ART_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-foreground">Aspect ratio
            <select name="aspect_ratio" defaultValue={prompt?.aspect_ratio ?? ''} className="mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-sm font-normal">
              <option value="">Select an aspect ratio</option>
              {prompt?.aspect_ratio && !['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'].includes(prompt.aspect_ratio)
                ? <option value={prompt.aspect_ratio}>{prompt.aspect_ratio} (existing)</option>
                : null}
              {['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'].map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-foreground">Intended use case
            <select name="use_case" defaultValue={prompt?.use_case ?? ''} className="mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-sm font-normal">
              <option value="">Select an intended use case</option>
              {prompt?.use_case && !USE_CASES.includes(prompt.use_case as (typeof USE_CASES)[number])
                ? <option value={prompt.use_case}>{prompt.use_case} (existing)</option>
                : null}
              {USE_CASES.map((useCase) => <option key={useCase} value={useCase}>{useCase}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 pt-6 text-xs font-medium"><input type="checkbox" name="is_featured" defaultChecked={prompt?.is_featured} className="size-4 accent-primary" /> Feature this prompt</label>
        </div>
      </section>
      <section className="mt-4 rounded-lg border border-border bg-card p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Search appearance</h2>
        <p className="mt-1 text-xs text-muted-foreground">Search title and description fall back to the prompt title and short description when empty.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="SEO title" name="seo_title" defaultValue={prompt?.seo_title} />
          <Field label="Meta description" name="meta_description" defaultValue={prompt?.meta_description} />
          <Field label="Canonical URL" name="canonical_url" type="url" defaultValue={prompt?.canonical_url} />
          <Field label="Open Graph title" name="og_title" defaultValue={prompt?.og_title} />
          <Field label="Open Graph description" name="og_description" defaultValue={prompt?.og_description} />
          <Field label="Social image URL" name="og_image_url" type="url" defaultValue={prompt?.og_image_url} />
          <label className="block text-xs font-medium">Indexing preference
            <select name="indexing_preference" defaultValue={prompt?.indexing_preference ?? 'index'} className="mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-sm font-normal"><option value="index">Index</option><option value="noindex">No index</option></select>
          </label>
        </div>
      </section>
      <div className="sticky bottom-0 z-10 mt-5 flex justify-end border-t border-border bg-background/95 py-3 backdrop-blur">
        <SaveButton />
      </div>
      </form>
    </div>
  )
}
