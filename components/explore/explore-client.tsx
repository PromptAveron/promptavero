'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, SearchX, Star, X } from 'lucide-react'
import { Pagination } from '@/components/pagination'
import { PromptGrid } from '@/components/prompt-card'
import { btn } from '@/lib/button-styles'
import type { PromptSummary } from '@/lib/content'
import { pluralize } from '@/lib/format'
import {
  SORT_OPTIONS,
  buildQuery,
  filterPrompts,
  paginate,
  parseFilters,
  type ExploreFilters,
  type SortOption,
} from '@/lib/search'
import { cn } from '@/lib/utils'

interface Option {
  slug: string
  label: string
}

const selectClass =
  'h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export function ExploreClient({
  summaries,
  categories,
  tags,
  pageSize,
}: {
  summaries: PromptSummary[]
  categories: Option[]
  tags: Option[]
  pageSize: number
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams])

  const [input, setInput] = useState(filters.search)
  const lastPushed = useRef(filters.search)

  useEffect(() => {
    if (filters.search !== lastPushed.current) {
      lastPushed.current = filters.search
      setInput(filters.search)
    }
  }, [filters.search])

  useEffect(() => {
    const value = input.trim()
    if (value === filters.search) return
    const timer = window.setTimeout(() => {
      lastPushed.current = value
      window.history.replaceState(
        null,
        '',
        `${pathname}${buildQuery({ ...filters, search: value, page: 1 })}`,
      )
    }, 300)
    return () => window.clearTimeout(timer)
  }, [input, filters, pathname])

  function update(patch: Partial<ExploreFilters>) {
    window.history.replaceState(
      null,
      '',
      `${pathname}${buildQuery({ ...filters, ...patch, page: 1 })}`,
    )
  }

  function reset() {
    lastPushed.current = ''
    setInput('')
    window.history.replaceState(null, '', pathname)
  }

  const results = useMemo(() => filterPrompts(summaries, filters), [summaries, filters])
  const { items, currentPage, totalPages } = paginate(results, filters.page, pageSize)

  const categoryLabel = categories.find((category) => category.slug === filters.category)?.label
  const tagLabel = tags.find((tag) => tag.slug === filters.tag)?.label
  const hasActiveFilters = Boolean(filters.search || filters.category || filters.tag || filters.featured)

  const chips: { key: string; label: string; clear: () => void }[] = []
  if (filters.search) chips.push({ key: 'search', label: `Search: “${filters.search}”`, clear: () => { setInput(''); update({ search: '' }) } })
  if (categoryLabel) chips.push({ key: 'category', label: categoryLabel, clear: () => update({ category: '' }) })
  if (tagLabel) chips.push({ key: 'tag', label: `Tag: ${tagLabel}`, clear: () => update({ tag: '' }) })
  if (filters.featured) chips.push({ key: 'featured', label: 'Featured only', clear: () => update({ featured: false }) })

  return (
    <div>
      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="rounded-2xl border border-border bg-card p-4 sm:p-5"
      >
        <div className="relative">
          <label htmlFor="explore-search" className="sr-only">
            Search prompts
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="explore-search"
            type="text"
            inputMode="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search by title, style, subject, or tag"
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-11 text-base outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {input ? (
            <button
              type="button"
              onClick={() => {
                setInput('')
                update({ search: '' })
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <label htmlFor="filter-category" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Category
            </label>
            <select
              id="filter-category"
              value={filters.category}
              onChange={(event) => update({ category: event.target.value })}
              className={selectClass}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-tag" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Tag
            </label>
            <select
              id="filter-tag"
              value={filters.tag}
              onChange={(event) => update({ tag: event.target.value })}
              className={selectClass}
            >
              <option value="">All tags</option>
              {tags.map((tag) => (
                <option key={tag.slug} value={tag.slug}>
                  {tag.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-sort" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Sort by
            </label>
            <select
              id="filter-sort"
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value as SortOption })}
              className={selectClass}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              aria-pressed={filters.featured}
              onClick={() => update({ featured: !filters.featured })}
              className={cn(
                btn({ variant: filters.featured ? 'primary' : 'outline', size: 'lg' }),
                'h-11 w-full text-sm lg:w-auto',
              )}
            >
              <Star className={cn(filters.featured && 'fill-current')} aria-hidden="true" />
              Featured
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center gap-2" aria-live="polite">
        <p className="mr-1 text-sm text-muted-foreground">
          {results.length === 0
            ? 'No prompts found'
            : `Showing ${pluralize(results.length, 'prompt')}${totalPages > 1 ? ` · page ${currentPage} of ${totalPages}` : ''}`}
        </p>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.clear}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-text hover:bg-primary hover:text-primary-foreground"
            aria-label={`Remove filter: ${chip.label}`}
          >
            {chip.label}
            <X className="size-3" aria-hidden="true" />
          </button>
        ))}
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={reset}
            className="ml-1 text-sm font-medium text-brand-text underline-offset-4 hover:underline"
          >
            Reset filters
          </button>
        ) : null}
      </div>

      <div className="mt-6">
        {items.length > 0 ? (
          <>
            <PromptGrid prompts={items} priorityCount={4} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hrefForPage={(page) => `${pathname}${buildQuery({ ...filters, page })}`}
            />
          </>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-text">
              <SearchX className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">No prompts match your search</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Try a different keyword, remove a filter, or browse every category instead.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={reset} className={btn({ size: 'md' })}>
                Reset filters
              </button>
              <Link href="/category/" className={btn({ variant: 'outline', size: 'md' })}>
                Browse categories
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
