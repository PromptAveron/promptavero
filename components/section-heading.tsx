import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel,
  id,
}: {
  eyebrow?: string
  title: string
  description?: string
  href?: string
  hrefLabel?: string
  id?: string
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-sm font-medium text-brand-text">{eyebrow}</p>
        ) : null}
        <h2 id={id} className="text-2xl font-semibold sm:text-3xl">
          {title}
        </h2>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
      </div>
      {href && hrefLabel ? (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-text hover:underline"
        >
          {hrefLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  )
}
