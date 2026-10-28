import { Copy, FolderTree, Layers } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'

const features = [
  {
    icon: Layers,
    title: 'Curated, not crowded',
    body: 'Every prompt is written and reviewed for clarity, so you spend less time rewriting and more time creating.',
  },
  {
    icon: Copy,
    title: 'Copy in one click',
    body: 'Each prompt page keeps the full text one tap away, alongside reference images that show the intended result.',
  },
  {
    icon: FolderTree,
    title: 'Easy to explore',
    body: 'Browse by category, filter by tag, or search for a style, subject, or mood to find the right starting point.',
  },
]

export function WhySection() {
  return (
    <section aria-labelledby="why-heading" className="container-page mt-20 sm:mt-24">
      <SectionHeading
        id="why-heading"
        eyebrow="Why PromptAvero"
        title="Built for people who care about the result"
        description="A focused library with the details that matter: structure, lighting, composition, and style."
      />
      <ul className="grid gap-4 md:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <li key={title} className="rounded-2xl border border-border bg-card p-6">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
