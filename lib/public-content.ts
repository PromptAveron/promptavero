import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { categories as localCategories, prompts as localPrompts, type PromptSummary } from '@/lib/content'
import { createSupabasePublicClient, hasSupabaseConfig } from '@/lib/supabase/server'
import { withFallback } from '@/lib/with-fallback'
import type { Category, Prompt, PromptImage } from '@/types/content'

export interface PublicContent {
  categories: Category[]
  prompts: Prompt[]
}

async function loadPublicContent(): Promise<PublicContent> {
  if (!hasSupabaseConfig()) return { categories: localCategories, prompts: localPrompts }

  const supabase = createSupabasePublicClient()
  const [categoryResult, promptResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id,name,slug,description,image_url,seo_title,meta_description,is_published,sort_order')
      .eq('is_published', true)
      .order('sort_order')
      .order('name'),
    supabase
      .from('prompts')
      .select('id,title,slug,excerpt,prompt_text,instructions,personalization_tips,expected_result,category_id,tags,is_featured,art_style,use_case,aspect_ratio,resolution,difficulty,language,model_name,like_count,copy_count,seo_title,meta_description,canonical_url,og_title,og_description,og_image_url,indexing_preference,published_at,created_at,updated_at')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false }),
  ])
  if (categoryResult.error) throw new Error(`Could not load public categories: ${categoryResult.error.message}`)
  if (promptResult.error) throw new Error(`Could not load public prompts: ${promptResult.error.message}`)

  const visibleCategories = categoryResult.data ?? []
  const categoryById = new Map(visibleCategories.map((category) => [category.id, category]))
  const promptRows = (promptResult.data ?? []).filter((prompt) => categoryById.has(prompt.category_id))
  const promptIds = promptRows.map((prompt) => prompt.id)
  const imageResult = promptIds.length
    ? await supabase
      .from('prompt_images')
      .select('prompt_id,storage_path,alt_text,width,height,sort_order,is_primary,caption')
      .in('prompt_id', promptIds)
      .order('sort_order')
    : { data: [], error: null }
  if (imageResult.error) throw new Error(`Could not load public prompt images: ${imageResult.error.message}`)

  const imagesByPrompt = new Map<string, PromptImage[]>()
  for (const image of imageResult.data ?? []) {
    const { data: urlData } = supabase.storage.from('prompt-images').getPublicUrl(image.storage_path)
    const entry: PromptImage = {
      src: urlData.publicUrl,
      alt: image.alt_text,
      width: image.width ?? 1200,
      height: image.height ?? 1600,
      order: image.sort_order + 1,
      isPrimary: image.is_primary,
      ...(image.caption ? { caption: image.caption } : {}),
    }
    imagesByPrompt.set(image.prompt_id, [...(imagesByPrompt.get(image.prompt_id) ?? []), entry])
  }

  const mappedCategories: Category[] = visibleCategories.map((category) => ({
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image_url ?? '/placeholder.jpg',
    ...(category.seo_title ? { seoTitle: category.seo_title } : {}),
    ...(category.meta_description ? { seoDescription: category.meta_description } : {}),
    isVisible: category.is_published,
    displayOrder: category.sort_order,
  }))
  const mappedPrompts: Prompt[] = promptRows.flatMap((row) => {
    const category = categoryById.get(row.category_id)
    const images = (imagesByPrompt.get(row.id) ?? []).sort((a, b) => a.order - b.order)
    const primaryIndex = images.findIndex((image) => image.isPrimary)
    if (primaryIndex > 0) images.unshift(...images.splice(primaryIndex, 1))
    if (!category) return []
    return [{
      id: row.id,
      title: row.title,
      slug: row.slug,
      shortDescription: row.excerpt,
      promptText: row.prompt_text,
      ...(row.instructions ? { instructions: row.instructions } : {}),
      ...(row.personalization_tips ? { personalizationTips: row.personalization_tips } : {}),
      ...(row.expected_result ? { expectedResult: row.expected_result } : {}),
      categorySlug: category.slug,
      tags: row.tags ?? [],
      images: images.length ? images : [{
        src: '/placeholder.svg',
        alt: `${row.title} preview`,
        width: 1200,
        height: 1600,
        order: 1,
        isPrimary: true,
      }],
      isFeatured: row.is_featured,
      status: 'published',
      likeCount: row.like_count,
      copyCount: row.copy_count,
      engagementEnabled: true,
      ...(row.art_style ? { imageStyle: row.art_style } : {}),
      ...(row.use_case ? { promptType: row.use_case } : {}),
      ...(row.aspect_ratio ? { aspectRatio: row.aspect_ratio } : {}),
      ...(row.resolution ? { resolution: row.resolution } : {}),
      ...(row.difficulty ? { difficulty: row.difficulty } : {}),
      ...(row.language ? { language: row.language } : {}),
      ...(row.model_name ? { aiModel: row.model_name } : {}),
      ...(row.seo_title ? { seoTitle: row.seo_title } : {}),
      ...(row.meta_description ? { seoDescription: row.meta_description } : {}),
      ...(row.canonical_url ? { canonicalUrl: row.canonical_url } : {}),
      ...(row.og_title ? { ogTitle: row.og_title } : {}),
      ...(row.og_description ? { ogDescription: row.og_description } : {}),
      ...(row.og_image_url ? { ogImageUrl: row.og_image_url } : {}),
      ...(row.indexing_preference === 'noindex' ? { indexingPreference: 'noindex' as const } : {}),
      publishedAt: row.published_at ?? row.created_at,
      updatedAt: row.updated_at,
    }]
  })
  return { categories: mappedCategories, prompts: mappedPrompts }
}

