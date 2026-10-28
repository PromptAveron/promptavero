import type { Metadata } from 'next'
import { InfoPage } from '@/components/info-page'
import { siteConfig } from '@/data/site-config'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: `Contact ${siteConfig.name}`,
  description: `How to get in touch with ${siteConfig.name} about prompts, corrections, or general questions.`,
  path: '/contact/',
})

export default function ContactPage() {
  const email = siteConfig.contactEmail
  const socials = Object.entries(siteConfig.social).filter(([, url]) => url)

  return (
    <InfoPage
      title="Contact"
      path="/contact/"
      intro="Questions, corrections, or feedback about a prompt? Here is how to reach us."
    >
      {email ? (
        <>
          <h2>Email</h2>
          <p>
            Write to <a href={`mailto:${email}`}>{email}</a>. Please include the link to the prompt page if
            your message is about specific content.
          </p>
        </>
      ) : (
        <p>
          A public contact address has not been published yet. Check back soon, or add one in{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">data/site-config.ts</code> by setting{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">contactEmail</code>.
        </p>
      )}

      {socials.length > 0 ? (
        <>
          <h2>Elsewhere</h2>
          <ul>
            {socials.map(([name, url]) => (
              <li key={name}>
                <a href={url} rel="noopener noreferrer" target="_blank">
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </InfoPage>
  )
}
