import Image from 'next/image'
import Link from 'next/link'
import { getCategoryCount } from '@/lib/content'
import { pluralize } from '@/lib/format'
import { categoryPath } from '@/lib/seo'
import type { Category } from '@/types/content'

export function CategoryCard({ category, promptCount }: { category: Category; promptCount?: number }) {
  const count = promptCount ?? getCategoryCount(category.slug)
  return (
    <Link
      href={categoryPath(category.slug)}
      className="group relative flex aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted"
    >
      <Image
        src={category.image}
        alt=""
        width={896}
        height={1200}
        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
      />
      <div className="relative mt-auto w-full p-4 text-white">
        <h3 className="font-heading text-base font-semibold leading-tight sm:text-lg">
          {category.name}
        </h3>
        <p className="mt-0.5 text-xs text-white/80">{pluralize(count, 'prompt')}</p>
      </div>
    </Link>
  )
}
