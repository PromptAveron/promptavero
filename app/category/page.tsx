import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { CategoryCard } from '@/components/category-card'
import { CtaBand } from '@/components/cta-band'
import { getPopulatedPublicCategories, getPublicCategoryCount, getPublicContent } from '@/lib/public-content'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'AI Image Prompt Categories',
  description:
    'Browse AI image prompts by category, from cinematic portraits and fashion photography to fantasy art, architecture, and product shots.',
  path: '/category/',
})

export default async function CategoriesPage() {
  const content = await getPublicContent()
  const populatedCategories = getPopulatedPublicCategories(content)
  return (
    <>
      <div className="container-page py-8 sm:py-12">
        <Breadcrumbs
          crumbs={[
            { name: 'Home', href: '/' },
            { name: 'Categories', href: '/category/' },
          ]}
        />
        <header className="mb-8 mt-6 max-w-2xl">
          <h1 className="text-3xl font-semibold sm:text-4xl">AI Image Prompt Categories</h1>
          <p className="mt-3 text-muted-foreground">
            Pick a style or subject to see every prompt in that category, each with reference images and
            a copy-ready prompt.
          </p>
        </header>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {populatedCategories.map((category) => (
            <li key={category.slug}>
              <CategoryCard category={category} promptCount={getPublicCategoryCount(content, category.slug)} />
            </li>
          ))}
        </ul>
      </div>
      <CtaBand />
    </>
  )
}
