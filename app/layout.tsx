import type { Metadata, Viewport } from 'next'
import { Inter, Inter_Tight } from 'next/font/google'
import { SiteChrome } from '@/components/site-chrome'
import { ThemeProvider } from '@/components/theme-provider'
import { getHeadAdCode } from '@/lib/ad-code'
import { siteConfig } from '@/data/site-config'
import { categories, getAllTags } from '@/lib/content'
import { websiteJsonLd } from '@/lib/seo'
import { getPublicSiteSettings } from '@/lib/public-settings'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-inter-tight', display: 'swap' })
const SECOND_MONETAG_SCRIPT = 'https://5gvci.com/act/files/tag.min.js?z=12165667'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings()
  const favicon = settings.favicon_url
  return {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Premium AI Image Prompt Library`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    locale: 'en_US',
    title: `${siteConfig.name} — Premium AI Image Prompt Library`,
    description: siteConfig.description,
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: favicon ? [{ url: favicon }] : '/icon.svg' },
  verification: {
    ...(settings.google_search_console_verification
      ? { google: settings.google_search_console_verification }
      : {}),
    ...(settings.bing_verification_code
      ? { other: { 'msvalidate.01': settings.bing_verification_code } }
      : {}),
  },
  }
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F9FC' },
    { media: '(prefers-color-scheme: dark)', color: '#0E0F16' },
  ],
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSiteSettings()
  const headAdCode = getHeadAdCode(settings.ad_code_head)
  const headAdMatch = headAdCode.match(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/i)
  const headAdScript = headAdMatch?.[2] ?? headAdCode
  const headAdAttributes = headAdMatch?.[1]
  const headAdScriptSrc = headAdAttributes?.match(/\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i)
  const headAdScriptProps = headAdScriptSrc
    ? Object.fromEntries(
        Array.from((headAdAttributes ?? '').matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))
          .filter(([ , name ]) => name.toLowerCase() !== 'src')
          .map(([ , name, doubleQuoted, singleQuoted, unquoted ]) => [
            name.toLowerCase(),
            doubleQuoted ?? singleQuoted ?? unquoted ?? true,
          ]),
      )
    : null
  const headerCategories = categories.map(({ name, slug }) => ({ name, slug }))
  const headerTags = getAllTags()
    .slice(0, 8)
    .map(({ slug, label }) => ({ slug, label }))

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${interTight.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__name=window.__name||function(target,name){Object.defineProperty(target,'name',{value:name,configurable:true});return target}`,
          }}
        />
        {headAdScriptSrc && headAdScriptProps ? (
          <script {...headAdScriptProps} src={headAdScriptSrc[1] ?? headAdScriptSrc[2] ?? headAdScriptSrc[3]} />
        ) : headAdScript.trim() ? (
          <script dangerouslySetInnerHTML={{ __html: headAdScript }} />
        ) : null}
        {!headAdCode.includes(SECOND_MONETAG_SCRIPT) ? (
          <script src={SECOND_MONETAG_SCRIPT} data-cfasync="false" async />
        ) : null}
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SiteChrome categories={headerCategories} tags={headerTags} jsonLd={websiteJsonLd()} settings={settings}>
            {children}
          </SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  )
}
