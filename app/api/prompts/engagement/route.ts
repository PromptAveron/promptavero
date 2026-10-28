import { NextResponse } from 'next/server'
import { createSupabasePublicClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const maxSlugsPerRequest = 50

export async function GET(request: Request) {
  const slugs = [...new Set(new URL(request.url).searchParams.getAll('slug').filter(Boolean))]
  if (slugs.length === 0 || slugs.length > maxSlugsPerRequest || slugs.some((slug) => slug.length > 200)) {
    return NextResponse.json(
      { error: 'Provide between 1 and 50 prompt slugs, each no longer than 200 characters.' },
      { status: 400 },
    )
  }

  const supabase = createSupabasePublicClient()
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('slug,like_count,copy_count,category_id')
    .in('slug', slugs)
    .eq('status', 'published')
    .is('deleted_at', null)

  if (error) {
    console.error('Could not load prompt engagement counts.', error)
    return NextResponse.json({ error: 'Could not load prompt counts.' }, { status: 500 })
  }

  if (!prompts?.length) {
    return NextResponse.json(
      { counts: {} },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  }

  const categoryIds = [...new Set(prompts.map((prompt) => prompt.category_id))]
  const { data: categories, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .in('id', categoryIds)
    .eq('is_published', true)

  if (categoryError) {
    console.error('Could not verify prompt categories for engagement counts.', categoryError)
    return NextResponse.json({ error: 'Could not load prompt counts.' }, { status: 500 })
  }

  const publishedCategoryIds = new Set((categories ?? []).map((category) => category.id))
  const counts = Object.fromEntries(
    prompts
      .filter((prompt) => publishedCategoryIds.has(prompt.category_id))
      .map((prompt) => [prompt.slug, { likeCount: prompt.like_count, copyCount: prompt.copy_count }]),
  )

  return NextResponse.json(
    { counts },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
