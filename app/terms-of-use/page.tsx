import type { Metadata } from 'next'
import { InfoPage } from '@/components/info-page'
import { siteConfig } from '@/data/site-config'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Use',
  description: `The terms for using the prompts and images on ${siteConfig.name}.`,
  path: '/terms-of-use/',
})

export default function TermsOfUsePage() {
  return (
    <InfoPage
      title="Terms of Use"
      path="/terms-of-use/"
      intro={`By using ${siteConfig.name} you agree to these terms. This is a starting template; review and adapt it to your situation before relying on it.`}
    >
      <h2>Use of the site</h2>
      <p>
        You may browse the site and copy prompts for your own creative projects. Please do not use the site in
        a way that disrupts it or attempts to access it by unauthorized means.
      </p>

      <h2>Prompts and images</h2>
      <p>
        Prompts and reference images are provided as inspiration. Images may have been generated with AI tools
        and are offered for personal reference and download as indicated on each prompt page.
      </p>

      <h2>No guarantees</h2>
      <p>
        AI image generators vary, so we cannot guarantee that a prompt will produce the same or a similar
        result in your tool. The site is provided &ldquo;as is&rdquo; without warranties of any kind.
      </p>

      <h2>Your responsibility</h2>
      <p>
        You are responsible for how you use generated images, including following the terms of the AI tool you
        use and any laws that apply to you.
      </p>

      <h2>Changes</h2>
      <p>These terms may be updated from time to time. Continued use of the site means you accept the current version.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent using the details on the <a href="/contact/">Contact page</a>.
      </p>
    </InfoPage>
  )
}
