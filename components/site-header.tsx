'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ChevronDown, Menu, Search, Sparkles } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { siteConfig } from '@/data/site-config'
import { btn } from '@/lib/button-styles'
import { cn } from '@/lib/utils'

export interface HeaderCategory {
  name: string
  slug: string
}

export interface HeaderTag {
  slug: string
  label: string
}

function isActive(pathname: string, href: string) {
  const path = href.split('?')[0]
  if (path === '/') return pathname === '/'
  return pathname.startsWith(path.replace(/\/$/, ''))
}

function SearchDialog({
  open,
  onOpenChange,
  tags,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tags: HeaderTag[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    onOpenChange(false)
    router.push(value ? `/prompts/?search=${encodeURIComponent(value)}` : '/prompts/')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-lg translate-y-0 gap-4 p-5 sm:max-w-xl">
        <DialogTitle className="font-heading text-lg">Search prompts</DialogTitle>
        <DialogDescription className="sr-only">
          Search prompt titles, descriptions, categories, and tags.
        </DialogDescription>
        <form onSubmit={onSubmit} role="search" className="flex gap-2">
          <label htmlFor="header-search" className="sr-only">
            Search prompts
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="header-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “cinematic” or “golden hour”"
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button type="submit" className={btn({ size: 'lg', className: 'h-11 px-5 text-sm' })}>
            Search
          </button>
        </form>
        {tags.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Popular tags</p>
            <ul className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag.slug}>
                  <Link
                    href={`/prompts/?tag=${tag.slug}`}
                    onClick={() => onOpenChange(false)}
                    className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-text hover:bg-primary hover:text-primary-foreground"
                  >
                    {tag.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export function SiteHeader({
  categories,
  tags,
  logoSrc,
}: {
  categories: HeaderCategory[]
  tags: HeaderTag[]
  logoSrc?: string
}) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = (active: boolean) =>
    cn(
      'inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted',
      active ? 'text-brand-text' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container-page flex h-16 items-center justify-between gap-2 sm:gap-4">
        <Logo logoSrc={logoSrc} className="gap-2 text-lg sm:gap-2.5 sm:text-xl" />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <Link href="/" className={linkClass(pathname === '/')} aria-current={pathname === '/' ? 'page' : undefined}>
            Home
          </Link>
          <Link
            href="/prompts/"
            className={linkClass(pathname === '/prompts' || pathname === '/prompts/')}
          >
            Explore Prompts
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(linkClass(pathname.startsWith('/category')), 'gap-1 outline-none')}
            >
              Categories
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuItem render={<Link href="/category/" />} className="font-medium">
                All categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuItem key={category.slug} render={<Link href={`/category/${category.slug}/`} />}>
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/prompts/?sort=newest" className={linkClass(false)}>
            Latest Prompts
          </Link>
        </nav>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={btn({ variant: 'ghost', size: 'icon' })}
            aria-label="Search prompts"
          >
            <Search aria-hidden="true" />
          </button>
          <ThemeToggle />
          <span className="hidden md:block">
            <Link href="/prompts/" className={btn({ size: 'md', className: 'ml-1' })}>
              <Sparkles aria-hidden="true" />
              Explore Prompts
            </Link>
          </span>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className={btn({ variant: 'ghost', size: 'icon', className: 'lg:hidden' })}
              aria-label="Open menu"
            >
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] gap-0 overflow-y-auto p-0">
              <div className="border-b border-border p-5">
                <SheetTitle className="font-heading text-lg">Menu</SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
              </div>
              <nav aria-label="Mobile" className="flex flex-col p-3">
                {siteConfig.nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'rounded-lg px-3 py-3 text-base font-medium hover:bg-muted',
                      isActive(pathname, item.href) && item.label !== 'Latest Prompts'
                        ? 'text-brand-text'
                        : 'text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <p className="mt-4 px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Categories
                </p>
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}/`}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} tags={tags} />
    </header>
  )
}
