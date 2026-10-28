import type { MetadataRoute } from 'next'
import { siteConfig } from '@/data/site-config'
import { getPopulatedPublicCategories, getPublicCategoryPrompts, getPublicContent } from '@/lib/public-content'
import { absoluteUrl, categoryPath, promptPath } from '@/lib/seo'

const staticPages = ['/', '/prompts/', '/category/', '/about/', '/contact/', '/privacy-policy/', '/terms-of-use/']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getPublicContent()
  const prompts = content.prompts.filter((prompt) => prompt.indexingPreference !== 'noindex')
  const populatedCategories = getPopulatedPublicCategories(content)
  const newest = prompts.reduce((latest, prompt) => {
    const date = prompt.updatedAt ?? prompt.publishedAt
    return date > latest ? date : latest
  }, '')

  const pages: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: absoluteUrl(path),
    lastModified: path === '/' || path === '/prompts/' ? newest || undefined : undefined,
  }))

  const categoryPages: MetadataRoute.Sitemap = populatedCategories.flatMap((category) => {
    const inCategory = getPublicCategoryPrompts(content, category.slug)
    const lastModified = inCategory
      .map((prompt) => prompt.updatedAt ?? prompt.publishedAt)
      .sort()
      .at(-1)
    const totalPages = Math.ceil(inCategory.length / siteConfig.pageSize)
    return Array.from({ length: totalPages }, (_, index) => ({
      url: absoluteUrl(index === 0 ? categoryPath(category.slug) : `${categoryPath(category.slug)}page/${index + 1}/`),
      lastModified,
    }))
  })

  const promptPages: MetadataRoute.Sitemap = prompts.map((prompt) => ({
    url: prompt.canonicalUrl ?? absoluteUrl(promptPath(prompt.slug)),
    lastModified: prompt.updatedAt ?? prompt.publishedAt,
  }))

  return [...pages, ...categoryPages, ...promptPages]
}
