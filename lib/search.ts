import type { PromptSummary } from '@/lib/content'

export type SortOption = 'newest' | 'oldest' | 'featured'

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'featured', label: 'Featured first' },
]

export interface ExploreFilters {
  search: string
  category: string
  tag: string
  featured: boolean
  sort: SortOption
  page: number
}

export const DEFAULT_FILTERS: ExploreFilters = {
  search: '',
  category: '',
  tag: '',
  featured: false,
  sort: 'newest',
  page: 1,
}

export function parseFilters(params: URLSearchParams): ExploreFilters {
  const sort = params.get('sort')
  const page = Number.parseInt(params.get('page') ?? '1', 10)
  return {
    search: (params.get('search') ?? '').trim(),
    category: params.get('category') ?? '',
    tag: params.get('tag') ?? '',
    featured: params.get('featured') === '1',
    sort: sort === 'oldest' || sort === 'featured' ? sort : 'newest',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export function buildQuery(filters: Partial<ExploreFilters>): string {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.tag) params.set('tag', filters.tag)
  if (filters.featured) params.set('featured', '1')
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort)
  if (filters.page && filters.page > 1) params.set('page', String(filters.page))
  const query = params.toString()
  return query ? `?${query}` : ''
}

function relevance(summary: PromptSummary, tokens: string[]): number {
  let score = 0
  for (const token of tokens) {
    if (summary.titleLower.includes(token)) score += 5
    if (summary.tags.some((tag) => tag.replace(/-/g, ' ').includes(token))) score += 3
    if (summary.categoryName.toLowerCase().includes(token)) score += 2
    score += 1
  }
  return score
}

export function filterPrompts(items: PromptSummary[], filters: ExploreFilters): PromptSummary[] {
  const tokens = filters.search.toLowerCase().split(/\s+/).filter(Boolean)

  let result = items.filter((item) => {
    if (filters.category && item.categorySlug !== filters.category) return false
    if (filters.tag && !item.tags.includes(filters.tag)) return false
    if (filters.featured && !item.isFeatured) return false
    return tokens.every((token) => item.haystack.includes(token))
  })

  const byDate = (a: PromptSummary, b: PromptSummary) => b.publishedAt.localeCompare(a.publishedAt)

  if (filters.sort === 'oldest') {
    result = [...result].sort((a, b) => -byDate(a, b))
  } else if (filters.sort === 'featured') {
    result = [...result].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || byDate(a, b))
  } else if (tokens.length > 0) {
    result = [...result].sort((a, b) => relevance(b, tokens) - relevance(a, tokens) || byDate(a, b))
  } else {
    result = [...result].sort(byDate)
  }
  return result
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const start = (currentPage - 1) * pageSize
  return { items: items.slice(start, start + pageSize), currentPage, totalPages }
}
