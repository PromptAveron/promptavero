import type { ReactNode } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'

export function InfoPage({
  title,
  intro,
  path,
  children,
}: {
  title: string
  intro?: string
  path: string
  children: ReactNode
}) {
  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs
        crumbs={[
          { name: 'Home', href: '/' },
          { name: title, href: path },
        ]}
      />
      <article className="mx-auto mt-8 max-w-3xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {intro ? <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p> : null}
        <div className="mt-8 space-y-4 leading-7 text-foreground/90 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_a]:font-medium [&_a]:text-brand-text [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </article>
    </div>
  )
}
