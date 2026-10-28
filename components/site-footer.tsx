import Link from 'next/link'
import { Logo } from '@/components/logo'
import { siteConfig } from '@/data/site-config'
import { categories } from '@/lib/content'

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="font-heading text-sm font-semibold">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-brand-text">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter({ logoSrc }: { logoSrc?: string }) {
  const year = new Date().getFullYear()
  const socialLinks = Object.entries(siteConfig.social).filter(([, url]) => url)

  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo logoSrc={logoSrc} />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              PromptAvero is a curated library of AI image prompts. Browse, copy, and recreate visual
              concepts in your preferred AI image generator.
            </p>
            {socialLinks.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-4">
                {socialLinks.map(([name, url]) => (
                  <li key={name}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm capitalize text-muted-foreground hover:text-brand-text"
                    >
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <FooterColumn title="Explore" links={siteConfig.footerNav.explore} />
          <FooterColumn
            title="Categories"
            links={categories.slice(0, 5).map((category) => ({
              label: category.name,
              href: `/category/${category.slug}/`,
            }))}
          />
          <FooterColumn
            title="Company"
            links={[...siteConfig.footerNav.company, ...siteConfig.footerNav.legal]}
          />
        </div>
        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          © {year} {siteConfig.name}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
