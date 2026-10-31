import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpenText, Lightbulb, Target } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { PromptGrid } from '@/components/prompt-card'
import { PromptGallery } from '@/components/prompt/prompt-gallery'
import { PromptLikeButton } from '@/components/prompt/prompt-like-button'
import { PromptTextPanel } from '@/components/prompt/prompt-text-panel'
import { ShareActions } from '@/components/prompt/share-actions'
import { SectionHeading } from '@/components/section-heading'
import { btn } from '@/lib/button-styles'
import { getPrimaryPublicImage, getPublicContent, getRelatedPublicPrompts, toPublicSummary } from '@/lib/public-content'
import { tagLabel } from '@/lib/content'
import { AdSlot } from '@/components/public-integrations'
import { getPublicSiteSettings } from '@/lib/public-settings'
import { formatDate } from '@/lib/format'
import { buildMetadata, categoryPath, promptCanonical, promptJsonLd, promptPath } from '@/lib/seo'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const content = await getPublicContent()
  return content.prompts.map(({ slug }) => ({ slug }))
}

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const [content, settings] = await Promise.all([getPublicContent(), getPublicSiteSettings()])
  const prompt = content.prompts.find((item) => item.slug === slug)
  if (!prompt) return {}
  const primary = getPrimaryPublicImage(prompt)
  const metadata = buildMetadata({
    title: prompt.seoTitle ?? `${prompt.title} — AI Image Prompt`,
    description: prompt.seoDescription ?? prompt.shortDescription,
    path: promptPath(prompt.slug),
    image: { src: primary.src, alt: primary.alt, width: primary.width, height: primary.height },
    type: 'article',
  })
  return {
    ...metadata,
    alternates: { canonical: promptCanonical(prompt) },
    openGraph: {
      ...metadata.openGraph,
      ...(prompt.ogTitle ? { title: prompt.ogTitle } : {}),
      ...(prompt.ogDescription ? { description: prompt.ogDescription } : {}),
      ...(prompt.ogImageUrl ? { images: [prompt.ogImageUrl] } : {}),
    },
    twitter: {
      ...metadata.twitter,
      ...(prompt.ogTitle ? { title: prompt.ogTitle } : {}),
      ...(prompt.ogDescription ? { description: prompt.ogDescription } : {}),
      ...(prompt.ogImageUrl ? { images: [prompt.ogImageUrl] } : {}),
    },
    ...(prompt.indexingPreference === 'noindex' ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function PromptPage({ params }: { params: Params }) {
  const { slug } = await params
  const [content, settings] = await Promise.all([getPublicContent(), getPublicSiteSettings()])
  const prompt = content.prompts.find((item) => item.slug === slug)
  if (!prompt) notFound()
  const category = content.categories.find((item) => item.slug === prompt.categorySlug)
  const related = getRelatedPublicPrompts(content, prompt, 6)
  const canonical = promptCanonical(prompt)

  const details: { label: string; value: string }[] = [
    { label: 'Category', value: category?.name ?? '' },
    { label: 'Art style', value: prompt.imageStyle ?? '' },
    { label: 'Intended use case', value: prompt.promptType ?? '' },
    { label: 'Aspect ratio', value: prompt.aspectRatio || 'Not specified' },
    { label: 'AI Model', value: prompt.aiModel ?? '' },
    { label: 'Difficulty', value: prompt.difficulty ?? '' },
    ...Object.entries(prompt.generationSettings ?? {}).map(([label, value]) => ({
      label,
      value: String(value),
    })),
  ].filter((item) => item.value)

  return (
    <div className="container-page py-8 sm:py-12">
      <JsonLd data={promptJsonLd(prompt, category)} />
      <Breadcrumbs
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'Categories', href: '/category/' },
          ...(category ? [{ name: category.name, href: categoryPath(category.slug) }] : []),
          { name: prompt.title, href: promptPath(prompt.slug) },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PromptGallery slug={prompt.slug} title={prompt.title} images={prompt.images} />
          <AdSlot settings={settings} kind="prompt_bottom" />
        </div>

        <article className="min-w-0">
          {category ? (
            <Link
              href={categoryPath(category.slug)}
              className="text-sm font-medium text-brand-text hover:underline"
            >
              {category.name}
            </Link>
          ) : null}
          <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{prompt.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{prompt.shortDescription}</p>

          <div className="mt-6">
            <PromptTextPanel
              promptId={prompt.id}
              promptSlug={prompt.slug}
              promptText={prompt.promptText}
              initialCopyCount={prompt.copyCount ?? 0}
              engagementEnabled={prompt.engagementEnabled ?? false}
            />
          </div>
          <AdSlot settings={settings} kind="prompt_top" />

          <div className="mt-5 flex flex-wrap items-start gap-3">
            <PromptLikeButton
              promptId={prompt.id}
              slug={prompt.slug}
              initialCount={prompt.likeCount ?? 0}
              enabled={prompt.engagementEnabled ?? false}
              variant="detail"
              className="h-12 px-5 text-sm"
            />
            <ShareActions url={canonical} title={prompt.title} />
          </div>

          {details.length > 0 ? (
            <section aria-labelledby="details-heading" className="mt-8">
              <h2 id="details-heading" className="text-sm font-semibold">Prompt details</h2>
              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 rounded-2xl border border-border bg-card p-4 text-xs sm:p-5">
                {details.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="mt-0.5 break-words font-medium text-foreground">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {prompt.tags.length > 0 ? (
            <section aria-labelledby="tags-heading" className="mt-6">
              <h2 id="tags-heading" className="text-sm font-semibold">Tags</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {prompt.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`/prompts/?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-text hover:bg-primary hover:text-primary-foreground"
                    >
                      {tagLabel(tag)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Published <time dateTime={prompt.publishedAt}>{formatDate(prompt.publishedAt)}</time>
            </p>
            <Link href="/prompts/" className={btn({ variant: 'ghost', size: 'sm', className: '-mr-2' })}>
              <ArrowLeft aria-hidden="true" />
              Back to Explore
            </Link>
          </div>
        </article>
      </div>

      {prompt.instructions || prompt.personalizationTips || prompt.expectedResult ? (
        <section aria-labelledby="usage-heading" className="mt-12">
          <h2 id="usage-heading" className="text-lg font-semibold">Using this prompt</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prompt.instructions ? (
              <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
                    <BookOpenText className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-semibold">Instructions</h3>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{prompt.instructions}</p>
              </article>
            ) : null}
            {prompt.personalizationTips ? (
              <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
                    <Lightbulb className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-semibold">Personalization tips</h3>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{prompt.personalizationTips}</p>
              </article>
            ) : null}
            {prompt.expectedResult ? (
              <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <Target className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-semibold">Expected result</h3>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{prompt.expectedResult}</p>
              </article>
            ) : null}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-20">
          <SectionHeading id="related-heading" title="Related prompts" />
          <PromptGrid prompts={related.map((item) => toPublicSummary(item, content.categories))} />
        </section>
      ) : null}
    </div>
  )
}
