import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Star } from 'lucide-react'
import { PromptCardLink } from '@/components/prompt-card-link'
import { PromptLikeButton } from '@/components/prompt/prompt-like-button'
import type { PromptSummary } from '@/lib/content'
import { formatDate } from '@/lib/format'
import { categoryPath, promptPath } from '@/lib/seo'

export function PromptCard({
  prompt,
  priority = false,
  showDate = true,
}: {
  prompt: PromptSummary
  priority?: boolean
  showDate?: boolean
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <PromptCardLink
        href={promptPath(prompt.slug)}
        title={prompt.title}
        image={prompt.image}
      />
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={prompt.image.src}
          alt={prompt.image.alt}
          width={prompt.image.width}
          height={prompt.image.height}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          loading={priority ? 'eager' : 'lazy'}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {prompt.isFeatured ? (
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-[#3d2fb0] shadow-sm">
            <Star className="size-3 fill-current" aria-hidden="true" />
            Featured
          </span>
        ) : null}
        <div className="absolute right-3 top-3 z-30">
          <PromptLikeButton
            promptId={prompt.id}
            slug={prompt.slug}
            initialCount={prompt.likeCount}
            enabled={prompt.engagementEnabled}
            iconOnly
            className="h-8 min-w-8 gap-1 px-2 text-xs backdrop-blur-md"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={categoryPath(prompt.categorySlug)}
            className="relative z-20 min-w-0 truncate text-[11px] font-medium text-brand-text hover:underline"
          >
            {prompt.categoryName}
          </Link>
          {showDate ? (
            <time dateTime={prompt.publishedAt} className="shrink-0 text-right text-[10px] leading-snug text-muted-foreground">
              {formatDate(prompt.publishedAt)}
            </time>
          ) : null}
        </div>
        <h3 className="text-sm font-semibold leading-snug">{prompt.title}</h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{prompt.shortDescription}</p>
        <div className="relative z-20 mt-2 flex items-center gap-2">
          <Link
            href={promptPath(prompt.slug)}
            className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            View prompt <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function PromptGrid({
  prompts,
  priorityCount = 0,
}: {
  prompts: PromptSummary[]
  priorityCount?: number
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {prompts.map((prompt, index) => (
        <li key={prompt.slug} className="contents">
          <PromptCard prompt={prompt} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  )
}
