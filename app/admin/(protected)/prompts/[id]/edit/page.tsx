import { notFound } from 'next/navigation'
import { savePromptAction } from '@/app/admin/actions'
import { PromptEditor } from '@/app/admin/prompt-editor'
import { requireAdmin } from '@/lib/supabase/admin'

export default async function EditPromptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams])
  const { supabase } = await requireAdmin()
  const [promptResult, categoryResult] = await Promise.all([
    supabase.from('prompts').select('*').eq('id', id).single(),
    supabase.from('categories').select('*').order('sort_order'),
  ])
  if (promptResult.error?.code === 'PGRST116') notFound()
  if (promptResult.error) throw new Error(`Could not load prompt: ${promptResult.error.message}`)
  if (categoryResult.error) throw new Error(`Could not load categories: ${categoryResult.error.message}`)
  return <PromptEditor prompt={promptResult.data} categories={categoryResult.data ?? []} saveAction={savePromptAction} saved={saved === '1'} />
}
