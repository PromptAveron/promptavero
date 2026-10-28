import Image from 'next/image'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { CategoryCard } from '@/components/category-card'
import { JsonLd } from '@/components/json-ld'
import { Pagination } from '@/components/pagination'
import { PromptGrid } from '@/components/prompt-card'
import { SectionHeading } from '@/components/section-heading'
import { siteConfig } from '@/data/site-config'
import { btn } from '@/lib/button-styles'
import { getPublicCategoryPrompts, getRelatedPublicCategories, toPublicSummary, type PublicContent } from '@/lib/public-content'
import { pluralize } from '@/lib/format'
import { paginate } from '@/lib/search'
import { categoryPath, collectionJsonLd } from '@/lib/seo'
import type { Category } from '@/types/content'

export function categoryPageHref(slug: string, page: number) {
  return page <= 1 ? categoryPath(slug) : `${categoryPath(slug)}page/${page}/`
}

export function CategoryView({ category, page, content }: { category: Category; page: number; content: PublicContent }) {
  const all = getPublicCategoryPrompts(content, category.slug)
  const { items, currentPage, totalPages } = paginate(all, page, siteConfig.pageSize)
  const related = getRelatedPublicCategories(content, category.slug, 4)
  const path = categoryPageHref(category.slug, currentPage)

  return (
    <div className="container-page py-8 sm:py-12">
      <JsonLd data={collectionJsonLd(category.name, category.description, path, items)} />
      <Breadcrumbs
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'Categories', href: '/category/' },
          { name: category.name, href: categoryPath(category.slug) },
        ]}
      />

      <header className="mt-6 grid items-center gap-6 overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-8 md:grid-cols-[1fr_220px]">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {category.name}
            {currentPage > 1 ? <span className="sr-only"> — page {currentPage}</span> : null}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{category.description}</p>
          <p className="mt-4 text-sm font-medium text-brand-text">{pluralize(all.length, 'prompt')}</p>
          <Link
            href={`/prompts/?category=${category.slug}`}
            className={btn({ variant: 'outline', size: 'md', className: 'mt-5' })}
          >
            Search and filter this category
          </Link>
        </div>
        <Image
          src={category.image}
          alt=""
          width={896}
          height={1200}
          sizes="220px"
          preload
          className="hidden aspect-[4/5] w-full rounded-2xl object-cover md:block"
        />
      </header>

      <section aria-labelledby="category-prompts" className="mt-10">
        <h2 id="category-prompts" className="sr-only">
          {category.name} prompts
        </h2>
        <PromptGrid prompts={items.map((prompt) => toPublicSummary(prompt, content.categories))} priorityCount={4} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          hrefForPage={(target) => categoryPageHref(category.slug, target)}
        />
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="related-categories" className="mt-20">
          <SectionHeading id="related-categories" title="Related categories" />
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {related.map((item) => (
              <li key={item.slug}>
                <CategoryCard category={item} promptCount={getPublicCategoryPrompts(content, item.slug).length} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
