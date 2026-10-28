import type { Metadata } from 'next'
import { siteConfig } from '@/data/site-config'
import type { Category, Prompt } from '@/types/content'

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`
}

export function promptPath(slug: string): string {
  return `/prompts/${slug}/`
}

export function categoryPath(slug: string): string {
  return `/category/${slug}/`
}

export function promptCanonical(prompt: Prompt): string {
  return prompt.canonicalUrl ?? absoluteUrl(promptPath(prompt.slug))
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex,
  type = 'website',
}: {
  title: string
  description: string
  path: string
  image?: { src: string; alt: string; width?: number; height?: number }
  noIndex?: boolean
  type?: 'website' | 'article'
}): Metadata {
  const url = absoluteUrl(path)
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type,
      locale: 'en_US',
      images: image
        ? [{ url: absoluteUrl(image.src), alt: image.alt, width: image.width, height: image.height }]
        : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [absoluteUrl(image.src)] : undefined,
    },
  }
}

export interface Crumb {
  name: string
  href: string
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  }
}

export function promptJsonLd(prompt: Prompt, category?: Category) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: prompt.title,
    headline: prompt.title,
    description: prompt.shortDescription,
    url: promptCanonical(prompt),
    image: prompt.images.map((image) => absoluteUrl(image.src)),
    keywords: prompt.tags.join(', '),
    genre: category?.name,
    datePublished: prompt.publishedAt,
    dateModified: prompt.updatedAt ?? prompt.publishedAt,
    text: prompt.promptText,
    isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
  }
}

export function collectionJsonLd(name: string, description: string, path: string, prompts: Prompt[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: absoluteUrl(path),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: prompts.map((prompt, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(promptPath(prompt.slug)),
        name: prompt.title,
      })),
    },
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/prompts/?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}