const getCachedPublicContent = unstable_cache(loadPublicContent, ['public-content-v1'], {
  tags: ['public-content'],
  revalidate: 300,
})

export const getPublicContent = cache(async (): Promise<PublicContent> => {
  const localContent = { categories: localCategories, prompts: localPrompts }
  if (!hasSupabaseConfig()) return localContent
  return withFallback(getCachedPublicContent(), localContent)
})

export function toPublicSummary(prompt: Prompt, categories: Category[]): PromptSummary {
  const category = categories.find((item) => item.slug === prompt.categorySlug)
  const image = prompt.images.find((item) => item.isPrimary) ?? prompt.images[0]
  return {
    id: prompt.id,
    slug: prompt.slug,
    title: prompt.title,
    shortDescription: prompt.shortDescription,
    categorySlug: prompt.categorySlug,
    categoryName: category?.name ?? '',
    tags: prompt.tags,
    isFeatured: prompt.isFeatured,
    likeCount: prompt.likeCount ?? 0,
    engagementEnabled: prompt.engagementEnabled ?? false,
    publishedAt: prompt.publishedAt,
    image: { src: image.src, alt: image.alt, width: image.width, height: image.height },
    titleLower: prompt.title.toLowerCase(),
    haystack: [prompt.title, prompt.shortDescription, prompt.promptText, category?.name ?? '', prompt.imageStyle ?? '', prompt.tags.join(' ').replace(/-/g, ' ')].join(' ').toLowerCase(),
  }
}

export function getPublicCategoryPrompts(content: PublicContent, slug: string) {
  return content.prompts.filter((prompt) => prompt.categorySlug === slug)
}

export function getPublicCategoryCount(content: PublicContent, slug: string) {
  return getPublicCategoryPrompts(content, slug).length
}

export function getPopulatedPublicCategories(content: PublicContent) {
  return content.categories.filter((category) => getPublicCategoryCount(content, category.slug) > 0)
}

export function getPublicTags(content: PublicContent) {
  const counts = new Map<string, number>()
  for (const prompt of content.prompts) for (const tag of prompt.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return [...counts.entries()].map(([slug, count]) => ({
    slug,
    label: slug.split('-').map((word) => word ? word[0].toUpperCase() + word.slice(1) : '').join(' '),
    count,
  })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function getRelatedPublicPrompts(content: PublicContent, prompt: Prompt, limit = 6) {
  const tags = new Set(prompt.tags)
  return content.prompts.filter((item) => item.id !== prompt.id).map((candidate) => ({
    candidate,
    score: (candidate.categorySlug === prompt.categorySlug ? 10 : 0)
      + candidate.tags.filter((tag) => tags.has(tag)).length * 3
      + (candidate.isFeatured ? 0.5 : 0),
  })).sort((a, b) => b.score - a.score || b.candidate.publishedAt.localeCompare(a.candidate.publishedAt))
    .slice(0, limit).map(({ candidate }) => candidate)
}

export function getRelatedPublicCategories(content: PublicContent, slug: string, limit = 4) {
  return getPopulatedPublicCategories(content).filter((category) => category.slug !== slug).slice(0, limit)
}

export function getPrimaryPublicImage(prompt: Prompt) {
  return prompt.images.find((image) => image.isPrimary) ?? prompt.images[0]
}
