import type { Metadata } from 'next'
import Link from 'next/link'
import { InfoPage } from '@/components/info-page'
import { siteConfig } from '@/data/site-config'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: `About ${siteConfig.name}`,
  description: `${siteConfig.name} is a curated library of AI image prompts with reference images you can browse, copy, and download.`,
  path: '/about/',
})

export default function AboutPage() {
  return (
    <InfoPage
      title={`About ${siteConfig.name}`}
      path="/about/"
      intro={`${siteConfig.name} is a curated library of AI image prompts. Every prompt is paired with reference images so you can see the kind of result it aims for before you copy it.`}
    >
      <h2>What you can do here</h2>
      <ul>
        <li>
          Browse prompts by <Link href="/category/">category</Link> or search the full{' '}
          <Link href="/prompts/">prompt library</Link>.
        </li>
        <li>Copy the full prompt text with one click and paste it into your preferred image generator.</li>
        <li>View up to five reference variations for each prompt and download the images.</li>
      </ul>

      <h2>How prompts are presented</h2>
      <p>
        Each prompt page shows the full prompt, its category, style, and tags. Details such as the suggested
        model or generation settings only appear when they are known, so you will not see guesses presented as
        fact.
      </p>

      <h2>A note on results</h2>
      <p>
        AI image generators differ, and results vary between models, versions, and runs. Treat each prompt as a
        starting point and adjust it to suit your tools and your idea.
      </p>
    </InfoPage>
  )
}
