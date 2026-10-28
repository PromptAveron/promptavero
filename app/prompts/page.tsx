import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ExploreClient } from '@/components/explore/explore-client'
import { siteConfig } from '@/data/site-config'
import { getPublicContent, getPublicTags, toPublicSummary } from '@/lib/public-content'
import { getPublicSiteSettings } from '@/lib/public-settings'
import { AdSlot } from '@/components/public-integrations'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Explore AI Image Prompts',
  description:
    'Search and filter the full PromptAvero library of AI image prompts by category, tag, and style. Copy any prompt and download its reference images.',
  path: '/prompts/',
})

export default async function ExplorePage() {
  const [content, settings] = await Promise.all([getPublicContent(), getPublicSiteSettings()])
  const summaries = content.prompts.map((prompt) => toPublicSummary(prompt, content.categories))
  const categoryOptions = content.categories
    .filter((category) => summaries.some((summary) => summary.categorySlug === category.slug))
    .map((category) => ({ slug: category.slug, label: category.name }))
  const tagOptions = getPublicTags(content).map(({ slug, label }) => ({ slug, label }))

  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'Explore Prompts', href: '/prompts/' },
        ]}
      />
      <header className="mb-8 mt-6 max-w-2xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Explore AI Image Prompts</h1>
        <p className="mt-3 text-muted-foreground">
          Search the library, narrow results by category or tag, and open any prompt to copy it and
          download its reference images.
        </p>
      </header>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" aria-hidden="true" />}>
        <ExploreClient
          summaries={summaries}
          categories={categoryOptions}
          tags={tagOptions}
          pageSize={siteConfig.pageSize}
        />
      </Suspense>
      <AdSlot settings={settings} kind="listing" />
    </div>
  )
}
