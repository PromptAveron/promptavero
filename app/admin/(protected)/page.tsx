import Link from 'next/link'
import { ArrowRight, FileText, Folder, Globe2, PencilLine } from 'lucide-react'
import { requireAdmin } from '@/lib/supabase/admin'

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin()
  const [total, published, drafts, categories, recent] = await Promise.all([
    supabase.from('prompts').select('id', { count: 'exact', head: true }).neq('status', 'trashed'),
    supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('prompts').select('id,title,slug,status,updated_at,category_id').neq('status', 'trashed').order('updated_at', { ascending: false }).limit(6),
  ])
  for (const result of [total, published, drafts, categories, recent]) {
    if (result.error) throw new Error(`Could not load dashboard data: ${result.error.message}`)
  }
  const categoryIds = [...new Set((recent.data ?? []).map((prompt) => prompt.category_id))]
  const categoryResult = categoryIds.length ? await supabase.from('categories').select('id,name').in('id', categoryIds) : { data: [], error: null }
  if (categoryResult.error) throw new Error(`Could not load categories: ${categoryResult.error.message}`)
  const categoryNames = new Map((categoryResult.data ?? []).map((category) => [category.id, category.name]))
  const stats = [
    { label: 'Total prompts', value: total.count ?? 0, icon: FileText },
    { label: 'Published', value: published.count ?? 0, icon: Globe2 },
    { label: 'Drafts', value: drafts.count ?? 0, icon: PencilLine },
    { label: 'Categories', value: categories.count ?? 0, icon: Folder },
  ]
  return (
    <div className="mx-auto max-w-6xl pt-10 md:pt-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">A quiet overview of your content library.</p>
        </div>
        <Link href="/admin/prompts/new/" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-medium text-white hover:bg-primary-hover">New prompt</Link>
      </div>
      <section aria-label="Content summary" className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground"><span className="text-xs">{label}</span><Icon size={16} /></div>
            <p className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{value.toLocaleString()}</p>
          </div>
        ))}
      </section>
      <section className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><h2 className="text-sm font-semibold">Recently edited</h2><p className="mt-1 text-xs text-muted-foreground">Your latest content updates</p></div>
          <Link href="/admin/prompts/" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-black">All prompts <ArrowRight size={14} /></Link>
        </div>
        {(recent.data ?? []).length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-[0.1em] text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Title</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Last updated</th><th className="px-5 py-3"></th></tr></thead>
              <tbody className="divide-y divide-[#ededea]">
                {(recent.data ?? []).map((prompt) => (
                  <tr key={prompt.id} className="hover:bg-muted/50">
                    <td className="max-w-[280px] truncate px-5 py-3.5 font-medium">{prompt.title}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{categoryNames.get(prompt.category_id) ?? '—'}</td>
                    <td className="px-4 py-3.5"><span className="rounded-full bg-muted px-2 py-1 capitalize">{prompt.status}</span></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{new Date(prompt.updated_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right"><Link href={`/admin/prompts/${prompt.id}/edit/`} aria-label={`Edit ${prompt.title}`} className="text-muted-foreground hover:text-black"><PencilLine size={15} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-14 text-center"><p className="text-sm font-medium">No prompts yet</p><p className="mt-1 text-xs text-muted-foreground">Create your first prompt to get started.</p><Link href="/admin/prompts/new/" className="mt-4 inline-block text-xs font-medium underline underline-offset-4">Create a prompt</Link></div>
        )}
      </section>
    </div>
  )
}
