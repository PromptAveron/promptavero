import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, LayoutGrid } from 'lucide-react'
import { btn } from '@/lib/button-styles'
import { pluralize } from '@/lib/format'
import type { PromptSummary } from '@/lib/content'
import { promptPath } from '@/lib/seo'
import { cn } from '@/lib/utils'

export function Hero({
  showcase,
  promptCount,
  categoryCount,
}: {
  showcase: PromptSummary[]
  promptCount: number
  categoryCount: number
}) {
  const offsets = ['sm:mt-10', 'sm:-mt-2', 'sm:mt-16']

  return (
    <section className="hero-gradient relative overflow-hidden border-b border-border/60">
      <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-brand-text">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            A curated AI image prompt library
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
            Discover AI Image Prompts That Inspire{' '}
            <span className="text-brand-text">Better Creations</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Explore a curated library of powerful AI image prompts. Find inspiration, recreate stunning
            visuals, and bring your creative ideas to life.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/prompts/" className={btn({ size: 'lg' })}>
              Explore Prompts
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/category/" className={btn({ variant: 'outline', size: 'lg' })}>
              <LayoutGrid aria-hidden="true" />
              Browse Categories
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-success" aria-hidden="true" />
              {pluralize(promptCount, 'curated prompt')}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-success" aria-hidden="true" />
              {pluralize(categoryCount, 'category', 'categories')}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-success" aria-hidden="true" />
              Copy in one click
            </li>
          </ul>
        </div>

        <ul className="grid grid-cols-3 gap-3 sm:gap-4" aria-label="Featured prompts">
          {showcase.slice(0, 3).map((item, index) => (
            <li key={item.slug} className={cn(offsets[index])}>
              <Link
                href={promptPath(item.slug)}
                className="group relative block overflow-hidden rounded-2xl border border-border bg-muted shadow-xl shadow-primary/10"
              >
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  width={item.image.width}
                  height={item.image.height}
                  sizes="(min-width: 1024px) 18vw, 30vw"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  className="aspect-[3/4] size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="sr-only">{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
