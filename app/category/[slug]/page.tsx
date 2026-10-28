import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CategoryView } from '@/components/category/category-view'
import { getPublicContent } from '@/lib/public-content'
import { buildMetadata, categoryPath } from '@/lib/seo'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const content = await getPublicContent()
  return content.categories
    .filter((category) => content.prompts.some((prompt) => prompt.categorySlug === category.slug))
    .map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const content = await getPublicContent()
  const category = content.categories.find((item) => item.slug === slug && content.prompts.some((prompt) => prompt.categorySlug === slug))
  if (!category) return {}
  return buildMetadata({
    title: category.seoTitle ?? `${category.name} AI Image Prompts`,
    description: category.seoDescription ?? category.description,
    path: categoryPath(category.slug),
    image: { src: category.image, alt: `${category.name} prompt examples`, width: 896, height: 1200 },
  })
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const content = await getPublicContent()
  const category = content.categories.find((item) => item.slug === slug && content.prompts.some((prompt) => prompt.categorySlug === slug))
  if (!category) notFound()
  return <CategoryView category={category} page={1} content={content} />
}
