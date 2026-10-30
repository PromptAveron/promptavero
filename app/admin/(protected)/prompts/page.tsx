import Link from 'next/link'
import { duplicatePromptAction, updatePromptStatusAction } from '@/app/admin/actions'
import { ConfirmSubmit } from '@/components/admin/confirm-submit'
import { requireAdmin } from '@/lib/supabase/admin'

const pageSize = 20

export default async function AdminPromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; featured?: string; page?: string; sort?: string }>
}) {
  const filters = await searchParams
  const page = Math.max(1, Number.parseInt(filters.page ?? '1', 10) || 1)
  const { supabase } = await requireAdmin()
  const [{ data: categories, error: categoriesError }, { count, error: countError }] = await Promise.all([
    supabase.from('categories').select('id,name').order('sort_order'),
    supabase.from('prompts').select('id', { count: 'exact', head: true }).neq('status', 'trashed'),
  ])
  if (categoriesError || countError) throw new Error(`Could not load prompts: ${categoriesError?.message ?? countError?.message}`)

  let query = supabase.from('prompts').select('id,title,slug,excerpt,status,is_featured,updated_at,category_id', { count: 'exact' }).neq('status', 'trashed')
  if (filters.q?.trim()) {
    const term = filters.q.trim().replace(/[,%()]/g, ' ')
    query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`)
  }
  if (filters.category) query = query.eq('category_id', filters.category)
  if (filters.status && ['draft', 'published', 'archived'].includes(filters.status)) query = query.eq('status', filters.status)
  if (filters.featured === 'true') query = query.eq('is_featured', true)
  if (filters.featured === 'false') query = query.eq('is_featured', false)
  const ordering = filters.sort === 'oldest' ? { column: 'created_at', ascending: true } : filters.sort === 'title' ? { column: 'title', ascending: true } : filters.sort === 'updated' ? { column: 'updated_at', ascending: false } : { column: 'created_at', ascending: false }
  const { data: prompts, count: filteredCount, error } = await query
    .order(ordering.column, { ascending: ordering.ascending })
    .range((page - 1) * pageSize, page * pageSize - 1)
  if (error) throw new Error(`Could not load prompts: ${error.message}`)
  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category.name]))
  const promptIds = (prompts ?? []).map((prompt) => prompt.id)
  const { data: promptImages, error: imageError } = promptIds.length
    ? await supabase.from('prompt_images').select('prompt_id,image_url,is_primary,sort_order').in('prompt_id', promptIds).order('sort_order')
    : { data: [], error: null }
  if (imageError) throw new Error(`Could not load prompt thumbnails: ${imageError.message}`)
  const thumbnails = new Map<string, string>()
  for (const image of promptImages ?? []) {
    if (!thumbnails.has(image.prompt_id) || image.is_primary) {
      thumbnails.set(image.prompt_id, image.image_url)
    }
  }
  const totalPages = Math.max(1, Math.ceil((filteredCount ?? 0) / pageSize))
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value && key !== 'page') params.set(key, value)

  return (
    <div className="mx-auto max-w-6xl pt-10 md:pt-0">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Content</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Prompts</h1><p className="mt-2 text-sm text-muted-foreground">{filteredCount ?? 0} prompts</p></div>
        <Link href="/admin/prompts/new/" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-medium text-white">New prompt</Link>
      </header>
      <form className="mt-6 grid gap-2 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-5">
        <input type="search" name="q" defaultValue={filters.q} placeholder="Search title or excerpt" className="h-9 rounded-md border border-border px-3 text-xs sm:col-span-2 lg:col-span-1" />
        <select name="category" defaultValue={filters.category ?? ''} className="h-9 rounded-md border border-border bg-card px-2 text-xs"><option value="">All categories</option>{categories?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="status" defaultValue={filters.status ?? ''} className="h-9 rounded-md border border-border bg-card px-2 text-xs"><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
        <select name="featured" defaultValue={filters.featured ?? ''} className="h-9 rounded-md border border-border bg-card px-2 text-xs"><option value="">All prompts</option><option value="true">Featured</option><option value="false">Not featured</option></select>
        <select name="sort" defaultValue={filters.sort ?? 'newest'} className="h-9 rounded-md border border-border bg-card px-2 text-xs"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="updated">Recently updated</option><option value="title">Title</option></select>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5"><button className="h-8 rounded-md border border-border px-3 text-xs font-medium">Apply filters</button><Link href="/admin/prompts/" className="flex h-8 items-center px-3 text-xs text-muted-foreground underline underline-offset-4">Clear filters</Link></div>
      </form>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-muted/50 text-[10px] uppercase tracking-[0.1em] text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Thumbnail</th><th className="px-4 py-3 font-medium">Title</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Featured</th><th className="px-4 py-3 font-medium">Updated</th><th className="px-4 py-3 font-medium">Actions</th></tr></thead>
          <tbody className="divide-y divide-[#ededea]">
            {prompts?.map((prompt) => (
              <tr key={prompt.id} className="hover:bg-muted/50">
                <td className="px-4 py-3.5">{thumbnails.get(prompt.id) ? <img src={thumbnails.get(prompt.id)} alt="" className="size-10 rounded object-cover" /> : <span className="block size-10 rounded bg-muted" />}</td>
                <td className="max-w-[300px] px-4 py-3.5"><Link className="block truncate font-medium hover:underline" href={`/admin/prompts/${prompt.id}/edit/`}>{prompt.title}</Link><span className="mt-1 block truncate text-[10px] text-muted-foreground">/{prompt.slug}</span></td>
                <td className="px-4 py-3.5 text-muted-foreground">{categoryMap.get(prompt.category_id) ?? '—'}</td>
                <td className="px-4 py-3.5"><span className="rounded-full bg-muted px-2 py-1 capitalize">{prompt.status}</span></td>
                <td className="px-4 py-3.5">{prompt.is_featured ? 'Yes' : '—'}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{new Date(prompt.updated_at).toLocaleDateString()}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/prompts/${prompt.id}/edit/`} className="font-medium underline underline-offset-2">Edit</Link>
                    {prompt.status === 'published' ? <Link href={`/prompts/${prompt.slug}/`} target="_blank" className="text-muted-foreground underline underline-offset-2">Preview</Link> : null}
                    <form action={duplicatePromptAction}><input type="hidden" name="id" value={prompt.id} /><button className="text-muted-foreground underline underline-offset-2">Duplicate</button></form>
                    <form action={updatePromptStatusAction}><input type="hidden" name="id" value={prompt.id} /><input type="hidden" name="status" value={prompt.status === 'published' ? 'draft' : 'published'} /><button className="text-muted-foreground underline underline-offset-2">{prompt.status === 'published' ? 'Unpublish' : 'Publish'}</button></form>
                    <ConfirmSubmit action={updatePromptStatusAction} fields={{ id: prompt.id, status: 'trashed' }} confirmation="Move this prompt to trash?" label="Trash" className="text-red-700 underline underline-offset-2" />
                  </div>
                </td>
              </tr>
            ))}
            {!prompts?.length ? <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No prompts match these filters.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>Page {page} of {totalPages} · {count ?? 0} total</span><div className="flex gap-2">
        {page > 1 ? <Link href={`/admin/prompts/?${new URLSearchParams([...params, ['page', String(page - 1)]]).toString()}`} className="rounded border border-border px-3 py-2">Previous</Link> : null}
        {page < totalPages ? <Link href={`/admin/prompts/?${new URLSearchParams([...params, ['page', String(page + 1)]]).toString()}`} className="rounded border border-border px-3 py-2">Next</Link> : null}
      </div></div>
    </div>
  )
}
