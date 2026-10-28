import type { Metadata } from 'next'
import Link from 'next/link'
import { CategoryCard } from '@/components/category-card'
import { btn } from '@/lib/button-styles'
import { populatedCategories } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you are looking for does not exist or has moved.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  const suggestions = populatedCategories.slice(0, 4)
  return (
    <div className="container-page py-16 sm:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm font-semibold text-brand-text">Error 404</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">This page could not be found</h1>
        <p className="mt-4 text-muted-foreground">
          The link may be broken, or the prompt may have moved. Try exploring the library instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={btn({ variant: 'primary', size: 'lg' })}>
            Back to Home
          </Link>
          <Link href="/prompts/" className={btn({ variant: 'outline', size: 'lg' })}>
            Explore Prompts
          </Link>
        </div>
      </div>
      {suggestions.length > 0 ? (
        <section aria-labelledby="nf-categories" className="mt-16">
          <h2 id="nf-categories" className="mb-5 text-center text-xl font-semibold">
            Popular categories
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {suggestions.map((category) => (
              <li key={category.slug}>
                <CategoryCard category={category} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
