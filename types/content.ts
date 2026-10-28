export const PROMPT_STATUSES = ['draft', 'published'] as const
export type PromptStatus = (typeof PROMPT_STATUSES)[number]

export const MAX_IMAGES_PER_PROMPT = 5

export interface PromptImage {
  /** Public path, e.g. /images/prompts/example-1.webp */
  src: string
  alt: string
  width: number
  height: number
  /** 1-based display order */
  order: number
  isPrimary?: boolean
  caption?: string
}

export interface GenerationSettings {
  [setting: string]: string | number
}

export interface Prompt {
  id: string
  title: string
  slug: string
  shortDescription: string
  promptText: string
  instructions?: string
  personalizationTips?: string
  expectedResult?: string
  categorySlug: string
  tags: string[]
  images: PromptImage[]
  isFeatured: boolean
  status: PromptStatus
  imageStyle?: string
  promptType?: string
  aspectRatio?: string
  resolution?: string
  difficulty?: string
  language?: string
  likeCount?: number
  copyCount?: number
  engagementEnabled?: boolean
  /** Only fill in when genuinely tested with a specific generator. */
  aiModel?: string
  generationSettings?: GenerationSettings
  seoTitle?: string
  seoDescription?: string
  canonicalUrl?: string
  ogTitle?: string
  ogDescription?: string
  ogImageUrl?: string
  indexingPreference?: 'index' | 'noindex'
  publishedAt: string
  updatedAt?: string
}

export interface Category {
  name: string
  slug: string
  description: string
  image: string
  seoTitle?: string
  seoDescription?: string
  isVisible: boolean
  displayOrder: number
}

export interface Tag {
  slug: string
  label: string
  count: number
}

export interface SearchableRecord {
  slug: string
  haystack: string
}
