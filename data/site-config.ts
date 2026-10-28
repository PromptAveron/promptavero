export const siteConfig = {
  name: 'PromptAvero',
  tagline: 'A curated library of AI image prompts',
  description:
    'Explore a curated library of powerful AI image prompts. Find inspiration, recreate stunning visuals, and bring your creative ideas to life.',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptavero.com').replace(/\/$/, ''),
  /** Leave empty until a real address is available; the Contact page adapts. */
  contactEmail: '',
  /** Only configured links are rendered in the footer. */
  social: {
    x: '',
    instagram: '',
    github: '',
  } as Record<string, string>,
  pageSize: 12,
  homeLatestCount: 8,
  homeFeaturedCount: 3,
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Explore Prompts', href: '/prompts/' },
    { label: 'Latest Prompts', href: '/prompts/?sort=newest' },
  ],
  footerNav: {
    explore: [
      { label: 'Explore Prompts', href: '/prompts/' },
      { label: 'Categories', href: '/category/' },
    ],
    company: [
      { label: 'About', href: '/about/' },
      { label: 'Contact', href: '/contact/' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy-policy/' },
      { label: 'Terms of Use', href: '/terms-of-use/' },
    ],
  },
}

export type SiteConfig = typeof siteConfig
