import { deleteCategoryAction, saveCategoryAction } from '@/app/admin/actions'
import { ConfirmSubmit } from '@/components/admin/confirm-submit'
import { requireAdmin } from '@/lib/supabase/admin'

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; saved?: string; deleted?: string }>
}) {
  const { q = '', saved, deleted } = await searchParams
  const { supabase } = await requireAdmin()
  let query = supabase.from('categories').select('*').order('sort_order').order('name')
  if (q.trim()) query = query.ilike('name', `%${q.trim().replace(/[%_]/g, '')}%`)
  const { data: categories, error } = await query
  if (error) throw new Error(`Could not load categories: ${error.message}`)
  const ids = (categories ?? []).map((category) => category.id)
  const promptsResult = ids.length
    ? await supabase.from('prompts').select('category_id,status').in('category_id', ids)
    : { data: [], error: null }
  if (promptsResult.error) throw new Error(`Could not count categorized prompts: ${promptsResult.error.message}`)
  const counts = new Map<string, number>()
  for (const prompt of promptsResult.data ?? []) if (prompt.status === 'published') counts.set(prompt.category_id, (counts.get(prompt.category_id) ?? 0) + 1)

  return (
    <div className="mx-auto max-w-6xl pt-10 md:pt-0">
      <header><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Organization</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Categories</h1><p className="mt-2 text-sm text-muted-foreground">{categories?.length ?? 0} categories</p></header>
      {saved ? <p role="status" className="mt-4 rounded-md bg-green-50 px-3 py-2 text-xs text-green-800">Category saved.</p> : null}
      {deleted ? <p role="status" className="mt-4 rounded-md bg-green-50 px-3 py-2 text-xs text-green-800">Category deleted.</p> : null}
      <form className="mt-5 flex gap-2"><label className="sr-only" htmlFor="category-search">Search categories</label><input id="category-search" name="q" defaultValue={q} placeholder="Search categories" className="h-9 w-full max-w-sm rounded-md border border-border px-3 text-xs" /><button className="h-9 rounded-md border border-border px-3 text-xs">Search</button></form>
      <section className="mt-5 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Add category</h2>
        <form action={saveCategoryAction} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium">Name<input name="name" required className="mt-1.5 h-9 w-full rounded-md border border-border px-3 text-sm font-normal" /></label>
          <label className="text-xs font-medium">Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-1.5 h-9 w-full rounded-md border border-border px-3 font-mono text-sm font-normal" /></label>
          <label className="text-xs font-medium">Display order<input name="sort_order" type="number" min="0" defaultValue="0" className="mt-1.5 h-9 w-full rounded-md border border-border px-3 text-sm font-normal" /></label>
          <label className="flex items-center gap-2 pt-6 text-xs"><input name="is_published" type="checkbox" defaultChecked className="size-4 accent-primary" />Visible on public site</label>
          <label className="text-xs font-medium sm:col-span-2">Cover image URL<input name="image_url" type="url" className="mt-1.5 h-9 w-full rounded-md border border-border px-3 text-sm font-normal" /></label>
          <label className="text-xs font-medium sm:col-span-2 lg:col-span-4">Description<textarea name="description" rows={2} className="mt-1.5 w-full rounded-md border border-border px-3 py-2 text-sm font-normal" /></label>
          <label className="text-xs font-medium">SEO title<input name="seo_title" className="mt-1.5 h-9 w-full rounded-md border border-border px-3 text-sm font-normal" /></label>
          <label className="text-xs font-medium">Meta description<input name="meta_description" className="mt-1.5 h-9 w-full rounded-md border border-border px-3 text-sm font-normal" /></label>
          <div className="flex items-end"><button className="h-9 rounded-md bg-primary px-4 text-xs font-medium text-white">Add category</button></div>
        </form>
      </section>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-muted/50 text-[10px] uppercase tracking-[0.1em] text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Name / Slug</th><th className="px-4 py-3 font-medium">Published prompts</th><th className="px-4 py-3 font-medium">Order</th><th className="px-4 py-3 font-medium">Visibility</th><th className="px-4 py-3 font-medium">Edit details</th><th className="px-4 py-3"></th></tr></thead>
          <tbody className="divide-y divide-[#ededea]">
            {categories?.map((category) => (
              <tr key={category.id} className="align-top">
                <td className="px-4 py-4"><p className="font-medium">{category.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">/{category.slug}</p></td>
                <td className="px-4 py-4">{counts.get(category.id) ?? 0}</td>
                <td className="px-4 py-4">{category.sort_order}</td>
                <td className="px-4 py-4">{category.is_published ? 'Visible' : 'Hidden'}</td>
                <td className="min-w-[420px] px-4 py-3">
                  <details><summary className="cursor-pointer text-muted-foreground underline underline-offset-2">Edit</summary>
                    <form action={saveCategoryAction} className="mt-3 grid grid-cols-2 gap-2 rounded bg-muted/50 p-3">
                      <input type="hidden" name="id" value={category.id} />
                      <label className="text-[10px]">Name<input name="name" required defaultValue={category.name} className="mt-1 h-8 w-full rounded border border-border bg-card px-2 text-xs" /></label>
                      <label className="text-[10px]">Slug<input name="slug" required defaultValue={category.slug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-1 h-8 w-full rounded border border-border bg-card px-2 font-mono text-xs" /></label>
                      <label className="text-[10px]">Display order<input name="sort_order" type="number" min="0" defaultValue={category.sort_order} className="mt-1 h-8 w-full rounded border border-border bg-card px-2 text-xs" /></label>
                      <label className="flex items-center gap-2 pt-5 text-[10px]"><input name="is_published" type="checkbox" defaultChecked={category.is_published} />Visible</label>
                      <label className="col-span-2 text-[10px]">Cover image URL<input name="image_url" type="url" defaultValue={category.image_url ?? ''} className="mt-1 h-8 w-full rounded border border-border bg-card px-2 text-xs" /></label>
                      <label className="col-span-2 text-[10px]">Description<textarea name="description" rows={2} defaultValue={category.description} className="mt-1 w-full rounded border border-border bg-card p-2 text-xs" /></label>
                      <label className="text-[10px]">SEO title<input name="seo_title" defaultValue={category.seo_title ?? ''} className="mt-1 h-8 w-full rounded border border-border bg-card px-2 text-xs" /></label>
                      <label className="text-[10px]">Meta description<input name="meta_description" defaultValue={category.meta_description ?? ''} className="mt-1 h-8 w-full rounded border border-border bg-card px-2 text-xs" /></label>
                      <button className="col-span-2 h-8 rounded bg-primary text-xs font-medium text-white">Save category</button>
                    </form>
                  </details>
                </td>
                <td className="px-4 py-4"><ConfirmSubmit action={deleteCategoryAction} fields={{ id: category.id }} label="Delete" confirmation={`Delete “${category.name}”? This is allowed only if no prompts are assigned to it.`} className="text-red-700 underline underline-offset-2" /></td>
              </tr>
            ))}
            {!categories?.length ? <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No categories found.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
