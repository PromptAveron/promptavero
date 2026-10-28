'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { AlignJustify, ArrowUpRight, ChartNoAxesColumn, FileImage, FileText, Folder, Settings2, X } from 'lucide-react'
import { signOutAction } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Dashboard', href: '/admin/', icon: ChartNoAxesColumn },
  { label: 'Prompts', href: '/admin/prompts/', icon: FileText },
  { label: 'Categories', href: '/admin/categories/', icon: Folder },
  { label: 'Media Library', href: '/admin/media/', icon: FileImage },
  { label: 'SEO', href: '/admin/seo/', icon: Settings2 },
  { label: 'Site Settings', href: '/admin/settings/', icon: Settings2 },
]

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navigation = (
    <>
      <div className="flex items-start justify-between border-b border-border px-5 py-6">
        <div>
          <Link href="/admin/" className="text-[17px] font-semibold tracking-[-0.04em]">PromptAvero</Link>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Content studio</p>
        </div>
        <button className="rounded-md p-1 md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation">
          <X size={18} />
        </button>
      </div>
      <Link href="/" target="_blank" rel="noreferrer" className="mx-3 mt-4 flex items-center justify-between rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
        View site <ArrowUpRight size={14} />
      </Link>
      <nav aria-label="Admin navigation" className="mt-6 flex-1 px-3">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
        <ul className="space-y-1">
          {links.map(({ label, href, icon: Icon }) => {
            const active = href === '/admin/' ? pathname === '/admin/' : pathname.startsWith(href.slice(0, -1))
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors',
                    active ? 'bg-brand-soft font-medium text-brand-text' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon size={16} strokeWidth={1.7} /> {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t border-border p-4">
        <div className="truncate text-xs font-medium" title={email}>{email}</div>
        <form action={signOutAction}>
          <button className="mt-2 w-full rounded-md px-2 py-2 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            Sign out
          </button>
        </form>
      </div>
    </>
  )
  return (
    <>
      <button
        className="fixed left-3 top-3 z-30 flex size-10 items-center justify-center rounded-md border border-border bg-card md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open admin navigation"
      >
        <AlignJustify size={18} />
      </button>
      {open ? <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/25 md:hidden" onClick={() => setOpen(false)} /> : null}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-border bg-card transition-transform md:sticky md:top-0 md:h-screen md:w-[248px] md:flex-none md:shrink-0 md:self-start md:translate-x-0 md:transform-none',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {navigation}
      </aside>
    </>
  )
}
