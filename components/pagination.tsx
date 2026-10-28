import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function pageList(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('gap')
    result.push(page)
  })
  return result
}

const itemClass =
  'inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-border bg-card px-3 text-sm font-medium transition-colors'

export function Pagination({
  currentPage,
  totalPages,
  hrefForPage,
}: {
  currentPage: number
  totalPages: number
  hrefForPage: (page: number) => string
}) {
  if (totalPages <= 1) return null
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {hasPrev ? (
        <Link href={hrefForPage(currentPage - 1)} rel="prev" className={cn(itemClass, 'gap-1 hover:bg-brand-soft')}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sr-only sm:hidden">Previous page</span>
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(itemClass, 'gap-1 opacity-50')}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </span>
      )}

      {pageList(currentPage, totalPages).map((page, index) =>
        page === 'gap' ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            aria-current="page"
            className={cn(itemClass, 'border-primary bg-primary text-primary-foreground')}
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={hrefForPage(page)}
            aria-label={`Page ${page}`}
            className={cn(itemClass, 'hover:bg-brand-soft')}
          >
            {page}
          </Link>
        ),
      )}

      {hasNext ? (
        <Link href={hrefForPage(currentPage + 1)} rel="next" className={cn(itemClass, 'gap-1 hover:bg-brand-soft')}>
          <span className="hidden sm:inline">Next</span>
          <span className="sr-only sm:hidden">Next page</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(itemClass, 'gap-1 opacity-50')}>
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  )
}
