'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { PublicIntegrations } from '@/components/public-integrations'
import { JsonLd } from '@/components/json-ld'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader, type HeaderCategory, type HeaderTag } from '@/components/site-header'
import type { PublicSiteSettings } from '@/lib/public-settings'

export function SiteChrome({
  categories,
  tags,
  jsonLd,
  settings,
  children,
}: {
  categories: HeaderCategory[]
  tags: HeaderTag[]
  jsonLd: Record<string, unknown>
  settings: PublicSiteSettings
  children: ReactNode
}) {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return <>{children}</>

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteHeader categories={categories} tags={tags} logoSrc={settings.logo_url} />
      <PublicIntegrations settings={settings}>
        <main id="main-content">{children}</main>
        <SiteFooter logoSrc={settings.logo_url} />
        <JsonLd data={jsonLd} />
      </PublicIntegrations>
    </>
  )
}
