import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { btn } from '@/lib/button-styles'

export function CtaBand({
  title = 'Ready to find your next prompt?',
  description = 'Browse the full library and filter by category, tag, or style to find the starting point for your next image.',
}: {
  title?: string
  description?: string
}) {
  return (
    <section className="container-page mt-20 sm:mt-24" aria-label="Explore prompts">
      <div className="cta-gradient relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl"
        />
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/85">{description}</p>
        <Link href="/prompts/" className={btn({ variant: 'light', size: 'lg', className: 'mt-8' })}>
          Explore Prompts
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
