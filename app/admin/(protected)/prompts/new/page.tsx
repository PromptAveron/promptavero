import Link from 'next/link'
import { savePromptAction } from '@/app/admin/actions'
import { PromptEditor } from '@/app/admin/prompt-editor'
import { requireAdmin } from '@/lib/supabase/admin'

export default async function NewPromptPage() {
  const { supabase } = await requireAdmin()
  const { data: categories, error } = await supabase.from('categories').select('*').order('sort_order')
  if (error) throw new Error(`Could not load categories: ${error.message}`)
  return categories?.length ? <PromptEditor categories={categories} saveAction={savePromptAction} /> : (
    <div className="mx-auto max-w-xl pt-12 md:pt-0">
      <h1 className="text-2xl font-semibold">Create a category first</h1>
      <p className="mt-2 text-sm text-muted-foreground">Prompts need a primary category before they can be saved.</p>
      <Link href="/admin/categories/" className="mt-4 inline-block text-sm underline underline-offset-4">Manage categories</Link>
    </div>
  )
}
