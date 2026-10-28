import type { Metadata } from 'next'
import { InfoPage } from '@/components/info-page'
import { siteConfig } from '@/data/site-config'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description: `How ${siteConfig.name} handles information when you browse the site.`,
  path: '/privacy-policy/',
})

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      path="/privacy-policy/"
      intro={`This page describes, in plain language, how ${siteConfig.name} handles information. It is a starting template; review and update it to match your actual setup before relying on it.`}
    >
      <h2>Information we collect</h2>
      <p>
        {siteConfig.name} does not offer accounts, comments, or forms, and the site itself does not ask you for
        personal information.
      </p>

      <h2>Information stored in your browser</h2>
      <p>
        Your light or dark theme preference and a random identifier used to prevent duplicate prompt likes are
        saved in your browser. The site stores aggregate like and prompt-copy counts. Copying a prompt and
        downloading an image happen in your browser.
      </p>

      <h2>Hosting and server logs</h2>
      <p>
        Like most websites, the hosting provider may automatically record technical data such as IP address,
        browser type, and requested pages in server logs for security and reliability.
      </p>

      <h2>Analytics, advertising, and third parties</h2>
      <p>
        If analytics or advertising services are added in the future, this policy should be updated to name
        them and explain what they collect.
      </p>

      <h2>Changes to this policy</h2>
      <p>We may update this page as the site changes. The current version is always published here.</p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent using the details on the <a href="/contact/">Contact page</a>.
      </p>
    </InfoPage>
  )
}
