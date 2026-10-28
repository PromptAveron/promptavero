import promptsData from '@/data/prompts.json'
import categoriesData from '@/data/categories.json'
import {
  MAX_IMAGES_PER_PROMPT,
  type Category,
  type Prompt,
  type PromptImage,
  type Tag,
} from '@/types/content'

const rawPrompts = promptsData as unknown as Prompt[]
const rawCategories = categoriesData as unknown as Category[]

function normalizeImages(images: PromptImage[]): PromptImage[] {
  const sorted = [...images].sort((a, b) => a.order - b.order).slice(0, MAX_IMAGES_PER_PROMPT)
  const primaryIndex = sorted.findIndex((image) => image.isPrimary)
  if (primaryIndex > 0) {
    const [primary] = sorted.splice(primaryIndex, 1)
    sorted.unshift(primary)
  }
  return sorted
}

export const categories: Category[] = rawCategories
  .filter((category) => category.isVisible)
  .sort((a, b) => a.displayOrder - b.displayOrder)

const visibleCategorySlugs = new Set(categories.map((category) => category.slug))

export const prompts: Prompt[] = rawPrompts
  .filter(
    (prompt) =>
      prompt.status === 'published' &&
      prompt.images.length > 0 &&
      visibleCategorySlugs.has(prompt.categorySlug),
  )
  .map((prompt) => ({ ...prompt, images: normalizeImages(prompt.images) }))
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

export function getPromptBySlug(slug: string): Prompt | undefined {
  return prompts.find((prompt) => prompt.slug === slug)
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug)
}

export function getPromptsByCategory(categorySlug: string): Prompt[] {
  return prompts.filter((prompt) => prompt.categorySlug === categorySlug)
}

/** Categories with at least one published prompt (used for indexable pages). */
export const populatedCategories: Category[] = categories.filter(
  (category) => getPromptsByCategory(category.slug).length > 0,
)

export function getCategoryCount(categorySlug: string): number {
  return getPromptsByCategory(categorySlug).length
}

export function getFeaturedPrompts(limit?: number): Prompt[] {
  const featured = prompts.filter((prompt) => prompt.isFeatured)
  return typeof limit === 'number' ? featured.slice(0, limit) : featured
}

export function getLatestPrompts(limit?: number): Prompt[] {
  return typeof limit === 'number' ? prompts.slice(0, limit) : prompts
}

export function getPrimaryImage(prompt: Prompt): PromptImage {
  return prompt.images[0]
}

export function tagLabel(slug: string): string {
  return slug
    .split('-')
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')
}

export function getAllTags(): Tag[] {
  const counts = new Map<string, number>()
  for (const prompt of prompts) {
    for (const tag of prompt.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, label: tagLabel(slug), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function getRelatedPrompts(prompt: Prompt, limit = 6): Prompt[] {
  const tagSet = new Set(prompt.tags)
  const scored = prompts
    .filter((candidate) => candidate.id !== prompt.id)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) => tagSet.has(tag)).length
      const sameCategory = candidate.categorySlug === prompt.categorySlug ? 1 : 0
      return { candidate, score: sameCategory * 10 + sharedTags * 3 + (candidate.isFeatured ? 0.5 : 0) }
    })
    .sort(
      (a, b) =>
        b.score - a.score || b.candidate.publishedAt.localeCompare(a.candidate.publishedAt),
    )
  return scored.slice(0, limit).map((entry) => entry.candidate)
}

export function getRelatedCategories(categorySlug: string, limit = 4): Category[] {
  return populatedCategories.filter((category) => category.slug !== categorySlug).slice(0, limit)
}

export interface PromptSummary {
  id: string
  slug: string
  title: string
  shortDescription: string
  categorySlug: string
  categoryName: string
  tags: string[]
  isFeatured: boolean
  likeCount: number
  engagementEnabled: boolean
  publishedAt: string
  image: Pick<PromptImage, 'src' | 'alt' | 'width' | 'height'>
  /** Lower-cased text used by client-side search. */
  haystack: string
  titleLower: string
}

export function toSummary(prompt: Prompt): PromptSummary {
  const category = getCategoryBySlug(prompt.categorySlug)
  const image = getPrimaryImage(prompt)
  const categoryName = category?.name ?? ''
  return {
    id: prompt.id,
    slug: prompt.slug,
    title: prompt.title,
    shortDescription: prompt.shortDescription,
    categorySlug: prompt.categorySlug,
    categoryName,
    tags: prompt.tags,
    isFeatured: prompt.isFeatured,
    likeCount: prompt.likeCount ?? 0,
    engagementEnabled: prompt.engagementEnabled ?? false,
    publishedAt: prompt.publishedAt,
    image: { src: image.src, alt: image.alt, width: image.width, height: image.height },
    titleLower: prompt.title.toLowerCase(),
    haystack: [
      prompt.title,
      prompt.shortDescription,
      prompt.promptText,
      categoryName,
      prompt.imageStyle ?? '',
      prompt.tags.join(' ').replace(/-/g, ' '),
    ]
      .join(' ')
      .toLowerCase(),
  }
}

export function getAllSummaries(): PromptSummary[] {
  return prompts.map(toSummary)
}
