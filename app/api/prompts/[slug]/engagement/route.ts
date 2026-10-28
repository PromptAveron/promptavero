import { NextResponse } from 'next/server'
import { createSupabasePublicClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = createSupabasePublicClient()
  const { data: prompt, error } = await supabase
    .from('prompts')
    .select('id,like_count,copy_count,category_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    console.error('Could not load prompt engagement counts.', error)
    return NextResponse.json({ error: 'Could not load prompt counts.' }, { status: 500 })
  }
  if (!prompt) return NextResponse.json({ error: 'Prompt not found.' }, { status: 404 })

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('id', prompt.category_id)
    .eq('is_published', true)
    .maybeSingle()

  if (categoryError) {
    console.error('Could not verify the prompt category for engagement counts.', categoryError)
    return NextResponse.json({ error: 'Could not load prompt counts.' }, { status: 500 })
  }
  if (!category) return NextResponse.json({ error: 'Prompt not found.' }, { status: 404 })

  return NextResponse.json(
    { likeCount: prompt.like_count, copyCount: prompt.copy_count },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
