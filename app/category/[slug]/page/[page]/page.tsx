import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CategoryView, categoryPageHref } from '@/components/category/category-view'
import { getPublicContent } from '@/lib/public-content'
import { buildMetadata } from '@/lib/seo'
import { siteConfig } from '@/data/site-config'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const content = await getPublicContent()
  return content.categories.flatMap((category) => {
    const count = content.prompts.filter((prompt) => prompt.categorySlug === category.slug).length
    const pageCount = Math.ceil(count / siteConfig.pageSize)
    return Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => ({
      slug: category.slug,
      page: String(index + 2),
    }))
  })
}

type Params = Promise<{ slug: string; page: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, page } = await params
  const content = await getPublicContent()
  const category = content.categories.find((item) => item.slug === slug && content.prompts.some((prompt) => prompt.categorySlug === slug))
  if (!category) return {}
  const pageNumber = Number(page)
  return buildMetadata({
    title: `${category.name} AI Image Prompts — Page ${pageNumber}`,
    description: `${category.description} Page ${pageNumber}.`,
    path: categoryPageHref(slug, pageNumber),
  })
}

export default async function CategoryPaginatedPage({ params }: { params: Params }) {
  const { slug, page } = await params
  const content = await getPublicContent()
  const category = content.categories.find((item) => item.slug === slug && content.prompts.some((prompt) => prompt.categorySlug === slug))
  const pageNumber = Number(page)
  if (!category || !Number.isInteger(pageNumber) || pageNumber < 2) notFound()
  return <CategoryView category={category} page={pageNumber} content={content} />
}
