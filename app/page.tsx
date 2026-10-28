import type { Metadata } from 'next'
import { CategoryCard } from '@/components/category-card'
import { CtaBand } from '@/components/cta-band'
import { Hero } from '@/components/home/hero'
import { WhySection } from '@/components/home/why-section'
import { PromptGrid } from '@/components/prompt-card'
import { SectionHeading } from '@/components/section-heading'
import { siteConfig } from '@/data/site-config'
import { getPopulatedPublicCategories, getPublicContent, getPublicCategoryCount, toPublicSummary } from '@/lib/public-content'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicContent()
  const firstImage = content.prompts[0]?.images[0]
  return buildMetadata({
    title: `${siteConfig.name} — Premium AI Image Prompt Library`,
    description: siteConfig.description,
    path: '/',
    image: firstImage ? { ...firstImage, alt: firstImage.alt } : undefined,
  })
}

export default async function HomePage() {
  const content = await getPublicContent()
  const populatedCategories = getPopulatedPublicCategories(content)
  const featured = content.prompts.filter((prompt) => prompt.isFeatured).slice(0, siteConfig.homeFeaturedCount).map((prompt) => toPublicSummary(prompt, content.categories))
  const latest = content.prompts.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, siteConfig.homeLatestCount).map((prompt) => toPublicSummary(prompt, content.categories))
  const showcase = (featured.length >= 3 ? featured : latest).slice(0, 3)

  return (
    <>
      <Hero
        showcase={showcase}
        promptCount={content.prompts.length}
        categoryCount={populatedCategories.length}
      />

      {featured.length > 0 ? (
        <section aria-labelledby="featured-heading" className="container-page mt-20 sm:mt-24">
          <SectionHeading
            id="featured-heading"
            eyebrow="Handpicked"
            title="Featured prompts"
            description="Standout prompts selected for their detail, clarity, and visual impact."
            href="/prompts/?featured=1"
            hrefLabel="View all featured"
          />
          <PromptGrid prompts={featured} />
        </section>
      ) : null}

      <section aria-labelledby="categories-heading" className="container-page mt-20 sm:mt-24">
        <SectionHeading
          id="categories-heading"
          eyebrow="Browse by style"
          title="Explore categories"
          description="Jump straight to the type of image you want to create."
          href="/category/"
          hrefLabel="All categories"
        />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
          {populatedCategories.slice(0, 10).map((category) => (
            <li key={category.slug}>
              <CategoryCard category={category} promptCount={getPublicCategoryCount(content, category.slug)} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="latest-heading" className="container-page mt-20 sm:mt-24">
        <SectionHeading
          id="latest-heading"
          eyebrow="Just added"
          title="Latest prompts"
          description="Fresh additions to the library, newest first."
          href="/prompts/?sort=newest"
          hrefLabel="View all prompts"
        />
        <PromptGrid prompts={latest} />
      </section>

      <WhySection />
      <CtaBand />
    </>
  )
}
